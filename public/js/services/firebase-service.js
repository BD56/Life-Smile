import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    onSnapshot, 
    getDoc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { firebaseConfig } from '../config/firebase.js';
import { CARD_DEFINITIONS } from '../config/cards.js';

let app, db, auth;

/**
 * Initialise Firebase
 */
export function initializeFirebase() {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    return { db, auth };
}

/**
 * Authentification anonyme
 */
export function setupAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            callback(user.uid);
        } else {
            await signInAnonymously(auth);
        }
    });
}

/**
 * Crée une nouvelle partie
 */
export async function createGame(gameId, userId) {
    const gameRef = doc(db, "games", gameId);

    const gameData = {
    players: {
        p1: {
            id: userId,
            name: null,
            hand: [],
            played: [],
            turnState: 'waiting',
            arcEnCielPlays: 0,
            cardsForChance: [],
            prisonTurns: 0,
            // ✨ NOUVEAUX CHAMPS
            lastSeen: Date.now(),
            isAFK: false,
            consecutiveSkips: 0
        }
    },
        drawPile: [],
        discardPile: [],
        currentPlayer: 'p1',
        status: 'lobby',
        log: 'En attente du lancement...',
        maxPlayers: 2,
        createdAt: Date.now()
    };

    
    const basePlayer = { 
        id: userId, 
        name: null, 
        hand: [], 
        played: [], 
        turnState: 'waiting', 
        arcEnCielPlays: 0, 
        cardsForChance: [], 
        prisonTurns: 0 
    };
    
    const newGame = {
        players: { p1: basePlayer },
        maxPlayers: 2,
        drawPile: [], 
        discardPile: [], 
        currentPlayer: 'p1',
        status: 'lobby',
        log: "Partie créée. En attente d'adversaires.",
        endGameVotes: {},
        rematchVotes: {}
    };



    try {
        await setDoc(gameRef, gameData);
        return true;
    } catch (error) {
        console.error("Erreur lors de la création:", error);
        return false;
    }
}

/**
 * Vérifie si une partie existe
 */
export async function gameExists(gameId) {
    const gameRef = doc(db, "games", gameId);
    const docSnap = await getDoc(gameRef);
    return docSnap.exists();
}

/**
 * Récupère les données d'une partie
 */
export async function getGameData(gameId) {
    const gameRef = doc(db, "games", gameId);
    const docSnap = await getDoc(gameRef);
    return docSnap.exists() ? docSnap.data() : null;
}

/**
 * Rejoint une partie existante
 */
export async function joinGame(gameId, userId) {
    const gameRef = doc(db, "games", gameId);
    const gameState = await getGameData(gameId);
    
    if (!gameState) return false;
    
    const playerKeys = Object.keys(gameState.players);
    const isAlreadyInGame = playerKeys.some(key => gameState.players[key].id === userId);
    
    if (!isAlreadyInGame && gameState.status === 'lobby') {
        const maxPlayers = gameState.maxPlayers || 2;
        if (playerKeys.length < maxPlayers) {
            const newPlayerKey = `p${playerKeys.length + 1}`;
            await updateDoc(gameRef, {
                [`players.${newPlayerKey}`]: { 
                    id: userId, 
                    name: null, 
                    hand: [], 
                    played: [], 
                    turnState: 'waiting', 
                    arcEnCielPlays: 0, 
                    cardsForChance: [], 
                    prisonTurns: 0,
                    // ✨ NOUVEAUX CHAMPS
                    lastSeen: Date.now(),
                    isAFK: false,
                    consecutiveSkips: 0
                }
            });
            return true;
        }
    }
    
    return isAlreadyInGame;
}

/**
 * Écoute les changements d'une partie
 */
export function listenToGame(gameId, callback, errorCallback) {
    const gameRef = doc(db, "games", gameId);
    return onSnapshot(gameRef, 
        (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                errorCallback("La partie n'existe plus");
            }
        },
        (error) => {
            console.error("Listener error:", error);
            errorCallback("Erreur de connexion à la partie");
        }
    );
}

/**
 * Met à jour les données d'une partie
 */
