/**
 * SERVICE : Gestion de la présence des joueurs
 * Détecte les absences et gère les timeouts automatiques
 */

import { updateGame } from './firebase-service.js';
import { endTurn } from './game.js';

// Constantes de timing
const TIMEOUTS = {
    FIRST_TIME: 120000,      // 2 minutes (1ère fois)
    SUBSEQUENT: 90000,       // 90 secondes (fois suivantes)
    WARNING_TIME: 10000,     // 10 secondes avant la fin
    HEARTBEAT_INTERVAL: 20000, // 20 secondes
    ABSENCE_THRESHOLD: 30000,  // 30 secondes pour considérer inactif
    KICK_THRESHOLD: 180000,    // 3 minutes d'absence totale
    PAUSE_DURATION: 120000     // 2 minutes de pause avant fin
};

// État local du service
let heartbeatInterval = null;
let turnTimerInterval = null;
let currentTimerStart = null;
let hasUsedExtension = false;

/**
 * Initialise le système de présence
 * @param {string} gameId - ID de la partie
 * @param {string} userId - ID de l'utilisateur
 * @param {string} myPlayerKey - Clé du joueur (p1, p2, etc.)
 */
export function initializePresence(gameId, userId, myPlayerKey) {
    console.log('🔄 Initialisation système de présence');
    
    // Heartbeat : mise à jour toutes les 20 secondes
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    heartbeatInterval = setInterval(async () => {
        if (isUserActive()) {
            await updateLastSeen(gameId, myPlayerKey);
        }
    }, TIMEOUTS.HEARTBEAT_INTERVAL);
    
    // Mise à jour initiale
    updateLastSeen(gameId, myPlayerKey);
}

/**
 * Détecte si l'utilisateur est actif (mouvement souris, clics, touches)
 */
function isUserActive() {
    // Simple détection : si la page a le focus
    return document.hasFocus();
}

/**
 * Met à jour le lastSeen du joueur
 */
async function updateLastSeen(gameId, playerKey) {
    try {
        await updateGame(gameId, {
            [`players.${playerKey}.lastSeen`]: Date.now(),
            [`players.${playerKey}.isAFK`]: false
        });
    } catch (error) {
        console.error('Erreur mise à jour lastSeen:', error);
    }
}

/**
 * Démarre le timer de tour
 * @param {string} gameId - ID de la partie
 * @param {Object} gameState - État du jeu
 * @param {string} currentPlayerKey - Clé du joueur actif
 * @param {Function} onTimerUpdate - Callback pour mettre à jour l'affichage
 * @param {Function} onTimeout - Callback quand le timer expire
 */
export function startTurnTimer(gameId, gameState, currentPlayerKey, onTimerUpdate, onTimeout) {
    // ✅ IMPORTANT : Arrêter l'ancien timer
    if (turnTimerInterval) clearInterval(turnTimerInterval);
    
    const player = gameState.players[currentPlayerKey];
    const skipCount = player.consecutiveSkips || 0;
    
    // Timer plus long la première fois
    const timerDuration = skipCount === 0 ? TIMEOUTS.FIRST_TIME : TIMEOUTS.SUBSEQUENT;
    
    currentTimerStart = Date.now();
    const endTime = currentTimerStart + timerDuration;
    
    console.log(`⏱️ Timer de ${timerDuration / 1000}s démarré pour ${player.name}`);
    
    turnTimerInterval = setInterval(async () => {
        const now = Date.now();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
            // Timer expiré !
            clearInterval(turnTimerInterval);
            await handleTimeout(gameId, gameState, currentPlayerKey);
            if (onTimeout) onTimeout();
        } else {
            // Mise à jour du timer
            const seconds = Math.ceil(remaining / 1000);
            if (onTimerUpdate) onTimerUpdate(seconds, remaining <= TIMEOUTS.WARNING_TIME);
            
            // Son d'alerte à 10 secondes
            if (remaining <= TIMEOUTS.WARNING_TIME && remaining > TIMEOUTS.WARNING_TIME - 1000) {
                playWarningSound();
            }
        }
    }, 1000);
}

/**
 * Arrête le timer de tour
 */
export function stopTurnTimer() {
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
        currentTimerStart = null;
    }
}

/**
 * Gère le timeout d'un joueur
 */
