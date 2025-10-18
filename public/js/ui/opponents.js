/**
 * UI : Affichage adversaires avec BARRE D'ICÔNES
 * 
 * RÈGLES :
 * - 1 adversaire : Plateau toujours affiché (mode classique)
 * - 2+ adversaires : Icônes en haut, plateau dynamique en bas
 * - Tour actif : Son icône devient son plateau automatiquement
 * - Clic sur icône inactive : Modale avec plateau complet
 */

import { CARD_DEFINITIONS } from '../config/cards.js';

const opponentsArea = document.getElementById('opponents-area');

let currentExpandedOpponent = null; // Adversaire dont le plateau est affiché

/**
 * Initialise l'affichage des adversaires
 */
export function initializeOpponents() {
    // Pas besoin de toggle button, tout est automatique
}

/**
 * Rend les adversaires avec le nouveau système
 */
export function renderOpponents(gameState, userId, renderPlayerBoardFn) {
    const playerKeys = Object.keys(gameState.players).sort();
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const opponents = playerKeys.filter(key => key !== myPlayerKey);
    
    opponentsArea.innerHTML = '';
    
    if (opponents.length === 0) return;
    
    // CAS 1 : Un seul adversaire → Mode classique (plateau toujours visible)
    if (opponents.length === 1) {
        renderSingleOpponentClassic(opponents[0], gameState, userId, renderPlayerBoardFn);
        return;
    }
    
    // CAS 2 : 2+ adversaires → Barre d'icônes + plateau dynamique
    renderIconBarMode(opponents, gameState, userId, renderPlayerBoardFn);
}

/**
 * Mode classique pour 1 adversaire (plateau toujours affiché)
 */
function renderSingleOpponentClassic(opponentKey, gameState, userId, renderPlayerBoardFn) {
    const opponent = gameState.players[opponentKey];
    const isCurrentTurn = gameState.currentPlayer === opponentKey;
    
    const container = document.createElement('div');
    container.className = 'single-opponent-container';
    
    // Header
    const header = createOpponentHeader(opponentKey, opponent, isCurrentTurn);
    container.appendChild(header);
    
    // Plateau complet
    const board = createFullBoard(opponentKey, opponent, gameState, userId, renderPlayerBoardFn);
    container.appendChild(board);
    
    opponentsArea.appendChild(container);
}

/**
 * Mode barre d'icônes pour 2+ adversaires
 */