export async function updateGame(gameId, updates) {
    try {
        const gameRef = doc(db, 'games', gameId);
        await updateDoc(gameRef, updates);
        return true;
    } catch (error) {
        console.error('Erreur mise à jour partie:', error);
        return false;
    }
}

/**
 * Met à jour le pseudo d'un joueur
 */
export async function updatePlayerNickname(gameId, playerKey, nickname) {
    return await updateGame(gameId, {
        [`players.${playerKey}.name`]: nickname
    });
}

/**
 * Met à jour le nombre maximum de joueurs
 */
export async function updateMaxPlayers(gameId, maxPlayers) {
    return await updateGame(gameId, {
        maxPlayers: maxPlayers
    });
}

/**
 * Lance la partie depuis le lobby
 */
export async function startGameFromLobby(gameId, deck, playerKeys) {
    const updates = {};
    const handsSmiles = {};

    // Distribuer les mains
    playerKeys.forEach(key => {
        const hand = deck.splice(0, 5);
        updates[`players.${key}.hand`] = hand;
        updates[`players.${key}.turnState`] = 'waiting';
        handsSmiles[key] = hand.reduce((acc, c) => {
            const cardDef = CARD_DEFINITIONS[c.id];
            return acc + (cardDef.smiles || 0);
        }, 0);
    });

    // Déterminer le premier joueur (celui avec le plus de smiles)
    let firstPlayer = 'p1';
    let maxSmiles = -1;
    Object.entries(handsSmiles).forEach(([key, smiles]) => {
        if (smiles > maxSmiles) {
            maxSmiles = smiles;
            firstPlayer = key;
        }
    });

    updates[`players.${firstPlayer}.turnState`] = 'needs_to_draw';
    updates.drawPile = deck;
    updates.status = 'active';
    updates.currentPlayer = firstPlayer;
    updates.log = 'La partie commence !';

    const endGameVotes = {};
    const rematchVotes = {};
    playerKeys.forEach(key => {
        endGameVotes[key] = false;
        rematchVotes[key] = false;
    });
    updates.endGameVotes = endGameVotes;
    updates.rematchVotes = rematchVotes;

    return await updateGame(gameId, updates);
}

/**
 * Vote pour terminer la partie
 */
export async function voteEndGame(gameId, playerKey) {
    return await updateGame(gameId, {
        [`endGameVotes.${playerKey}`]: true
    });
}

/**
 * Vote pour rejouer
 */
export async function voteRematch(gameId, playerKey, vote) {
    return await updateGame(gameId, {
        [`rematchVotes.${playerKey}`]: vote
    });
}

/**
 * Termine la partie
 */
export async function finishGame(gameId, playerKeys, logMessage) {
    const clearHands = {};
    playerKeys.forEach(key => {
        clearHands[`players.${key}.hand`] = [];
    });
    
    return await updateGame(gameId, {
        status: 'finished',
        log: logMessage || '🏁 Partie terminée !',
        ...clearHands
    });
}

/**
 * Réinitialise la partie pour un rematch
 */
export async function resetGameForRematch(gameId, currentPlayers) {
    const playerKeys = Object.keys(currentPlayers);
    
    const updates = {
        status: 'lobby',
        drawPile: [],
        discardPile: [],
        log: 'Nouvelle partie ! En attente du lancement...'
    };

    const rematchVotes = {};
    const endGameVotes = {};
    playerKeys.forEach(key => {
        rematchVotes[key] = false;
        endGameVotes[key] = false;
        updates[`players.${key}`] = {
            id: currentPlayers[key].id,
            name: currentPlayers[key].name,
            hand: [],
            played: [],
            turnState: 'waiting',
            arcEnCielPlays: 0,
            cardsForChance: [],
            prisonTurns: 0,
            // ✨ NOUVEAUX CHAMPS - Réinitialiser
            lastSeen: Date.now(),
            isAFK: false,
            consecutiveSkips: 0
        };
    });
    
    updates.rematchVotes = rematchVotes;
    updates.endGameVotes = endGameVotes;

    return await updateGame(gameId, updates);
}
