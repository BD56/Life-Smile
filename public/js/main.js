// Services
import { 
    initializeFirebase, 
    setupAuth, 
    listenToGame,
    voteEndGame,
    voteRematch,
    finishGame,
    resetGameForRematch
}

// Services
from './services/firebase-service.js';
import * as GameService from './services/game.js';
import * as GameActions from './services/game-actions.js';
import * as ChatService from './services/chat.js';
import * as PresenceService from './services/presence-service.js';
import * as MobileService from './services/mobile-service.js'; 
import * as FirebaseService from './services/firebase-service.js';
import { updateGame } from './services/firebase-service.js';  


// UI
import * as HomeUI from './ui/home.js';
import * as LobbyUI from './ui/lobby.js';
import * as BoardUI from './ui/board.js';
import * as ModalsUI from './ui/modals.js';
import * as OpponentsUI from './ui/opponents.js';
import * as PresenceUI from './ui/presence-ui.js';
import { showConfirm, showAlert, initializeConfirmModal } from './ui/confirm-modal.js';
import { 
    renderGame, 
    renderPlayerBoard, 
    showBoard, 
    hideBoard,
    createCardElement,
    showLocalErrorMessage
} from './ui/board.js';


// Utils
import { getGameCodeFromUrl, sortPlayerKeys } from './utils/helpers.js';
import { canPlayCard } from './utils/card-helpers.js';
import { CARD_DEFINITIONS } from './config/cards.js';  



// Importer les fonctions header
import { 
    initHeaderNavigation, 
    updateHeaderBackButton, 
    showRulesModal,
    returnToHome 
} from './header-navigation.js'; // Créer ce fichier


// État global
let db, auth;
let userId = null;
let unsubscribeGame = null;
let currentGameId = null;
let localGameState = null;
let rematchCountdownInterval = null;

/**
 * Retourne les callbacks pour le plateau
 */
function getBoardCallbacks() {
    return {
        onDrawCard: handleDrawCard,
        onDrawFromDiscard: handleDrawFromDiscard,
        onPlayCard: handlePlayCard,
        onDiscardCard: handleDiscardCard,
        onPlayPistonMetier: handlePlayPistonMetier,
        onVengeanceSelect: handleVengeanceSelect,
        onGiveSalary: handleGiveSalary,
        onResign: handleResign,
        onDivorce: handleDivorce,
        onEndGameVote: handleEndGameVote,
        onStopRainbow: handleStopRainbow,
        onChanceSelection: handleChanceSelection  // ✅ AJOUTÉ
    };
}
// Éléments de navigation
const appHeader = document.getElementById('app-header');
const headerHomeBtn = document.getElementById('header-home-btn');
const headerBackBtn = document.getElementById('header-back-btn');
const headerRulesBtn = document.getElementById('header-rules-btn'); // ✅ AJOUTÉ
//   const homeRulesBtn = document.getElementById('home-rules-btn'); // ✅ AJOUTÉ

/**
 * Affiche l'écran spécifié
 */
function showScreen(screen) {
    HomeUI.hideHome();
    LobbyUI.hideLobby();
    BoardUI.hideBoard();
    
    if (screen === 'home') {
        HomeUI.showHome();
        ChatService.showChatButton(false);
        updateHeaderBackButton('home');
    } else if (screen === 'lobby') {
        LobbyUI.showLobby();
        ChatService.showChatButton(true);
        updateHeaderBackButton('lobby');
    } else if (screen === 'game') {
        BoardUI.showBoard();
        ChatService.showChatButton(true);
        updateHeaderBackButton('game');
    }
}

// ============ ACTIONS DE JEU ============

async function handleDrawCard() {
    const playerKeys = Object.keys(localGameState.players);
    const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
    
    // ✨ NOUVEAU : Réinitialiser les skips AVANT de piocher
    await PresenceService.resetPlayerSkips(currentGameId, myPlayerKey);
    
    await GameService.handleDrawCard(currentGameId, localGameState, userId);
}


async function handleDrawFromDiscard() {
    await GameService.handleDrawFromDiscard(currentGameId, localGameState, userId);
}