function renderIconBarMode(opponents, gameState, userId, renderPlayerBoardFn) {
    // Conteneur principal
    const mainContainer = document.createElement('div');
    mainContainer.className = 'opponents-icon-bar-mode';
    
    // 1. BARRE D'ICÔNES EN HAUT
    const iconBar = document.createElement('div');
    iconBar.className = 'opponents-icon-bar';
    
    opponents.forEach(key => {
        const opponent = gameState.players[key];
        const isCurrentTurn = gameState.currentPlayer === key;
        
        const icon = createOpponentIcon(key, opponent, isCurrentTurn, gameState, userId, renderPlayerBoardFn);
        iconBar.appendChild(icon);
    });
    
    mainContainer.appendChild(iconBar);
    
    // 2. ZONE DE PLATEAU DYNAMIQUE (en dessous de la barre)
    const boardZone = document.createElement('div');
    boardZone.className = 'opponent-dynamic-board-zone';
    boardZone.id = 'opponent-dynamic-board';
    
    // Déterminer quel plateau afficher
    const currentTurnOpponent = opponents.find(key => gameState.currentPlayer === key);
    
    if (currentTurnOpponent) {
        // Afficher le plateau du joueur actif
        const activeBoardContainer = createActiveBoardContainer(
            currentTurnOpponent,
            gameState.players[currentTurnOpponent],
            gameState,
            userId,
            renderPlayerBoardFn
        );
        boardZone.appendChild(activeBoardContainer);
    } else {
        // Aucun adversaire actif, message placeholder
        boardZone.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p class="text-lg">🎮 En attente du prochain tour</p>
                <p class="text-sm mt-2">Cliquez sur une icône pour voir un plateau</p>
            </div>
        `;
    }
    
    mainContainer.appendChild(boardZone);
    opponentsArea.appendChild(mainContainer);
}

/**
 * Crée une icône d'adversaire cliquable
 */
function createOpponentIcon(key, opponent, isCurrentTurn, gameState, userId, renderPlayerBoardFn) {
    const icon = document.createElement('div');
    icon.className = `opponent-icon-compact ${isCurrentTurn ? 'active-turn-icon' : ''}`;
    icon.dataset.playerKey = key;
    
    const smiles = opponent.played.reduce((acc, c) => {
        const def = CARD_DEFINITIONS[c.id];
        return def.type !== 'malus' ? acc + def.smiles : acc;
    }, 0);
    
    icon.innerHTML = `
        <div class="opponent-icon-avatar-small ${isCurrentTurn ? 'pulsing' : ''}">
            ${opponent.name ? opponent.name[0].toUpperCase() : key}
        </div>
        <div class="opponent-icon-name-small">${opponent.name || key}</div>
        <div class="opponent-icon-stats-small">
            <span>😊 ${smiles}</span>
            <span>🃏 ${opponent.hand.length}</span>
        </div>
        ${isCurrentTurn ? '<div class="turn-indicator-badge">▶ EN JEU</div>' : ''}
        ${opponent.prisonTurns > 0 ? `<div class="prison-badge">⛓️ ${opponent.prisonTurns}</div>` : ''}
    `;
    
    // Clic sur icône inactive → Modale
    if (!isCurrentTurn) {
        icon.style.cursor = 'pointer';
        icon.addEventListener('click', () => {
            showOpponentModal(key, opponent, gameState, userId, renderPlayerBoardFn);
        });
        icon.title = `Cliquer pour voir le plateau de ${opponent.name || key}`;
    } else {
        icon.title = `${opponent.name || key} joue actuellement`;
    }
    
    return icon;
}

/**
 * Crée le conteneur du plateau actif (affiché en dessous des icônes)
 */
function createActiveBoardContainer(key, opponent, gameState, userId, renderPlayerBoardFn) {
    const container = document.createElement('div');
    container.className = 'active-opponent-board-container';
    
    // Header avec le nom
    const header = document.createElement('div');
    header.className = 'active-opponent-header';
    
    const smiles = opponent.played.reduce((acc, c) => {
        const def = CARD_DEFINITIONS[c.id];
        return def.type !== 'malus' ? acc + def.smiles : acc;
    }, 0);
    
    header.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <h3 class="text-xl font-bold text-gray-800">
                    ${opponent.name || key}
                    <span class="current-turn-indicator"></span>
                </h3>
                <p class="text-sm text-gray-600">C'est son tour !</p>
            </div>
            <div class="opponent-stats-large">
                <span class="stat-item">😊 ${smiles} smiles</span>
                <span class="stat-item">🃏 ${opponent.hand.length} cartes</span>
                ${opponent.prisonTurns > 0 ? `<span class="stat-item">⛓️ Prison ${opponent.prisonTurns} tours</span>` : ''}
            </div>
        </div>
    `;
    
    container.appendChild(header);
    
    // Plateau complet
    const board = createFullBoard(key, opponent, gameState, userId, renderPlayerBoardFn);
    container.appendChild(board);
    
    return container;
}

/**
 * Crée un header d'adversaire
 */
function createOpponentHeader(key, opponent, isCurrentTurn) {
    const header = document.createElement('div');
    header.className = 'opponent-header';
    
    const smiles = opponent.played.reduce((acc, c) => {
        const def = CARD_DEFINITIONS[c.id];
        return def.type !== 'malus' ? acc + def.smiles : acc;
    }, 0);
    
    header.innerHTML = `
        <div class="opponent-name">
            ${opponent.name || key}
            ${isCurrentTurn ? '<span class="current-turn-indicator"></span>' : ''}
        </div>
        <div class="opponent-stats">
            <span title="Smiles">😊 ${smiles}</span>
            <span title="Cartes en main">🃏 ${opponent.hand.length}</span>
            ${opponent.prisonTurns > 0 ? `<span title="En prison">⛓️ ${opponent.prisonTurns}</span>` : ''}
        </div>
    `;
    
    return header;
}

/**
 * Crée un plateau complet (4 zones)
 */
function createFullBoard(key, opponent, gameState, userId, renderPlayerBoardFn) {
    const boardDiv = document.createElement('div');
    boardDiv.className = 'opponent-board-full grid grid-cols-2 md:grid-cols-4 gap-3 mt-3';
    boardDiv.innerHTML = `
        <div id="opponent-${key}-pro-area" class="board-zone border-blue-400">
            <h3 class="zone-title bg-blue-500">Professionnel</h3>
            <div class="card-slot-wrapper"></div>
        </div>
        <div id="opponent-${key}-perso-area" class="board-zone border-pink-400">
            <h3 class="zone-title bg-pink-500">Personnel</h3>
            <div class="card-slot-wrapper"></div>
        </div>
        <div id="opponent-${key}-acquisitions-area" class="board-zone border-green-400">
            <h3 class="zone-title bg-green-500">Acquisitions</h3>
            <div class="card-slot-wrapper"></div>
        </div>
        <div id="opponent-${key}-malus-area" class="board-zone border-red-400">
            <h3 class="zone-title bg-red-500">Malus</h3>
            <div class="card-slot-wrapper"></div>
        </div>
    `;
    
    setTimeout(() => {
        if (gameState && gameState.players && gameState.players[key]) {
            renderPlayerBoardFn(`opponent-${key}`, opponent.played, key, gameState, userId, {});
        }
    }, 0);
    
    return boardDiv;
}

/**
 * Affiche une modale avec le plateau d'un adversaire inactif
 */
function showOpponentModal(key, opponent, gameState, userId, renderPlayerBoardFn) {
    // Créer la modale
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50';
    modal.id = 'opponent-detail-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto';
    
    // Header de la modale
    const header = document.createElement('div');
    header.className = 'bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 flex justify-between items-center sticky top-0 z-10';
    
    const smiles = opponent.played.reduce((acc, c) => {
        const def = CARD_DEFINITIONS[c.id];
        return def.type !== 'malus' ? acc + def.smiles : acc;
    }, 0);
    
    header.innerHTML = `
        <div>
            <h2 class="text-2xl font-bold">${opponent.name || key}</h2>
            <div class="text-sm opacity-90 mt-1">
                😊 ${smiles} smiles | 🃏 ${opponent.hand.length} cartes en main
                ${opponent.prisonTurns > 0 ? ` | ⛓️ Prison ${opponent.prisonTurns} tours` : ''}
            </div>
        </div>
        <button class="text-white hover:text-gray-200 text-3xl font-bold modal-close-btn">×</button>
    `;
    
    modalContent.appendChild(header);
    
    // Contenu : plateau complet
    const boardContainer = document.createElement('div');
    boardContainer.className = 'p-6';
    
    const boardDiv = document.createElement('div');
    boardDiv.className = 'opponent-board-full grid grid-cols-2 md:grid-cols-4 gap-3';
    boardDiv.innerHTML = `
        <div id="modal-opponent-${key}-pro-area" class="board-zone border-blue-400">
            <h3 class="zone-title bg-blue-500">Professionnel</h3>
            <div class="card-slot-wrapper"></div>
        </div>
        <div id="modal-opponent-${key}-perso-area" class="board-zone border-pink-400">
            <h3 class="zone-title bg-pink-500">Personnel</h3>
            <div class="card-slot-wrapper"></div>
        </div>
        <div id="modal-opponent-${key}-acquisitions-area" class="board-zone border-green-400">
            <h3 class="zone-title bg-green-500">Acquisitions</h3>
            <div class="card-slot-wrapper"></div>
        </div>
        <div id="modal-opponent-${key}-malus-area" class="board-zone border-red-400">
            <h3 class="zone-title bg-red-500">Malus</h3>
            <div class="card-slot-wrapper"></div>
        </div>
    `;
    
    boardContainer.appendChild(boardDiv);
    modalContent.appendChild(boardContainer);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Rendre le plateau
    setTimeout(() => {
        renderPlayerBoardFn(`modal-opponent-${key}`, opponent.played, key, gameState, userId, {});
    }, 0);
    
    // Fermer la modale
    const closeBtn = header.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Réinitialise les états
 */
export function resetOpponentsExpansion() {
    currentExpandedOpponent = null;
}