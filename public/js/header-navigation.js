// ============================================
// HEADER NAVIGATION - Life Smile (version corrigée)
// ============================================

import * as HomeUI from './ui/home.js';
// ✅ AJOUT : Import des fonctions pour cacher les autres écrans
import { hideLobby } from './ui/lobby.js';
import { hideBoard } from './ui/board.js';
import { showConfirm } from './ui/confirm-modal.js';

let currentView = 'home';

/**
 * Initialise les écouteurs d'événements du header
 */
export function initHeaderNavigation() {
    const headerHomeBtn = document.getElementById('header-home-btn');
    const headerRulesBtn = document.getElementById('header-rules-btn');
    const headerBackBtn = document.getElementById('header-back-btn');

    if (headerHomeBtn) headerHomeBtn.addEventListener('click', handleHomeClick);
    if (headerRulesBtn) headerRulesBtn.addEventListener('click', showRulesModal);
    if (headerBackBtn) headerBackBtn.addEventListener('click', handleBackClick);
}

/**
 * Gère le clic sur le bouton "Life Smile"
 */
async function handleHomeClick() {
    if (currentView === 'lobby' || currentView === 'game') {
        const confirmed = await showConfirm(
            'Êtes-vous sûr de vouloir quitter ? La partie sera perdue.',
            'Quitter la partie'
        );
        if (confirmed) {
            returnToHome();
        }
    } else {
        returnToHome();
    }
}

/**
 * Gère le clic sur "Retour"
 */
async function handleBackClick() {
    if (currentView === 'lobby') {
        const confirmed = await showConfirm(
            'Êtes-vous sûr de vouloir quitter le lobby ?',
            'Quitter le lobby'
        );
        if (confirmed) returnToHome();
    } else if (currentView === 'game') {
        const confirmed = await showConfirm(
            'Êtes-vous sûr de vouloir quitter la partie ?',
            'Quitter la partie'
        );
        if (confirmed) returnToHome();
    }
}

/**
 * Met à jour le bouton "Retour"
 */
export function updateHeaderBackButton(view) {
    currentView = view;
    const headerBackBtn = document.getElementById('header-back-btn');
    if (!headerBackBtn) return;

    if (view === 'home') headerBackBtn.classList.add('hidden');
    else headerBackBtn.classList.remove('hidden');
}

/**
 * Affiche la modale des règles du jeu (version fixe)
 */
export function showRulesModal() {
    // ... (contenu de la fonction inchangé) ...
        const rulesModal = document.getElementById('rules-modal');
    const content = document.getElementById('rules-modal-content');

    if (!rulesModal || !content) {
        console.error('❌ Impossible de trouver la modale des règles dans index.html');
        return;
    }

    // Injecter le contenu seulement si vide
    if (content.innerHTML.trim() === '') {
        // ✅ DEBUT DE VOTRE NOUVEAU CONTENU
        content.innerHTML = `
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
        // ✅ FIN DE VOTRE NOUVEAU CONTENU
    }

    // Afficher la modale
    rulesModal.classList.remove('hidden');
    rulesModal.classList.add('flex');

    // Fermeture (croix + clic fond + Échap)
    const closeBtn = document.getElementById('rules-modal-close-btn');
    const hideModal = () => {
        rulesModal.classList.add('hidden');
        rulesModal.classList.remove('flex');
    };

    if (closeBtn) closeBtn.onclick = hideModal;

    rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) hideModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideModal();
    });
}


/**
 * Retour à l'écran d'accueil
 * ✅ MODIFIÉ : Cache explicitement lobby et board
 */
export function returnToHome() {
    if (window.gameUnsubscribe) {
        window.gameUnsubscribe();
        window.gameUnsubscribe = null;
    }

    window.localGameState = null;
    currentView = 'home';

    // ✅ AJOUT : Cacher les autres écrans
    hideLobby();
    hideBoard();

    // Afficher l'accueil
    HomeUI.showHome();
    updateHeaderBackButton('home');

    // Cacher les boutons spécifiques au jeu/lobby
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const viewModeToggle = document.getElementById('view-mode-toggle');
    if (chatToggleBtn) chatToggleBtn.classList.add('hidden');
    if (viewModeToggle) viewModeToggle.classList.add('hidden');
}