async function handlePlayCard(card) {
    const playerKeys = Object.keys(localGameState.players);
    const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
    const player = localGameState.players[myPlayerKey];
    
    // Vérifier si la carte peut être jouée
    const allOpponents = playerKeys
        .filter(k => k !== myPlayerKey)
        .map(k => localGameState.players[k]);
    
    if (!canPlayCard(card, player.played, allOpponents)) {
        const cardDef = CARD_DEFINITIONS[card.id];
        showLocalErrorMessage(`⚠️ ${cardDef.name} : Conditions non remplies !`);
        return;
    }
    
    // ✨ NOUVEAU : Réinitialiser les skips AVANT de jouer
    await PresenceService.resetPlayerSkips(currentGameId, myPlayerKey);
    
    const result = await GameService.handlePlayCard(currentGameId, localGameState, userId, card);
    
    if (result.success && result.requiresTarget) {
        // Afficher modal de sélection de cible
        if (result.actionType === 'troc') {
            ModalsUI.showTargetSelectionModal('troc', card, localGameState, userId, async (targetKey) => {
                await GameActions.handleTrocWithTarget(currentGameId, localGameState, userId, card, targetKey);
            });
        } else if (result.actionType === 'anniversaire') {
            ModalsUI.showTargetSelectionModal('anniversaire', card, localGameState, userId, async (targetKey) => {
                await GameActions.handleAnniversaireWithTarget(currentGameId, localGameState, userId, card, targetKey);
            });
        } else {
            // Malus avec cible
            ModalsUI.showTargetSelectionModal('malus', card, localGameState, userId, async (targetKey) => {
                await GameActions.handleMalusWithTarget(currentGameId, localGameState, userId, result.card || card, targetKey);
            });
        }
    }
}

async function handleDiscardCard(card) {
    await GameService.handleDiscardCard(currentGameId, localGameState, userId, card);
}

async function handlePlayPistonMetier(card) {
    await GameActions.handlePlayPistonMetier(currentGameId, localGameState, userId, card);
}

async function handleVengeanceSelect(card) {
    ModalsUI.showTargetSelectionModal('malus', card, localGameState, userId, async (targetKey) => {
        await GameActions.handleVengeanceSelection(currentGameId, localGameState, userId, card, targetKey);
    });
}

async function handleGiveSalary(card) {
    await GameActions.handleGiveSalary(currentGameId, localGameState, userId, card);
}

async function handleChanceSelection(card) {
    console.log('🎲 Carte Chance sélectionnée:', card);
    
    const result = await GameActions.handleChanceSelection(currentGameId, localGameState, userId, card);
    
    if (result.success) {
        // ✅ La carte est maintenant dans la main du joueur
        // ✅ Le turnState est 'needs_to_play'
        // ✅ Le joueur peut choisir quelle carte jouer
        console.log('✅ Carte ajoutée à la main, à vous de jouer !');
        
        // ❌ NE PAS rejouer automatiquement la carte
        // Le joueur doit choisir lui-même quelle carte jouer depuis sa main
    }
}

async function handleResign() {
    const confirmed = await showConfirm(
        'Êtes-vous sûr de vouloir démissionner ?',
        'Démission'
    );
    if (confirmed) {
        await GameActions.handleResign(currentGameId, localGameState, userId);
    }
}

async function handleDivorce() {
    const confirmed = await showConfirm(
        'Êtes-vous sûr de vouloir divorcer ?',
        'Divorce'
    );
    if (confirmed) {
        await GameActions.handleDivorce(currentGameId, localGameState, userId);
    }
}

async function handleStopRainbow() {
    await GameActions.handleStopRainbow(currentGameId, localGameState, userId);
}

async function handleEndGameVote() {
    const playerKeys = Object.keys(localGameState.players);
    const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
    
    if (localGameState.endGameVotes[myPlayerKey]) return;
    
    await voteEndGame(currentGameId, myPlayerKey);
}

function handleGameStartFromLobby() {
    // Appelé après le démarrage depuis le lobby
    console.log("Partie lancée depuis le lobby");
}

async function handleRematchYes() {
    const playerKeys = Object.keys(localGameState.players);
    const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
    await voteRematch(currentGameId, myPlayerKey, true);
}

