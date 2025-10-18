import { generateGameId, updateUrlWithGameCode } from '../utils/helpers.js';
import { createGame, gameExists, joinGame } from '../services/firebase-service.js';

// Éléments DOM
const homeContainer = document.getElementById('home-container');
const startGameBtn = document.getElementById('start-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const gameCodeInput = document.getElementById('game-code-input');
const homeErrorMessageEl = document.getElementById('home-error-message');

/**
 * Initialise l'écran d'accueil
 */
export function initializeHome(onGameCreated, onGameJoined) {
    startGameBtn.addEventListener('click', async () => {
        await handleCreateGame(onGameCreated);
    });

    joinGameBtn.addEventListener('click', async () => {
        await handleJoinGame(onGameJoined);
    });

    gameCodeInput.addEventListener('keyup', async (e) => {
        if (e.key === 'Enter') {
            await handleJoinGame(onGameJoined);
        }
    });
}

/**
 * Crée une nouvelle partie
 */
async function handleCreateGame(callback) {
    if (!window.userId) {
        showError("Authentification en cours, veuillez patienter...");
        return;
    }
    
    clearError();
    const gameId = generateGameId();
    const success = await createGame(gameId, window.userId);
    
    if (success) {
        updateUrlWithGameCode(gameId);
        callback(gameId, true);
    } else {
        showError("Impossible de créer la partie. Vérifiez vos règles de sécurité Firestore.");
    }
}

/**
 * Rejoint une partie existante
 */
async function handleJoinGame(callback) {
    const gameId = gameCodeInput.value.trim();
    
    if (!gameId) {
        showError("Veuillez entrer un code de partie.");
        return;
    }

    if (!window.userId) {
        showError("Authentification en cours...");
        setTimeout(() => handleJoinGame(callback), 1000);
        return;
    }
    
    clearError();
    
    const exists = await gameExists(gameId);
    if (!exists) {
        showError(`La partie "${gameId}" n'existe pas.`);
        return;
    }

    const joined = await joinGame(gameId, window.userId);
    
    if (joined) {
        updateUrlWithGameCode(gameId);
        callback(gameId, false);
    } else {
        showError("Impossible de rejoindre la partie. Elle est peut-être complète.");
    }
}

/**
 * Affiche l'écran d'accueil
 */
export function showHome() {
    const homeContainer = document.getElementById('home-container');
    if (homeContainer) {
        homeContainer.classList.remove('hidden');
    }
    
    // ✅ AJOUTER : Masquer le bouton violet "Règles du jeu" sur la page d'accueil
    const homeRulesBtn = document.getElementById('home-rules-btn');
    if (homeRulesBtn) {
        homeRulesBtn.style.display = 'none'; // Cacher complètement
    }
}

/**
 * Masque l'écran d'accueil
 */
export function hideHome() {
    homeContainer.classList.add('hidden');
}

/**
 * Affiche un message d'erreur
 */
function showError(message) {
    homeErrorMessageEl.textContent = message;
}

/**
 * Efface le message d'erreur
 */
function clearError() {
    homeErrorMessageEl.textContent = "";
}

/**
 * Réinitialise le champ de code
 */
export function resetCodeInput() {
    gameCodeInput.value = '';
}