async function handleTimeout(gameId, gameState, playerKey) {
    console.log(`⏱️ Timeout pour ${gameState.players[playerKey].name}`);
    
    const player = gameState.players[playerKey];
    const consecutiveSkips = (player.consecutiveSkips || 0) + 1;
    
    // Mettre à jour l'état
    const updates = {
        [`players.${playerKey}.isAFK`]: true,
        [`players.${playerKey}.consecutiveSkips`]: consecutiveSkips,
        log: `${player.name} n'a pas joué dans les temps. Tour passé automatiquement.`
    };
    
    await updateGame(gameId, updates);
    
    // Passer le tour automatiquement
    await endTurn(gameId, playerKey, {});
    
    // Vérifier si le joueur doit être éjecté
    const totalAbsenceTime = Date.now() - player.lastSeen;
    if (consecutiveSkips >= 3 || totalAbsenceTime > TIMEOUTS.KICK_THRESHOLD) {
        await checkForKick(gameId, gameState, playerKey);
    }
}

/**
 * Vérifie si un joueur doit être éjecté
 */
async function checkForKick(gameId, gameState, playerKey) {
    const playerKeys = Object.keys(gameState.players);
    const playerCount = playerKeys.length;
    
    if (playerCount === 2) {
        // Partie à 2 joueurs : proposer pause ou fin
        await handleTwoPlayerAbsence(gameId, gameState, playerKey);
    } else {
        // Partie à 3+ joueurs : vote d'éjection
        await initiateKickVote(gameId, gameState, playerKey);
    }
}

/**
 * Gère l'absence dans une partie à 2 joueurs
 */
async function handleTwoPlayerAbsence(gameId, gameState, absentPlayerKey) {
    const absentPlayer = gameState.players[absentPlayerKey];
    
    await updateGame(gameId, {
        status: 'paused',
        pauseReason: 'player_absence',
        pausedPlayerId: absentPlayerKey,
        pauseEndTime: Date.now() + TIMEOUTS.PAUSE_DURATION,
        log: `⏸️ Partie en pause : ${absentPlayer.name} est absent depuis trop longtemps.`
    });
}

/**
 * Initie un vote d'éjection
 */
async function initiateKickVote(gameId, gameState, targetPlayerKey) {
    const targetPlayer = gameState.players[targetPlayerKey];
    const absenceMinutes = Math.floor((Date.now() - targetPlayer.lastSeen) / 60000);
    
    const kickVotes = {};
    Object.keys(gameState.players).forEach(key => {
        kickVotes[key] = key === targetPlayerKey ? null : false; // null = ne peut pas voter
    });
    
    await updateGame(gameId, {
        kickVote: {
            active: true,
            targetPlayer: targetPlayerKey,
            votes: kickVotes,
            startTime: Date.now(),
            endTime: Date.now() + 30000, // 30 secondes pour voter
            reason: `${targetPlayer.name} est absent depuis ${absenceMinutes} minute(s)`
        },
        log: `⚠️ Vote d'éjection lancé contre ${targetPlayer.name}`
    });
}

/**
 * Vote pour éjecter un joueur
 */
export async function voteToKick(gameId, gameState, voterKey, vote) {
    if (!gameState.kickVote || !gameState.kickVote.active) return;
    
    await updateGame(gameId, {
        [`kickVote.votes.${voterKey}`]: vote
    });
    
    // Vérifier si tous ont voté
    await checkKickVoteResult(gameId, gameState);
}

/**
 * Vérifie le résultat du vote d'éjection
 */
async function checkKickVoteResult(gameId, gameState) {
    if (!gameState.kickVote || !gameState.kickVote.active) return;
    
    const votes = gameState.kickVote.votes;
    const votesArray = Object.entries(votes).filter(([key, vote]) => vote !== null);
    const allVoted = votesArray.every(([key, vote]) => vote !== false && vote !== true ? false : true);
    
    if (!allVoted && Date.now() < gameState.kickVote.endTime) return;
    
    // Compter les votes
    const yesVotes = votesArray.filter(([key, vote]) => vote === true).length;
    const totalVoters = votesArray.length;
    const majorityReached = yesVotes > totalVoters / 2;
    
    const targetPlayer = gameState.players[gameState.kickVote.targetPlayer];
    
    if (majorityReached) {
        // Éjection du joueur
        await kickPlayer(gameId, gameState, gameState.kickVote.targetPlayer);
    } else {
        // Vote rejeté : pause de 2 minutes
        await updateGame(gameId, {
            'kickVote.active': false,
            status: 'paused',
            pauseReason: 'kick_vote_failed',
            pauseEndTime: Date.now() + TIMEOUTS.PAUSE_DURATION,
            log: `Vote rejeté. Pause de 2 minutes en attente de ${targetPlayer.name}...`
        });
    }
}

