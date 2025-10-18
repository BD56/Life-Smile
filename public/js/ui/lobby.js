import { getBaseUrl, copyToClipboard, shareGame } from '../utils/helpers.js';
import { updatePlayerNickname, updateMaxPlayers, startGameFromLobby } from '../services/firebase-service.js';
import { createFullDeck } from '../utils/card-helpers.js';
import { showAlert, showToast } from './confirm-modal.js';

// Éléments DOM
const lobbyContainer = document.getElementById('lobby-container');
const nicknamePrompt = document.getElementById('nickname-prompt');
const nicknameInput = document.getElementById('nickname-input');
const nicknameSubmitBtn = document.getElementById('nickname-submit-btn');
const nicknameError = document.getElementById('nickname-error');
const lobbyWait = document.getElementById('lobby-wait');
const lobbyStatusMessage = document.getElementById('lobby-status-message');
const lobbyInviteLink = document.getElementById('lobby-invite-link');
const lobbyInviteCode = document.getElementById('lobby-invite-code');
const lobbyCopyUrlBtn = document.getElementById('lobby-copy-url-btn');
const lobbyCopyCodeBtn = document.getElementById('lobby-copy-code-btn');
const lobbyShareBtn = document.getElementById('lobby-share-btn');
const lobbyStartGameBtn = document.getElementById('lobby-start-game-btn');
const lobbyPlayerCount = document.getElementById('lobby-player-count');
const lobbyPlayerList = document.getElementById('lobby-player-list');
const maxPlayersSetting = document.getElementById('max-players-setting');
const maxPlayersSelect = document.getElementById('max-players-select');

let currentGameId = null;

/**
 * Récupère le gameId depuis l'URL
 */
function getGameIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('gameCode');
}

/**
 * Initialise le lobby
 */
export function initializeLobby(onGameStart) {
    nicknameSubmitBtn.addEventListener('click', () => handleSubmitNickname());
    nicknameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSubmitNickname();
    });

    lobbyCopyUrlBtn.addEventListener('click', async () => {
        const result = await copyToClipboard(lobbyInviteLink.value, "Lien");
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            await showAlert(`Copiez ce lien : ${result.message}`, 'Copie manuelle');
        }
    });

    lobbyCopyCodeBtn.addEventListener('click', async () => {
        const result = await copyToClipboard(lobbyInviteCode.value, "Code");
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            await showAlert(`Copiez ce code : ${result.message}`, 'Copie manuelle');
        }
    });

    lobbyShareBtn.addEventListener('click', async () => {
        await shareGame(lobbyInviteCode.value, lobbyInviteLink.value);
    });

    maxPlayersSelect.addEventListener('change', () => handleMaxPlayersChange());

    lobbyStartGameBtn.addEventListener('click', async () => {
        await handleStartGame(onGameStart);
    });
}

/**
 * Affiche le lobby
 */
export function showLobby() {
    lobbyContainer.classList.remove('hidden');
}

/**
 * Masque le lobby
 */
export function hideLobby() {
    lobbyContainer.classList.add('hidden');
}

/**
 * Rend le lobby avec les données actuelles
 */
