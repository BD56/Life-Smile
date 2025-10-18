import { CARD_DEFINITIONS } from '../config/cards.js';

// Modales
const modal = document.getElementById('card-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content').querySelector('div');
const modalCloseBtn = document.getElementById('modal-close-btn');

const actionModal = document.getElementById('action-modal');
const actionModalTitle = document.getElementById('action-modal-title');
const actionModalCardPreview = document.getElementById('action-modal-card-preview');
const actionModalPlayBtn = document.getElementById('action-modal-play-btn');
const actionModalDiscardBtn = document.getElementById('action-modal-discard-btn');
const actionModalCancelBtn = document.getElementById('action-modal-cancel-btn');

const choiceModal = document.getElementById('choice-modal');
const choiceModalTitle = document.getElementById('choice-modal-title');
const choiceModalContent = document.getElementById('choice-modal-content');

const targetModal = document.getElementById('target-modal');
const targetModalTitle = document.getElementById('target-modal-title');
const targetModalContent = document.getElementById('target-modal-content');

const rematchContainer = document.getElementById('rematch-container');
const rematchContent = document.getElementById('rematch-content');
const rematchTitle = document.getElementById('rematch-title');
const rematchScores = document.getElementById('rematch-scores');
const rematchVotes = document.getElementById('rematch-votes');
const rematchYesBtn = document.getElementById('rematch-yes-btn');
const rematchHomeBtn = document.getElementById('rematch-home-btn');
const rematchMinimizeBtn = document.getElementById('rematch-minimize-btn');
const rematchShowBtn = document.getElementById('rematch-show-btn');
const rematchTimerEl = document.getElementById('rematch-timer');

let selectedCardForAction = null;

/**
 * Initialise les modales
 */
export function initializeModals(callbacks) {
    // Modal générique
    modalCloseBtn.addEventListener('click', hideCardModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideCardModal();
    });

    // Modal action (jouer/défausser)
    actionModalPlayBtn.addEventListener('click', () => {
        if (selectedCardForAction && callbacks.onPlayCard) {
            callbacks.onPlayCard(selectedCardForAction);
        }
        hideActionModal();
    });

    actionModalDiscardBtn.addEventListener('click', () => {
        if (selectedCardForAction && callbacks.onDiscardCard) {
            callbacks.onDiscardCard(selectedCardForAction);
        }
        hideActionModal();
    });

    actionModalCancelBtn.addEventListener('click', hideActionModal);
    actionModal.addEventListener('click', (e) => {
        if (e.target === actionModal) hideActionModal();
    });

    // Modal cible
    targetModal.addEventListener('click', (e) => {
        if (e.target === targetModal) hideTargetModal();
    });

    // Modal rematch
    rematchYesBtn.addEventListener('click', () => {
        if (callbacks.onRematchYes) callbacks.onRematchYes();
    });

    rematchHomeBtn.addEventListener('click', () => {
        if (callbacks.onRematchHome) callbacks.onRematchHome();
    });

    rematchMinimizeBtn.addEventListener('click', () => {
        rematchContainer.classList.remove('flex');
        rematchContainer.classList.add('hidden');
        rematchShowBtn.classList.remove('hidden');
    });

    rematchShowBtn.addEventListener('click', () => {
        rematchContainer.classList.add('flex');
        rematchContainer.classList.remove('hidden');
        rematchShowBtn.classList.add('hidden');
    });
}

/**
 * Affiche la modal de détail de cartes
 */