async function handleRematchHome() {
    const playerKeys = Object.keys(localGameState.players);
    const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
    await voteRematch(currentGameId, myPlayerKey, 'no');
    window.location.href = window.location.href.split('?')[0].split('#')[0];
}

// Écouter les changements de mode de vue des adversaires
window.addEventListener('opponentsViewModeChanged', () => {
    if (localGameState && userId) {
        renderFullGame();
    }
});
 //Point d'entrée de l'application
(async () => {
    try {
        // Initialiser Firebase
        const firebaseApp = initializeFirebase();
        db = firebaseApp.db;
        auth = firebaseApp.auth;
        window.db = db; // Pour le chat



        // Initialiser le mode mobile
        const isMobile = MobileService.initializeMobileMode();
        
        if (isMobile) {
            console.log('📱 Mode mobile détecté');
            
            MobileService.onOrientationChange((orientation) => {
                console.log(`📱 Orientation: ${orientation}`);
                if (localGameState && userId) {
                    renderFullGame();
                }
            });
        }

        // Initialiser les modules UI
        HomeUI.initializeHome(handleGameCreatedOrJoined, handleGameCreatedOrJoined);
        LobbyUI.initializeLobby(handleGameStartFromLobby);
        BoardUI.initializeBoard({
            onDrawCard: handleDrawCard,
            onResign: handleResign,
            onDivorce: handleDivorce,
            onEndGameVote: handleEndGameVote,
            onStopRainbow: handleStopRainbow
        });
        ModalsUI.initializeModals({
            onPlayCard: handlePlayCard,
            onDiscardCard: handleDiscardCard,
            onRematchYes: handleRematchYes,
            onRematchHome: handleRematchHome
        });
        OpponentsUI.initializeOpponents();
        initializeConfirmModal(); // ✅ Ajouter cette ligne
        ChatService.initializeChat();
        initHeaderNavigation();


        headerBackBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm(
                'Retourner à l\'accueil ?',
                'Quitter la partie'
            );
            if (confirmed) {
                if (unsubscribeGame) unsubscribeGame();
                showScreen('home');
                window.history.replaceState({}, '', window.location.pathname);
            }
        });

        // Authentification
        setupAuth(async (uid) => {
            userId = uid;
            window.userId = uid; // Pour le chat et les modales
            
            // ✅ Vérifier URL pour rejoindre automatiquement
            const gameCode = getGameCodeFromUrl();
            if (gameCode) {
                // Importer les fonctions Firebase
                const { gameExists, joinGame } = await import('./services/firebase-service.js');
                
                const exists = await gameExists(gameCode);
                if (exists) {
                    const joined = await joinGame(gameCode, userId);
                    if (joined) {
                        handleGameCreatedOrJoined(gameCode, false);
                    } else {
                        // Déjà dans la partie, juste se connecter
                        handleGameCreatedOrJoined(gameCode, false);
                    }
                } else {
                    // Partie n'existe pas, afficher erreur et retour accueil
                    await showAlert(`La partie "${gameCode}" n'existe pas ou a expiré.`, 'Partie introuvable');
                    window.history.replaceState({}, '', window.location.pathname);
                }
            }
        });

    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        // Afficher un message dans le DOM au lieu d'alert
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6;">
                <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #ef4444; font-size: 1.5rem; margin-bottom: 1rem;">❌ Erreur de connexion</h2>
                    <p style="color: #6b7280;">Vérifiez la configuration Firebase dans la console.</p>
                </div>
            </div>
        `;
    }
    /**
 * ✅ NOUVEAU : Initialise le système de règles
 */
function initializeRulesSystem() {
    const rulesModal = document.getElementById('rules-modal');
    const rulesModalCloseBtn = document.getElementById('rules-modal-close-btn');
    const rulesModalContent = document.getElementById('rules-modal-content');
    
    // Générer le contenu des règles
    const rulesHTML = `
        <div class="space-y-6">
            <section>
                <h3 class="text-2xl font-bold text-purple-600 mb-3">🎯 Objectif du jeu</h3>
                <p class="text-gray-700 leading-relaxed">
                    Accumulez le maximum de <strong>Smiles (😊)</strong> en jouant des cartes qui représentent votre vie. 
                    Chaque carte a une valeur en Smiles. Le joueur avec le plus de Smiles à la fin gagne !
                </p>
                <p class="text-gray-700 leading-relaxed mt-2">
                    <strong>Stratégie :</strong> Construisez votre vie... tout en envoyant des <strong>Malus</strong> à vos adversaires pour ruiner la leur ! 😈
                </p>
            </section>

            <section>
                <h3 class="text-2xl font-bold text-blue-600 mb-3">🃏 Déroulement d'un tour</h3>
                <ol class="list-decimal list-inside space-y-2 text-gray-700">
                    <li><strong>Piocher</strong> : Prenez une carte de la pioche (ou de la défausse si disponible)</li>
                    <li><strong>Jouer</strong> : Jouez UNE carte de votre main sur votre plateau</li>
                    <li><strong>Fin du tour</strong> : Le tour passe au joueur suivant</li>
                </ol>
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-3">
                    <p class="text-sm"><strong>⏱️ Attention :</strong> Vous avez 2 minutes pour jouer (puis 90 secondes aux tours suivants). Si vous ne jouez pas à temps, votre tour est passé automatiquement !</p>
                </div>
            </section>

            <section>
                <h3 class="text-2xl font-bold text-green-600 mb-3">📚 Types de cartes</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
                        <h4 class="font-bold text-blue-700 mb-2">🎓 Professionnel (Bleu)</h4>
                        <ul class="text-sm space-y-1">
                            <li>• <strong>Études</strong> : Nécessaires pour certains métiers</li>
                            <li>• <strong>Métiers</strong> : Génèrent des salaires</li>
                            <li>• <strong>Salaires</strong> : Donnent des Smiles</li>
                        </ul>
                    </div>
                    <div class="bg-pink-50 border-2 border-pink-400 rounded-lg p-4">
                        <h4 class="font-bold text-pink-700 mb-2">💕 Personnel (Rose)</h4>
                        <ul class="text-sm space-y-1">
                            <li>• <strong>Flirts</strong> : Permet de se marier</li>
                            <li>• <strong>Mariage</strong> : Nécessaire pour avoir des enfants</li>
                            <li>• <strong>Enfants</strong> : Donnent des Smiles</li>
                        </ul>
                    </div>
                    <div class="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                        <h4 class="font-bold text-green-700 mb-2">🏠 Acquisitions (Vert)</h4>
                        <ul class="text-sm space-y-1">
                            <li>• Maison, voiture, animal, etc.</li>
                            <li>• Donnent des Smiles directs</li>
                        </ul>
                    </div>
                    <div class="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                        <h4 class="font-bold text-red-700 mb-2">💀 Malus (Rouge)</h4>
                        <ul class="text-sm space-y-1">
                            <li>• Envoyés aux adversaires</li>
                            <li>• Enlèvent des Smiles ou font perdre des cartes</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section>
                <h3 class="text-2xl font-bold text-purple-600 mb-3">⭐ Cartes spéciales</h3>
                <div class="space-y-3">
                    <div class="bg-purple-50 border-l-4 border-purple-500 p-3">
                        <strong class="text-purple-700">🎲 Chance :</strong> Piochez 3 cartes, choisissez-en 1 pour votre main. Les 2 autres retournent dans la pioche. La carte Chance est retirée du jeu.
                    </div>
                    <div class="bg-indigo-50 border-l-4 border-indigo-500 p-3">
                        <strong class="text-indigo-700">🌈 Arc-en-ciel :</strong> Jouez jusqu'à 3 cartes d'affilée !
                    </div>
                    <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                        <strong class="text-yellow-700">😈 Vengeance :</strong> Renvoyez un malus reçu à un adversaire.
                    </div>
                    <div class="bg-pink-50 border-l-4 border-pink-500 p-3">
                        <strong class="text-pink-700">🎁 Anniversaire :</strong> Un adversaire vous donne un de ses salaires.
                    </div>
                </div>
            </section>

            <section>
                <h3 class="text-2xl font-bold text-orange-600 mb-3">⚡ Actions volontaires</h3>
                <div class="space-y-2 text-gray-700">
                    <p><strong>💼 Démissionner :</strong> Défaussez votre métier (et tous les salaires associés) pour en jouer un autre.</p>
                    <p><strong>💔 Divorcer :</strong> Défaussez votre mariage (et tous les enfants). Vous perdez la carte mais pouvez vous remarier.</p>
                </div>
            </section>

            <section>
                <h3 class="text-2xl font-bold text-red-600 mb-3">🏁 Fin de partie</h3>
                <p class="text-gray-700 leading-relaxed">
                    La partie se termine quand :
                </p>
                <ul class="list-disc list-inside space-y-1 text-gray-700 mt-2">
                    <li><strong>Vote unanime :</strong> Tous les joueurs votent pour finir</li>
                    <li><strong>Pioche vide :</strong> Il n'y a plus de cartes à piocher</li>
                    <li><strong>Départ :</strong> Dans une partie à 2 joueurs, si un joueur quitte</li>
                </ul>
                <div class="bg-green-50 border-l-4 border-green-500 p-4 mt-3">
                    <p class="font-bold text-green-700">🏆 Le joueur avec le plus de Smiles gagne !</p>
                </div>
            </section>

            <section>
                <h3 class="text-2xl font-bold text-gray-700 mb-3">💡 Conseils</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-700">
                    <li>Équilibrez vie professionnelle et personnelle pour maximiser vos Smiles</li>
                    <li>N'oubliez pas d'envoyer des Malus aux adversaires !</li>
                    <li>Certains métiers protègent contre certains Malus (fonctionnaires, avocats...)</li>
                    <li>Surveillez la pioche : si elle est basse, préparez votre stratégie finale</li>
                </ul>
            </section>

            <div class="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-lg text-center mt-6">
                <p class="text-lg font-bold">🎮 Amusez-vous bien et que le meilleur gagne ! 😊</p>
            </div>
        </div>
    `;
    
    rulesModalContent.innerHTML = rulesHTML;
    
    // Fonction pour ouvrir la modale
    const showRulesModal = () => {
        rulesModal.classList.remove('hidden');
        rulesModal.classList.add('flex');
    };
    
    // Fonction pour fermer la modale
    const hideRulesModal = () => {
        rulesModal.classList.add('hidden');
        rulesModal.classList.remove('flex');
    };
    
    // Listeners
    if (headerRulesBtn) {
        headerRulesBtn.addEventListener('click', showRulesModal);
    }
    
    if (homeRulesBtn) {
        homeRulesBtn.addEventListener('click', showRulesModal);
    }
    
    rulesModalCloseBtn.addEventListener('click', hideRulesModal);
    
    rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) {
            hideRulesModal();
        }
    });
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !rulesModal.classList.contains('hidden')) {
            hideRulesModal();
        }
    });
}
})();

/**
 * Gère la création ou le rejoignement d'une partie
 */
function handleGameCreatedOrJoined(gameId, isCreator) {
    if (!userId) {
        setTimeout(() => handleGameCreatedOrJoined(gameId, isCreator), 1000);
        return;
    }

    if (unsubscribeGame) unsubscribeGame();
    
    currentGameId = gameId;
    window.currentGameId = gameId;
    ChatService.listenToChat(db, gameId, userId);

    // ✨ NOUVEAU : Initialiser le système de présence
    import('./services/firebase-service.js').then(({ getGameData }) => {
        getGameData(gameId).then(gameState => {
            if (gameState) {
                const playerKeys = Object.keys(gameState.players);
                const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
                
                if (myPlayerKey) {
                    PresenceService.initializePresence(gameId, userId, myPlayerKey);
                }
            }
        });
    });

    unsubscribeGame = listenToGame(
        gameId,
        handleGameStateUpdate,
        (error) => {
            console.error("Erreur partie:", error);
            showScreen('home');
        }
    );
}

/**
 * Gère la mise à jour de l'état du jeu
 */
function handleGameStateUpdate(gameState) {
    // Garder l'ancien état pour comparaison
    const oldGameState = localGameState;
    
    const oldStatus = localGameState ? localGameState.status : null;
    localGameState = gameState;
    window.localGameState = gameState;

    // ✨ NOUVEAU : Détecter les joueurs de retour
    if (oldGameState && localGameState) {
        const playerKeys = Object.keys(localGameState.players);
        const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
        
        playerKeys.forEach(key => {
            const player = localGameState.players[key];
            const oldPlayer = oldGameState.players[key];
            const wasAFK = oldPlayer?.isAFK;
            const isBackNow = !player.isAFK && wasAFK;
            
            if (isBackNow && key !== myPlayerKey) {
                PresenceUI.showPlayerReturnNotification(player.name || key);
            }
        });
    }

    if (gameState.status === 'lobby') {
        showScreen('lobby');
        LobbyUI.renderLobby(gameState, userId, currentGameId);
        
        // ✨ NOUVEAU : Nettoyer la présence au retour lobby
        PresenceService.cleanupPresence();
        PresenceUI.hideFullScreenTimer();
        
    } else if (gameState.status === 'active') {
        showScreen('game');
        renderFullGame();
        
        // ✨ NOUVEAU : Gérer le système de présence
        checkEndGameVotes(gameState);
        checkEmptyDeck(gameState);  // ✅ AJOUTÉ

                
        // ✨ Gérer le système de présence
        handlePresenceSystem(gameState);
        
    } else if (gameState.status === 'paused') {
        // ✨ NOUVEAU : Gérer la pause
        showScreen('game');
        renderFullGame();
        handleGamePause(gameState);


    } else if (gameState.status === 'endgame' || gameState.status === 'finished') {
    showScreen('game');
    renderFullGame();
    
    // ✅ Afficher la modale de rematch
    ModalsUI.showRematchScreen();
    ModalsUI.renderRematchScreen(gameState, userId);
    
    // Nettoyer la présence
    PresenceService.cleanupPresence();
    PresenceUI.hideInlineTimer();
}


    /**
     * ✅ Vérifie si la pioche est vide
     */
    function checkEmptyDeck(gameState) {
        if (!gameState || !gameState.drawPile) return;
        
        if (gameState.drawPile.length === 0 && gameState.status === 'active') {
            console.log('🏁 Pioche vide - Fin de partie');
            const playerKeys = Object.keys(gameState.players);
            finishGame(currentGameId, playerKeys, '🏁 Pioche épuisée ! Partie terminée.');
        }
    }
}
/**
 * ✅ Vérifie si tous les joueurs ont voté pour finir
 */
function checkEndGameVotes(gameState) {
    if (!gameState || !gameState.endGameVotes) return;
    
    const playerKeys = Object.keys(gameState.players);
    const allVoted = playerKeys.every(key => gameState.endGameVotes[key] === true);
    
    console.log('🎯 Vérification votes:', {
        joueurs: playerKeys,
        votes: gameState.endGameVotes,
        tousOntVoté: allVoted
    });
    
    if (allVoted && gameState.status === 'active') {
        console.log('✅ Tous ont voté - Terminaison de la partie');
        finishGame(currentGameId, playerKeys, '🏁 Partie terminée par vote unanime !');
    }
}

/**
 * Rend l'interface complète du jeu
 */
function renderFullGame() {
    BoardUI.renderGame(localGameState, userId, getBoardCallbacks());
    OpponentsUI.renderOpponents(localGameState, userId, BoardUI.renderPlayerBoard);
    // Adapter les cartes pour mobile
    if (MobileService.isMobile()) {
        setTimeout(() => {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                MobileService.adaptCardSize(card);
            });
        }, 100);
    }
}

// ============================================
// 3. NOUVELLE FONCTION : handlePresenceSystem()
// ============================================

/**
 * Gère le système de présence (timers, badges AFK, votes)
 */
/**
 * Gère le système de présence (timers, badges AFK, votes)
 */
/**
 * Gère le système de présence (timers, badges AFK, votes)
 */
/**
 * Gère le système de présence (timers, badges AFK, votes)
 * ✅ VERSION CORRIGÉE - Timer au bon endroit selon le joueur actif
 */
function handlePresenceSystem(gameState) {
    if (!gameState || !userId) return;
    
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const currentPlayerKey = gameState.currentPlayer;
    const currentPlayer = gameState.players[currentPlayerKey];
    
    console.log('🎮 DEBUG Timer:');
    console.log('  - currentPlayerKey:', currentPlayerKey);
    console.log('  - myPlayerKey:', myPlayerKey);
    console.log('  - C\'est mon tour?', currentPlayerKey === myPlayerKey);
    
    // ✅ Vérifier que c'est bien le tour de quelqu'un ET qu'il doit agir
    const isPlayerTurn = currentPlayer && 
        (currentPlayer.turnState === 'needs_to_draw' || currentPlayer.turnState === 'needs_to_play');
    
    // D'abord, arrêter tout timer existant
    PresenceService.stopTurnTimer();
    
    if (isPlayerTurn) {
        // ✅ CAS 1 : C'EST MON TOUR
        if (currentPlayerKey === myPlayerKey) {
            console.log('  ➡️ Mon tour : Timer sur "Votre main"');
            
            // Timer inline à côté de "Votre main"
            PresenceService.startTurnTimer(
                currentGameId,
                gameState,
                currentPlayerKey,
                (seconds, isWarning) => {
                    PresenceUI.updateInlineTimer(seconds, isWarning);
                },
                () => {
                    PresenceUI.hideInlineTimer();
                }
            );
            
            // Retirer les timers des icônes adversaires
            playerKeys.forEach(key => {
                if (key !== myPlayerKey) {
                    const iconElement = document.querySelector(`[data-player-key="${key}"]`);
                    if (iconElement) {
                        PresenceUI.removeTimerFromIcon(iconElement);
                    }
                }
            });
            
        } 
        // ✅ CAS 2 : C'EST LE TOUR D'UN ADVERSAIRE
        else {
            console.log('  ➡️ Tour adversaire : Timer sur icône de', currentPlayerKey);
            
            // IMPORTANT : Cacher le timer de "Votre main"
            PresenceUI.hideInlineTimer();
            
            // Afficher le timer sur l'icône de l'adversaire actif
            const activeIcon = document.querySelector(`[data-player-key="${currentPlayerKey}"]`);
            if (activeIcon) {
                console.log('  ✅ Icône trouvée pour', currentPlayerKey);
                
                PresenceService.startTurnTimer(
                    currentGameId,
                    gameState,
                    currentPlayerKey,
                    (seconds, isWarning) => {
                        PresenceUI.renderTimerOnIcon(activeIcon, seconds, isWarning);
                    },
                    () => {
                        PresenceUI.removeTimerFromIcon(activeIcon);
                    }
                );
            } else {
                console.log('  ❌ Icône NON trouvée pour', currentPlayerKey);
            }
            
            // Retirer le timer des autres adversaires
            playerKeys.forEach(key => {
                if (key !== myPlayerKey && key !== currentPlayerKey) {
                    const iconElement = document.querySelector(`[data-player-key="${key}"]`);
                    if (iconElement) {
                        PresenceUI.removeTimerFromIcon(iconElement);
                    }
                }
            });
        }
    } else {
        // ✅ CAS 3 : Pas de tour actif
        console.log('  ➡️ Pas de tour actif : Tout cacher');
        
        PresenceUI.hideInlineTimer();
        playerKeys.forEach(key => {
            if (key !== myPlayerKey) {
                const iconElement = document.querySelector(`[data-player-key="${key}"]`);
                if (iconElement) {
                    PresenceUI.removeTimerFromIcon(iconElement);
                }
            }
        });
    }
    
    // Afficher les badges AFK
    playerKeys.forEach(key => {
        const player = gameState.players[key];
        const iconElement = document.querySelector(`[data-player-key="${key}"]`);
        
        if (iconElement) {
            if (player.isAFK) {
                PresenceUI.showAFKBadge(iconElement, player.name || key);
            } else {
                PresenceUI.removeAFKBadge(iconElement);
            }
        }
    });
    
    // Gérer le vote d'éjection
    if (gameState.kickVote && gameState.kickVote.active) {
        const myVote = gameState.kickVote.votes[myPlayerKey];
        
        if (myVote === false && myPlayerKey !== gameState.kickVote.targetPlayer) {
            PresenceUI.showKickVoteModal(gameState.kickVote, (vote) => {
                handleKickVote(vote);
            });
        }
    } else {
        PresenceUI.hideKickVoteModal();
    }
}
// ============================================
// 4. NOUVELLE FONCTION : handleGamePause()
// ============================================

/**
 * Gère la pause de la partie
 */
/**
 * ✅ NOUVEAU : Gère la pause de la partie avec détection d'activité
 */
function handleGamePause(gameState) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const absentPlayerKey = gameState.pausedPlayerId;
    const absentPlayer = gameState.players[absentPlayerKey];
    
    // ✅ FIX : Ajouter listeners pour détecter l'activité et fermer la modale
    PresenceUI.showPauseModal(
        absentPlayer?.name || 'Un joueur',
        gameState.pauseEndTime,
        () => {
            // Attendre
            console.log('⏳ En attente du retour...');
        },
        async () => {
            // Quitter
            await handlePlayerLeaveGame();
        },
        async () => {
            // ✅ NOUVEAU : Callback quand l'utilisateur est actif
            console.log('👋 Activité détectée, reprise de la partie');
            if (myPlayerKey === absentPlayerKey) {
                // Je suis le joueur absent qui revient
                await PresenceService.resumeFromPause(currentGameId, gameState);
            }
        }
    );
}


// ============================================
// 5. NOUVELLES FONCTIONS DE GESTION
// ============================================

/**
 * Gère le vote d'éjection
 */
async function handleKickVote(vote) {
    if (!localGameState || !userId) return;
    
    const playerKeys = Object.keys(localGameState.players);
    const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
    
    await PresenceService.voteToKick(currentGameId, localGameState, myPlayerKey, vote);
}

/**
 * Gère la sortie pendant une pause
 */
async function handleQuitFromPause() {
    if (!localGameState || !userId) return;
    
    const playerKeys = Object.keys(localGameState.players);
    const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
    const absentPlayerKey = localGameState.pausedPlayerId;
    
    await PresenceService.endGameDueToAbsence(currentGameId, localGameState, absentPlayerKey);
    
    // Retour à l'accueil
    window.location.href = window.location.href.split('?')[0].split('#')[0];
}

/**
 * ✅ NOUVEAU : Gère le départ d'un joueur de la partie en cours
 */
async function handlePlayerLeaveGame() {
    if (!currentGameId || !userId || !localGameState) return;
    
    
    try {
        const playerKeys = Object.keys(localGameState.players);
        const myPlayerKey = playerKeys.find(key => localGameState.players[key].id === userId);
        const myPlayer = localGameState.players[myPlayerKey];
        
         console.log('👋 Départ du joueur:', myPlayer.name);
        
        // 1. Si partie à 2 joueurs : terminer la partie
        if (playerKeys.length === 2) {
            await updateGame(currentGameId, {
                status: 'finished',
                endReason: 'player_left',
                log: `🚪 ${myPlayer.name || 'Un joueur'} a quitté la partie. Partie terminée.`
            });
            
            console.log('🏁 Partie terminée (2 joueurs)');
        } else {
            // 3. Partie 3+ joueurs : retirer le joueur
            const updates = {
                [`players.${myPlayerKey}`]: null,
                log: `🚪 ${myPlayer.name || 'Un joueur'} a quitté la partie.`
            };
            
            // Si c'était le tour du joueur qui part, passer au suivant
            if (localGameState.currentPlayer === myPlayerKey) {
                const remainingKeys = playerKeys.filter(k => k !== myPlayerKey);
                const currentIndex = playerKeys.indexOf(myPlayerKey);
                const nextIndex = currentIndex % remainingKeys.length;
                const nextPlayer = remainingKeys[nextIndex];
                
                updates.currentPlayer = nextPlayer;
                updates[`players.${nextPlayer}.turnState`] = 'needs_to_draw';
            }
            
            await updateGame(currentGameId, updates);
            
            console.log('👋 Joueur retiré de la partie');
        }
        
        // 4. Nettoyer et retourner à l'accueil
        PresenceService.cleanupPresence();
        if (unsubscribeGame) unsubscribeGame();
        
        window.location.href = window.location.href.split('?')[0].split('#')[0];
        
    } catch (error) {
        console.error('❌ Erreur lors du départ:', error);
        await showAlert(
            "Une erreur est survenue lors de la déconnexion.",
            "Erreur"
        );
    }
}

// Ajouter à la fin du fichier ou dans une fonction de cleanup
window.addEventListener('beforeunload', () => {
    PresenceService.cleanupPresence();
});