export function renderLobby(gameState, userId, gameId) {
    currentGameId = gameId;
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const isHost = myPlayerKey === 'p1';
    const maxPlayers = gameState.maxPlayers || 2;

    // Affichage conditionnel prompt pseudo / lobby
    if (gameState.players[myPlayerKey] && gameState.players[myPlayerKey].name) {
        nicknamePrompt.classList.add('hidden');
        lobbyWait.classList.remove('hidden');
    } else {
        nicknamePrompt.classList.remove('hidden');
        lobbyWait.classList.add('hidden');
    }

    // Paramètres host
    if (isHost) {
        maxPlayersSetting.classList.remove('hidden');
        maxPlayersSelect.value = maxPlayers;
    } else {
        maxPlayersSetting.classList.add('hidden');
    }

    // Liens d'invitation
    const baseUrl = getBaseUrl();
    const inviteUrl = `${baseUrl}?gameCode=${gameId}`;
    lobbyInviteLink.value = inviteUrl;
    lobbyInviteCode.value = gameId;
    
    // Liste des joueurs
    lobbyPlayerList.innerHTML = '';
    playerKeys.forEach(key => {
        const player = gameState.players[key];
        const playerEl = document.createElement('div');
        playerEl.className = 'p-2 bg-gray-100 rounded-lg text-center';
        playerEl.textContent = player.name || 'En attente...';
        lobbyPlayerList.appendChild(playerEl);
    });

    // Slots vides
    const emptySlots = maxPlayers - playerKeys.length;
    for (let i = 0; i < emptySlots; i++) {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'p-2 bg-gray-50 border-dashed border-2 border-gray-300 rounded-lg text-center text-gray-400';
        emptySlot.textContent = 'Slot vide';
        lobbyPlayerList.appendChild(emptySlot);
    }

    lobbyPlayerCount.textContent = `${playerKeys.length}/${maxPlayers}`;
    
    // État bouton start
    const allReady = playerKeys.every(key => {
        const player = gameState.players[key];
        return player && typeof player.name === 'string' && player.name.trim().length > 0;
    });
    const minPlayersReached = playerKeys.length >= 2;

    lobbyStartGameBtn.disabled = !allReady || !minPlayersReached;

    // Messages de statut
    if (isHost) {
        lobbyStartGameBtn.classList.remove('hidden');
        if (playerKeys.length < 2) {
            lobbyStatusMessage.textContent = "En attente d'au moins un adversaire...";
        } else if (!allReady) {
            lobbyStatusMessage.textContent = "En attente que tous les joueurs choisissent un pseudo...";
        } else {
            lobbyStatusMessage.textContent = `${playerKeys.length} joueurs prêts ! Vous pouvez commencer.`;
        }
    } else {
        const hostName = gameState.players.p1.name || "L'hôte";
        lobbyStatusMessage.textContent = `En attente que ${hostName} lance la partie.`;
        lobbyStartGameBtn.classList.add('hidden');
    }
}

/**
 * Soumet le pseudo
 */
async function handleSubmitNickname() {
    const name = nicknameInput.value.trim();
    
    if (!name) {
        nicknameError.textContent = "Le pseudo ne peut pas être vide.";
        return;
    }
    if (name.length > 15) {
        nicknameError.textContent = "Le pseudo ne doit pas dépasser 15 caractères.";
        return;
    }

    const gameState = window.localGameState;
    if (!gameState) {
        nicknameError.textContent = "Erreur : état du jeu non disponible.";
        return;
    }

    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === window.userId);

    if (!myPlayerKey) {
        nicknameError.textContent = "Erreur : joueur non trouvé.";
        return;
    }

    // Vérifier si le pseudo est pris
    const nameTaken = playerKeys.some(key => 
        key !== myPlayerKey && gameState.players[key].name === name
    );

    if (nameTaken) {
        nicknameError.textContent = "Ce pseudo est déjà pris.";
        return;
    }
    
    nicknameError.textContent = "";
    
    // ✅ Récupérer le gameId depuis l'URL si currentGameId est null
    const gameId = currentGameId || getGameIdFromUrl();
    
    if (!gameId) {
        nicknameError.textContent = "Erreur : impossible de trouver l'ID de la partie.";
        return;
    }
    
    await updatePlayerNickname(gameId, myPlayerKey, name);
}

/**
 * Change le nombre max de joueurs
 */
async function handleMaxPlayersChange() {
    const newMax = parseInt(maxPlayersSelect.value);
    const gameId = currentGameId || getGameIdFromUrl();
    if (gameId) {
        await updateMaxPlayers(gameId, newMax);
    }
}

/**
 * Lance la partie
 */
async function handleStartGame(callback) {
    const gameState = window.localGameState;
    const playerKeys = Object.keys(gameState.players);
    
    const allReady = playerKeys.every(key => {
        const player = gameState.players[key];
        return player && typeof player.name === 'string' && player.name.trim().length > 0;
    });

    if (!allReady || playerKeys.length < 2) {
        lobbyStatusMessage.textContent = "Erreur : Au moins 2 joueurs avec un pseudo sont requis.";
        return;
    }

    const deck = createFullDeck();
    const gameId = currentGameId || getGameIdFromUrl();
    
    if (!gameId) {
        lobbyStatusMessage.textContent = "Erreur : impossible de trouver l'ID de la partie.";
        return;
    }
    
    const success = await startGameFromLobby(gameId, deck, playerKeys);
    
    if (success && callback) {
        callback();
    }
}

/**
 * Réinitialise les champs du lobby
 */
export function resetLobby() {
    nicknameInput.value = '';
    nicknameError.textContent = '';
}