export function showCardModal(title, cardObjects, createCardElementFn) {
    modalTitle.textContent = title;
    modalContent.innerHTML = '';

    // Tri par catégorie
    cardObjects.sort((a, b) => {
        const catA = CARD_DEFINITIONS[a.id].category.toUpperCase();
        const catB = CARD_DEFINITIONS[b.id].category.toUpperCase();
        if (catA < catB) return -1;
        if (catA > catB) return 1;
        return 0;
    });

    if (cardObjects.length === 0) {
        modalContent.innerHTML = `<p class="text-gray-500">Aucune carte dans cette zone.</p>`;
    } else {
        cardObjects.forEach(card => {
            modalContent.appendChild(createCardElementFn(card, 'modal'));
        });
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Masque la modal de détail
 */
export function hideCardModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

/**
 * Affiche la modal jouer/défausser
 */
export function showPlayOrDiscardModal(card, createCardElementFn) {
    selectedCardForAction = card;
    const cardDef = CARD_DEFINITIONS[card.id];
    actionModalTitle.textContent = `Jouer ou défausser "${cardDef.name}" ?`;
    actionModalCardPreview.innerHTML = '';
    const cardEl = createCardElementFn(card, 'modal');
    actionModalCardPreview.appendChild(cardEl);
    actionModal.classList.remove('hidden');
    actionModal.classList.add('flex');
}

/**
 * Masque la modal action
 */
export function hideActionModal() {
    selectedCardForAction = null;
    actionModal.classList.add('hidden');
    actionModal.classList.remove('flex');
}

/**
 * Affiche la modal de sélection de cible
 */
export function showTargetSelectionModal(actionType, card, gameState, userId, onTargetSelected) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    
    targetModalContent.innerHTML = '';
    
    if (actionType === 'malus') {
        targetModalTitle.textContent = `Choisissez la cible pour ${CARD_DEFINITIONS[card.id].name}`;
    } else if (actionType === 'troc') {
        targetModalTitle.textContent = "Choisissez un adversaire pour le Troc";
    } else if (actionType === 'anniversaire') {
        targetModalTitle.textContent = "Qui vous offre un salaire ?";
    }

    playerKeys.forEach(key => {
        if (key !== myPlayerKey) {
            const targetPlayer = gameState.players[key];
            
            let canTarget = true;
            if (actionType === 'anniversaire') {
                const hasAvailableSalary = targetPlayer.played.some(c => 
                    CARD_DEFINITIONS[c.id].category === 'salaire' && !c.invested
                );
                canTarget = hasAvailableSalary;
            }

            const targetBtn = document.createElement('button');
            targetBtn.className = `w-full p-3 rounded-lg font-bold transition-all ${
                canTarget 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`;
            
            const smiles = targetPlayer.played.reduce((acc, c) => {
                const def = CARD_DEFINITIONS[c.id];
                return def.type !== 'malus' ? acc + def.smiles : acc;
            }, 0);
            
            targetBtn.textContent = `${targetPlayer.name || key} (${smiles} 😊)`;
            targetBtn.disabled = !canTarget;
            
            if (canTarget) {
                targetBtn.onclick = () => {
                    onTargetSelected(key);
                    hideTargetModal();
                };
            }
            
            targetModalContent.appendChild(targetBtn);
        }
    });

    targetModal.classList.remove('hidden');
    targetModal.classList.add('flex');
}

/**
 * Masque la modal cible
 */
export function hideTargetModal() {
    targetModal.classList.add('hidden');
    targetModal.classList.remove('flex');
}

/**
 * Affiche la modal Chance
 */

export function showChanceModal(cards, createCardElementFn, onCardSelected) {
    choiceModalTitle.textContent = "🎲 Chance ! Choisissez une carte pour votre main :";
    choiceModalContent.innerHTML = '';
    
    cards.forEach(card => {
        const cardEl = createCardElementFn(card, 'choice');
        cardEl.onclick = () => {
            onCardSelected(card);
            hideChoiceModal();
        };
        choiceModalContent.appendChild(cardEl);
    });
    
    choiceModal.classList.remove('hidden');
    choiceModal.classList.add('flex');
}


/**
 * Masque la modal choix
 */
export function hideChoiceModal() {
    choiceModal.classList.add('hidden');
    choiceModal.classList.remove('flex');
}

/**
 * Affiche l'écran rematch
 */
export function showRematchScreen() {
    rematchContainer.classList.remove('hidden');
    rematchContainer.classList.add('flex');
    rematchContent.classList.remove('hidden');
    rematchShowBtn.classList.add('hidden');
}

/**
 * Masque l'écran rematch
 */
export function hideRematchScreen() {
    rematchContainer.classList.add('hidden');
    rematchContainer.classList.remove('flex');
    rematchShowBtn.classList.add('hidden');
}

/**
 * Rend l'écran rematch
 */
export function renderRematchScreen(gameState, userId) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    
    // Scores
    const scores = playerKeys.map(key => ({
        key,
        name: gameState.players[key].name || key,
        score: gameState.players[key].played.reduce((acc, c) => {
            const def = CARD_DEFINITIONS[c.id];
            return def.type !== 'malus' ? acc + def.smiles : acc;
        }, 0)
    })).sort((a, b) => b.score - a.score);

    rematchScores.innerHTML = '';
    scores.forEach((player, index) => {
        const scoreEl = document.createElement('p');
        scoreEl.className = 'text-lg font-semibold';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        scoreEl.textContent = `${medal} ${player.name}: ${player.score} 😊`;
        rematchScores.appendChild(scoreEl);
    });
    
    // Boutons
    rematchYesBtn.disabled = gameState.rematchVotes[myPlayerKey] === true || gameState.rematchVotes[myPlayerKey] === 'no';
    rematchHomeBtn.disabled = gameState.rematchVotes[myPlayerKey] === 'no';

    // Votes
    const getVoteSymbol = (vote) => {
        if (vote === true) return '<span class="text-green-500">✔</span>';
        if (vote === 'no') return '<span class="text-red-500">✗</span>';
        return '<span>&nbsp;</span>';
    };

    rematchVotes.innerHTML = '';
    playerKeys.forEach(key => {
        const voteEl = document.createElement('span');
        voteEl.innerHTML = `${gameState.players[key].name || key}: ${getVoteSymbol(gameState.rematchVotes[key])}`;
        rematchVotes.appendChild(voteEl);
    });
}

/**
 * Démarre le compte à rebours rematch
 */
export function startRematchCountdown(callback) {
    let countdown = 5;
    rematchTimerEl.textContent = `Nouvelle partie dans ${countdown}...`;
    
    const interval = setInterval(() => {
        countdown--;
        rematchTimerEl.textContent = `Nouvelle partie dans ${countdown}...`;
        
        if (countdown <= 0) {
            clearInterval(interval);
            rematchTimerEl.textContent = '';
            if (callback) callback();
        }
    }, 1000);
    
    return interval;
}