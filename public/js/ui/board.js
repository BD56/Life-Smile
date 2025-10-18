import { CARD_DEFINITIONS } from '../config/cards.js';
import { countSmiles } from '../utils/card-helpers.js';
import { 
    showCardModal, 
    showPlayOrDiscardModal, 
    showTargetSelectionModal, 
    showChanceModal 
} from './modals.js';

// Éléments DOM
const gameContainer = document.getElementById('game-container');
const playerNameEl = document.getElementById('player-name');
const playerSmilesEl = document.getElementById('player-smiles');
const playerHandEl = document.getElementById('player-hand');
const drawPileEl = document.getElementById('draw-pile');
const drawPileCountEl = document.getElementById('draw-pile-count');
const discardPileEl = document.getElementById('discard-pile');
const statusMessageEl = document.getElementById('status-message');
const logMessageEl = document.getElementById('log-message');
const resignBtn = document.getElementById('resign-btn');
const divorceBtn = document.getElementById('divorce-btn');
const endGameBtn = document.getElementById('end-game-btn');
const stopRainbowBtn = document.getElementById('stop-rainbow-btn');
// const newGameBtn = document.getElementById('new-game-btn');

/**
 * Initialise le plateau
 */
export function initializeBoard(callbacks) {
    drawPileEl.addEventListener('click', () => {
        if (callbacks.onDrawCard) callbacks.onDrawCard();
    });

    resignBtn.addEventListener('click', () => {
        if (callbacks.onResign) callbacks.onResign();
    });

    divorceBtn.addEventListener('click', () => {
        if (callbacks.onDivorce) callbacks.onDivorce();
    });

    endGameBtn.addEventListener('click', () => {
        if (callbacks.onEndGameVote) callbacks.onEndGameVote();
    });

    stopRainbowBtn.addEventListener('click', () => {
        if (callbacks.onStopRainbow) callbacks.onStopRainbow();
    });
}

/**
 * Affiche le plateau
 */
export function showBoard() {
    gameContainer.classList.remove('hidden');
}

/**
 * Masque le plateau
 */
export function hideBoard() {
    gameContainer.classList.add('hidden');
}

/**
 * Rend l'état complet du jeu
 */
export function renderGame(gameState, userId, callbacks) {
    if (!userId || !gameState.players) return;
    
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    // Nom et smiles du joueur
    playerNameEl.textContent = player.name || myPlayerKey;
    playerSmilesEl.textContent = countSmiles(player.played);

    // Main du joueur
    renderPlayerHand(player, gameState, myPlayerKey, callbacks);

    // Plateau du joueur
    renderPlayerBoard('player', player.played, myPlayerKey, gameState, userId, callbacks);

    // Pioche et défausse
    renderDrawAndDiscard(gameState, callbacks);

    // Statuts et messages
    updateStatusMessages(gameState, player, myPlayerKey, playerKeys);

    // Boutons d'action
    updateActionButtons(gameState, player, myPlayerKey, playerKeys);

    // ✅ AJOUTÉ : Afficher modale Chance si nécessaire
    if (player.turnState === 'action_chance_choose_card' && player.cardsForChance?.length > 0) {
        setTimeout(() => {
            showChanceModal(
                player.cardsForChance,
                (card) => createCardElement(card, 'choice', gameState, myPlayerKey, callbacks),
                (selectedCard) => {
                    if (callbacks.onChanceSelection) {
                        callbacks.onChanceSelection(selectedCard);
                    }
                }
            );
        }, 300);
    }
}

/**
 * Rend la main du joueur
 */
function renderPlayerHand(player, gameState, myPlayerKey, callbacks) {
    playerHandEl.innerHTML = '';
    player.hand.forEach((card) => {
        const cardEl = createCardElement(card, 'hand', gameState, myPlayerKey, callbacks);
        playerHandEl.appendChild(cardEl);
    });
}

/**
 * Rend le plateau d'un joueur
 */