/**
 * Éjecte un joueur de la partie
 */
async function kickPlayer(gameId, gameState, playerKey) {
    const player = gameState.players[playerKey];
    const playerKeys = Object.keys(gameState.players);
    const newPlayerKeys = playerKeys.filter(k => k !== playerKey);
    
    // Réorganiser les clés des joueurs
    const updates = {
        'kickVote.active': false,
        log: `${player.name} a été exclu pour inactivité prolongée.`
    };
    
    // Supprimer le joueur
    updates[`players.${playerKey}`] = null;
    
    // Si c'était son tour, passer au suivant
    if (gameState.currentPlayer === playerKey) {
        const currentIndex = playerKeys.indexOf(playerKey);
        const nextPlayerKey = playerKeys[(currentIndex + 1) % playerKeys.length];
        updates.currentPlayer = nextPlayerKey;
        updates[`players.${nextPlayerKey}.turnState`] = 'needs_to_draw';
    }
    
    await updateGame(gameId, updates);
}

/**
 * Demande une extension de temps (30 secondes supplémentaires)
 */
export async function requestTimeExtension(gameId, playerKey) {
    if (hasUsedExtension) {
        console.log('⏱️ Extension déjà utilisée');
        return false;
    }
    
    if (currentTimerStart) {
        // Ajouter 30 secondes
        currentTimerStart -= 30000;
        hasUsedExtension = true;
        
        await updateGame(gameId, {
            log: `⏱️ +30 secondes accordées`
        });
        
        console.log('⏱️ Extension de 30 secondes accordée');
        return true;
    }
    
    return false;
}

/**
 * Détecte les joueurs absents
 */
export function detectAbsentPlayers(gameState) {
    const now = Date.now();
    const absentPlayers = [];
    
    Object.entries(gameState.players).forEach(([key, player]) => {
        if (!player.lastSeen) return;
        
        const timeSinceLastSeen = now - player.lastSeen;
        
        if (timeSinceLastSeen > TIMEOUTS.ABSENCE_THRESHOLD) {
            absentPlayers.push({
                key,
                name: player.name,
                absenceTime: timeSinceLastSeen,
                status: timeSinceLastSeen > TIMEOUTS.KICK_THRESHOLD ? 'critical' : 'warning'
            });
        }
    });
    
    return absentPlayers;
}

/**
 * Réinitialise le compteur de skips d'un joueur (quand il joue)
 */
export async function resetPlayerSkips(gameId, playerKey) {
    await updateGame(gameId, {
        [`players.${playerKey}.consecutiveSkips`]: 0,
        [`players.${playerKey}.isAFK`]: false
    });
}

/**
 * Joue un son d'alerte
 */
function playWarningSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Son non disponible');
    }
}

/**
 * Nettoie les ressources
 */
export function cleanupPresence() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        turnTimerInterval = null;
    }
    
    currentTimerStart = null;
    hasUsedExtension = false;
}

/**
 * Reprend une partie en pause
 */
export async function resumeFromPause(gameId, gameState) {
    const currentPlayerKey = gameState.currentPlayer;
    
    await updateGame(gameId, {
        status: 'active',
        pauseReason: null,
        pausedPlayerId: null,
        pauseEndTime: null,
        log: `▶️ Partie reprise !`
    });
}

/**
 * Termine une partie à cause d'une absence
 */
export async function endGameDueToAbsence(gameId, gameState, absentPlayerKey) {
    const absentPlayer = gameState.players[absentPlayerKey];
    
    await updateGame(gameId, {
        status: 'finished',
        endReason: 'player_absence',
        log: `🚫 Partie terminée : ${absentPlayer.name} est resté absent trop longtemps.`
    });
}