export function renderPlayerBoard(playerPrefix, playedCards, playerKey, gameState, userId, callbacks) {
        // ✅ Vérification de sécurité
    if (!gameState || !gameState.players || !gameState.players[playerKey]) {
        console.warn('renderPlayerBoard: gameState ou players non défini', { playerKey });
        return;
    }
    
    const zones = [
        { id: `${playerPrefix}-pro-area`, type: 'pro', title: 'Études / Métier / Salaires' },
        { id: `${playerPrefix}-perso-area`, type: 'perso', title: 'Flirts / Mariage / Enfants' },
        { id: `${playerPrefix}-acquisitions-area`, type: 'acquisition', title: 'Acquisitions / Distinctions' },
        { id: `${playerPrefix}-malus-area`, type: 'malus', title: 'Malus reçus' }
    ];
    
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const boardOwnerState = gameState.players[playerKey].turnState;
    const isMyBoard = playerKey === myPlayerKey;

    zones.forEach(zoneInfo => {
        const zoneEl = document.getElementById(zoneInfo.id);
        if (!zoneEl) return;
        
        const wrapper = zoneEl.querySelector('.card-slot-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';

        let cardsToDisplay = [];
        let cardsForModal = [];

        // Logique d'affichage selon la zone
        if (zoneInfo.id.includes('-pro-area')) {
            cardsForModal = playedCards.filter(c => CARD_DEFINITIONS[c.id].type === 'pro');

            const etudesCards = cardsForModal.filter(c => CARD_DEFINITIONS[c.id].category === 'etudes');
            if (etudesCards.length > 0) {
                const totalEtudes = etudesCards.reduce((acc, c) => acc + (CARD_DEFINITIONS[c.id].value || 1), 0);
                cardsToDisplay.push({ id: 'summary_etudes', summaryValue: totalEtudes, instanceId: 'summary_etudes' });
            }

            const metierCard = cardsForModal.find(c => CARD_DEFINITIONS[c.id].category === 'metier');
            if (metierCard) cardsToDisplay.push(metierCard);

            const salaireCards = cardsForModal.filter(c => CARD_DEFINITIONS[c.id].category === 'salaire' && !c.invested);
            if (salaireCards.length > 0) {
                const totalSalaire = salaireCards.reduce((acc, c) => acc + CARD_DEFINITIONS[c.id].level, 0);
                cardsToDisplay.push({ id: 'summary_salaire', summaryValue: totalSalaire, instanceId: 'summary_salaire' });
            }
        } else if (zoneInfo.id.includes('-perso-area')) {
            cardsForModal = playedCards.filter(c => CARD_DEFINITIONS[c.id].type === 'perso');
            
            const flirtCards = cardsForModal.filter(c => CARD_DEFINITIONS[c.id].category === 'flirt');
            if (flirtCards.length > 0) {
                cardsToDisplay.push({ id: 'summary_flirt', summaryValue: flirtCards.length, instanceId: 'summary_flirt' });
            }

            const mariageCard = cardsForModal.find(c => CARD_DEFINITIONS[c.id].category === 'mariage');
            if (mariageCard) cardsToDisplay.push(mariageCard);

            const adultereCard = cardsForModal.find(c => CARD_DEFINITIONS[c.id].category === 'adultere');
            if (adultereCard) cardsToDisplay.push(adultereCard);

            const enfantCards = cardsForModal.filter(c => CARD_DEFINITIONS[c.id].category === 'enfant');
            if (enfantCards.length > 0) {
                cardsToDisplay.push({ id: 'summary_enfant', summaryValue: enfantCards.length, instanceId: 'summary_enfant' });
            }
        } else if (zoneInfo.id.includes('-malus-area')) {
            cardsForModal = playedCards.filter(c => CARD_DEFINITIONS[c.id].type === 'malus');
            if (cardsForModal.length > 0) {
                cardsToDisplay.push(cardsForModal[cardsForModal.length - 1]);
            }
        } else if (zoneInfo.id.includes('-acquisitions-area')) {
            cardsForModal = playedCards.filter(c => ['acquisition', 'distinction'].includes(CARD_DEFINITIONS[c.id].type));
            const lastCardsOfCategory = {};
            cardsForModal.forEach(card => {
                const category = CARD_DEFINITIONS[card.id].category;
                lastCardsOfCategory[category] = card;
            });
            Object.values(lastCardsOfCategory).forEach(card => cardsToDisplay.push(card));
        }
        
        // Afficher les cartes
        cardsToDisplay.forEach(card => {
            const cardEl = createCardElement(card, 'played', gameState, playerKey, callbacks);
            
            // Gérer les interactions spéciales
            if (isMyBoard && !card.id.startsWith('summary_')) {
                const cardDef = CARD_DEFINITIONS[card.id];
                
                if (boardOwnerState === 'action_vengeance_choose_malus' && cardDef.type === 'malus') {
                    cardEl.classList.add('vengeance-target');
                    cardEl.onclick = () => {
                        if (callbacks.onVengeanceSelect) {
                            callbacks.onVengeanceSelect(card);
                        }
                    };
                } else if (boardOwnerState === 'needs_to_give_salary' && cardDef.category === 'salaire' && !card.invested) {
                    cardEl.classList.add('choice-target');
                    cardEl.onclick = () => {
                        if (callbacks.onGiveSalary) {
                            callbacks.onGiveSalary(card);
                        }
                    };
                }
            }
            wrapper.appendChild(cardEl);
        });

        
        // Click sur la zone pour voir toutes les cartes
        zoneEl.onclick = () => {
            // Ne bloquer que si c'est une zone interactive (vengeance sur malus ou salary)
            if (isMyBoard && boardOwnerState === 'action_vengeance_choose_malus' && zoneInfo.id.includes('-malus-area')) {
                return; // Bloqué uniquement sur zone malus pendant vengeance
            }
            if (isMyBoard && boardOwnerState === 'needs_to_give_salary' && zoneInfo.id.includes('-pro-area')) {
                return; // Bloqué uniquement sur zone pro pendant anniversaire
            }
            
            showCardModal(zoneInfo.title, cardsForModal, (card, location) => 
                createCardElement(card, location, gameState, playerKey, callbacks)
            );
        };
    });
}

/**
 * Crée un élément carte
 */
export function createCardElement(card, location, gameState, playerKey, callbacks) {
    const isSummary = card.id.startsWith('summary_');
    const cardDef = CARD_DEFINITIONS[card.id];
    const cardEl = document.createElement('div');
    cardEl.classList.add('card', `card-type-${cardDef.type}`);
    if (card.invested) cardEl.classList.add('card-invested');
    
    if (isSummary) {
        cardEl.innerHTML = `
            <div class="card-content">
                <div class="card-title">${cardDef.name}</div>
                <div class="card-text">${cardDef.text}</div>
                <div class="text-3xl font-bold">${card.summaryValue}</div>
            </div>
        `;
    } else {
        cardEl.innerHTML = `
            <div class="card-smiles">${cardDef.smiles}</div>
            <div class="card-content">
                <div class="card-title">${cardDef.name}</div>
                <div class="card-text">${cardDef.text}</div>
            </div>
        `;
    }
    
    // Interactions selon location
    if (location === 'hand') {
        cardEl.onclick = () => handleHandCardClick(card, gameState, playerKey, callbacks);
    } else if (location === 'discard') {
        cardEl.style.cursor = 'pointer';
        cardEl.onclick = () => {
            if (callbacks.onDrawFromDiscard) callbacks.onDrawFromDiscard();
        };
    } else {
        cardEl.style.cursor = 'default';
    }
    
    return cardEl;
}

/**
 * Gère le click sur une carte en main
 */
function handleHandCardClick(card, gameState, playerKey, callbacks) {
    if (gameState.currentPlayer !== playerKey) return;
    
    const player = gameState.players[playerKey];
    const cardDef = CARD_DEFINITIONS[card.id];

    if (player.turnState === 'action_piston_choose_metier') {
        if (cardDef.category === 'metier' && callbacks.onPlayPistonMetier) {
            callbacks.onPlayPistonMetier(card);
        } else {
            statusMessageEl.textContent = "Veuillez sélectionner une carte Métier.";
        }
    } else if (player.turnState === 'needs_to_play' || player.turnState === 'action_arc_en_ciel') {
        showPlayOrDiscardModal(card, (c, loc) => createCardElement(c, loc, gameState, playerKey, callbacks));
    }
}

/**
 * Rend pioche et défausse
 */
function renderDrawAndDiscard(gameState, callbacks) {
    drawPileCountEl.textContent = gameState.drawPile.length;
    
    if (gameState.discardPile.length > 0) {
        const lastDiscarded = gameState.discardPile[gameState.discardPile.length - 1];
        const cardEl = createCardElement(lastDiscarded, 'discard', gameState, null, callbacks);
        discardPileEl.innerHTML = cardEl.innerHTML;
        const cardDef = CARD_DEFINITIONS[lastDiscarded.id];
        discardPileEl.className = `card card-type-${cardDef.type}`;
        discardPileEl.style.cursor = 'pointer';
        discardPileEl.onclick = () => {
            if (callbacks.onDrawFromDiscard) callbacks.onDrawFromDiscard();
        };
    } else {
        discardPileEl.className = 'card empty-discard';
        discardPileEl.innerHTML = `<svg class="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg><span class="font-bold mt-1 text-sm">Défausse</span>`;
        discardPileEl.style.cursor = 'default';
    }
}

/**
 * Met à jour les messages de statut
 */
function updateStatusMessages(gameState, player, myPlayerKey, playerKeys) {
    logMessageEl.textContent = gameState.log || '';

    if (gameState.status === 'finished') {
        statusMessageEl.textContent = "Partie terminée !";
        return;
    }

    const isMyTurn = gameState.currentPlayer === myPlayerKey;

    if (isMyTurn) {
        if (player.turnState === 'needs_to_give_salary') {
            statusMessageEl.textContent = "Anniversaire ! Choisissez un salaire à donner.";
        } else if (player.prisonTurns > 0) {
            statusMessageEl.textContent = `Vous êtes en prison ! (${player.prisonTurns} tours restants)`;
        } else if (player.turnState === 'needs_to_draw') {
            statusMessageEl.textContent = "C'est votre tour ! Piochez ou effectuez une action.";
        } else if (player.turnState === 'action_piston_choose_metier') {
            statusMessageEl.textContent = "Carte Piston jouée ! Choisissez un métier de votre main.";
        } else if (player.turnState === 'action_vengeance_choose_malus') {
            statusMessageEl.textContent = "Vengeance ! Choisissez un malus à renvoyer.";
        } else if (player.turnState === 'action_arc_en_ciel') {
            statusMessageEl.textContent = `Arc-en-ciel ! Jouez jusqu'à 3 cartes. (${player.arcEnCielPlays || 0}/3 jouées)`;
        } else if (player.turnState === 'action_chance_choose_card') {
            statusMessageEl.textContent = "🎲 Chance ! Choisissez une carte parmi les 3 proposées.";
        } else {
            statusMessageEl.textContent = "Jouez une carte de votre main.";
        }
    } else {
        const currentPlayerState = gameState.players[gameState.currentPlayer];
        const currentPlayerName = currentPlayerState.name || gameState.currentPlayer;
        if (currentPlayerState.prisonTurns > 0) {
            statusMessageEl.textContent = `${currentPlayerName} est en prison ! (${currentPlayerState.prisonTurns} tours restants)`;
        } else {
            statusMessageEl.textContent = `Au tour de ${currentPlayerName}...`;
        }
    }
}

/**
 * Met à jour les boutons d'action
 */
function updateActionButtons(gameState, player, myPlayerKey, playerKeys) {
    const isMyTurn = gameState.currentPlayer === myPlayerKey;

    if (gameState.status === 'finished') {
        endGameBtn.disabled = true;
        endGameBtn.textContent = "Partie terminée";
        drawPileEl.style.cursor = 'default';
        playerHandEl.classList.add('pointer-events-none', 'opacity-50');
        resignBtn.classList.add('hidden');
        divorceBtn.classList.add('hidden');
        stopRainbowBtn.classList.add('hidden');
        return;
    }

    endGameBtn.classList.remove('hidden');
    stopRainbowBtn.classList.toggle('hidden', player.turnState !== 'action_arc_en_ciel');

    // Démission
    const metierCard = player.played.find(c => CARD_DEFINITIONS[c.id].category === 'metier');
    resignBtn.classList.toggle('hidden', !metierCard);
    if (metierCard) {
        resignBtn.disabled = !isMyTurn || player.turnState !== 'needs_to_draw';
    }

    // Divorce
    const hasMariage = player.played.some(c => CARD_DEFINITIONS[c.id].category === 'mariage');
    divorceBtn.classList.toggle('hidden', !hasMariage);
    divorceBtn.disabled = !isMyTurn || player.turnState !== 'needs_to_draw';

    // Bouton fin de partie
    const playerVoted = gameState.endGameVotes[myPlayerKey];
    const anyOpponentVoted = playerKeys.some(key => key !== myPlayerKey && gameState.endGameVotes[key]);

    endGameBtn.disabled = playerVoted;
    endGameBtn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-yellow-500', 'hover:bg-yellow-600');

    if (playerVoted) {
        endGameBtn.textContent = "Vote enregistré";
    } else if (anyOpponentVoted) {
        endGameBtn.textContent = "Un joueur veut finir. Accepter ?";
        endGameBtn.classList.add('bg-red-500', 'hover:bg-red-600');
    } else {
        endGameBtn.textContent = "Proposer de finir";
        endGameBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
    }

    drawPileEl.style.cursor = 'pointer';
    playerHandEl.classList.remove('pointer-events-none', 'opacity-50');
}

/**
 * Affiche un message d'erreur temporaire (visible uniquement localement)
 */
export function showLocalErrorMessage(message, duration = 5000) {
    const logMessageEl = document.getElementById('log-message');
    if (!logMessageEl) return;
    
    const previousColor = logMessageEl.style.color;
    const previousText = logMessageEl.textContent;
    
    logMessageEl.textContent = message;
    logMessageEl.style.color = '#ef4444'; // Rouge pour erreur
    
    setTimeout(() => {
        // Restaurer seulement si le message n'a pas changé entre-temps
        if (logMessageEl.textContent === message) {
            logMessageEl.textContent = window.localGameState?.log || previousText;
            logMessageEl.style.color = previousColor;
        }
    }, duration);
}


function renderFullGame() {
    BoardUI.renderGame(localGameState, userId, getBoardCallbacks());
    OpponentsUI.renderOpponents(localGameState, userId, BoardUI.renderPlayerBoard);
}