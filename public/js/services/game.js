import { CARD_DEFINITIONS } from '../config/cards.js';
import { 
    discardCardFromBoard, 
    handleDivorceConsequences,
    applyMalusEffect,
    investSalariesForCard,
    discardLastCardOfCategory
} from '../utils/card-helpers.js';
import { sortPlayerKeys } from '../utils/helpers.js';
import { updateGame, getGameData } from './firebase-service.js';

/**
 * Termine le tour d'un joueur et passe au suivant
 */
export async function endTurn(gameId, playerRoleThatPlayed, updatePayload = {}) {
    const currentGameState = await getGameData(gameId);
    const playerKeys = sortPlayerKeys(Object.keys(currentGameState.players));
    const currentIndex = playerKeys.indexOf(playerRoleThatPlayed);
    const nextPlayerKey = playerKeys[(currentIndex + 1) % playerKeys.length];

    let players = JSON.parse(JSON.stringify(currentGameState.players)); 
    let drawPile = [...currentGameState.drawPile];
    let discardPile = updatePayload.discardPile ? [...updatePayload.discardPile] : [...currentGameState.discardPile];
    let logMessages = [updatePayload.log || ''];

    // Appliquer les changements du payload
    playerKeys.forEach(key => {
        if (updatePayload[`players.${key}.hand`]) {
            players[key].hand = updatePayload[`players.${key}.hand`];
        }
        if (updatePayload[`players.${key}.played`]) {
            players[key].played = updatePayload[`players.${key}.played`];
        }
        if (updatePayload[`players.${key}.prisonTurns`] !== undefined) {
            players[key].prisonTurns = updatePayload[`players.${key}.prisonTurns`];
        }
    });

    // Corriger la taille des mains
    const correctHandSize = (role) => {
        const player = players[role];
        if (!player) return;

        const hasChercheur = player.played.some(c => c.id === 'chercheur');
        const limit = hasChercheur ? 6 : 5;

        while (player.hand.length > limit) {
            const cardToDiscard = player.hand.splice(Math.floor(Math.random() * player.hand.length), 1)[0];
            discardPile.push({ ...cardToDiscard, discardedBy: 'system' });
            logMessages.push(`${player.name} a défaussé une carte en trop.`);
        }

        const cardsToDrawCount = limit - player.hand.length;
        if (cardsToDrawCount > 0 && drawPile.length > 0) {
            const drawnCards = drawPile.splice(0, Math.min(cardsToDrawCount, drawPile.length));
            player.hand.push(...drawnCards);
        }
    };

    playerKeys.forEach(key => correctHandSize(key));
    
    let nextPlayer = updatePayload.hasOwnProperty('currentPlayer') ? updatePayload.currentPlayer : nextPlayerKey;

    const finalPayload = {
        ...updatePayload, 
        drawPile: drawPile,
        discardPile: discardPile,
        currentPlayer: nextPlayer,
        log: logMessages.filter(Boolean).join(' '),
    };
    
    playerKeys.forEach(key => {
        finalPayload[`players.${key}`] = players[key];
        delete finalPayload[`players.${key}.hand`];
        delete finalPayload[`players.${key}.played`];
        delete finalPayload[`players.${key}.prisonTurns`];
    });

    finalPayload[`players.${playerRoleThatPlayed}.turnState`] = 'waiting';
    finalPayload[`players.${playerRoleThatPlayed}.arcEnCielPlays`] = 0;
    finalPayload[`players.${finalPayload.currentPlayer}.turnState`] = 'needs_to_draw';

    return await updateGame(gameId, finalPayload);
}

/**
 * Gère la pioche d'une carte
 */
export async function handleDrawCard(gameId, gameState, userId) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    if (gameState.currentPlayer !== myPlayerKey) return false;

    // Gestion prison
    if (player.prisonTurns && player.prisonTurns > 0) {
        await endTurn(gameId, myPlayerKey, { 
            log: `${player.name} est en prison et passe son tour.`,
            [`players.${myPlayerKey}.prisonTurns`]: player.prisonTurns - 1
        });
        return true;
    }

    if (player.turnState !== 'needs_to_draw') return false;

    if (gameState.drawPile.length > 0) {
        const cardDrawn = gameState.drawPile.shift();
        const newHand = [...player.hand, cardDrawn];
        
        await updateGame(gameId, {
            drawPile: gameState.drawPile,
            [`players.${myPlayerKey}.hand`]: newHand,
            [`players.${myPlayerKey}.turnState`]: 'needs_to_play',
            log: `${player.name} a pioché une carte.`
        });
        return true;
    }
    return false;
}

/**
 * Gère la pioche depuis la défausse
 */
export async function handleDrawFromDiscard(gameId, gameState, userId) {
    if (gameState.discardPile.length === 0) return false;

    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    if (gameState.currentPlayer !== myPlayerKey) return false;

    // Gestion prison
    if (player.prisonTurns && player.prisonTurns > 0) {
        await endTurn(gameId, myPlayerKey, { 
            log: `${player.name} est en prison et passe son tour.`,
            [`players.${myPlayerKey}.prisonTurns`]: player.prisonTurns - 1
        });
        return true;
    }

    if (player.turnState !== 'needs_to_draw') return false;
    
    const lastDiscarded = gameState.discardPile[gameState.discardPile.length - 1];
    if (lastDiscarded.discardedBy === userId) return false;

    const cardDrawn = gameState.discardPile.pop();
    const newHand = [...player.hand, cardDrawn];

    await updateGame(gameId, {
        discardPile: gameState.discardPile,
        [`players.${myPlayerKey}.hand`]: newHand,
        [`players.${myPlayerKey}.turnState`]: 'needs_to_play',
        log: `${player.name} a pris une carte de la défausse.`
    });
    return true;

        // ✅ AJOUTÉ : Vérifier si cette carte a été défaussée ce tour
    if (topCard.justDiscardedBy === myPlayerKey && topCard.justDiscardedTurn === gameState.turnNumber) {
        console.log('❌ Carte défaussée ce tour, non récupérable');
        return false;
    }
}

/**
 * Gère le jeu d'une carte
 */
export async function handlePlayCard(gameId, gameState, userId, card, isFromChance = false) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];
    const isArcEnCielTurn = player.turnState === 'action_arc_en_ciel';

    if (gameState.currentPlayer !== myPlayerKey) return { success: false, message: "Ce n'est pas votre tour" };
    if (!isFromChance && player.turnState !== 'needs_to_play' && !isArcEnCielTurn) {
        return { success: false, message: "Vous devez d'abord piocher" };
    }

    const cardDef = CARD_DEFINITIONS[card.id];
    
    let currentHand = player.hand.filter(c => c.instanceId !== card.instanceId);
    let playerPlayed = [...player.played];
    let discardPile = [...gameState.discardPile];

    let updatePayload = {
        log: `${player.name} a joué ${cardDef.name}.`
    };
    
    if(!isFromChance) {
        updatePayload[`players.${myPlayerKey}.hand`] = currentHand;
    }

    // CARTES SPÉCIALES
    if (cardDef.type === 'special') {
        let playerPlayed = [...player.played];
        let discardPile = [...gameState.discardPile];
        updatePayload.discardPile = discardPile;
        
        let endsTurn = false;

        switch(cardDef.action.type) {
            case 'piston':
                updatePayload[`players.${myPlayerKey}.turnState`] = 'action_piston_choose_metier';
                break;
            case 'vengeance':
                updatePayload[`players.${myPlayerKey}.turnState`] = 'action_vengeance_choose_malus';
                break;
            case 'tsunami':
                let allCards = [currentHand];
                playerKeys.forEach(key => {
                    if (key !== myPlayerKey) {
                        allCards.push([...gameState.players[key].hand]);
                    }
                });
                allCards = shuffleArray(allCards.flat());
                const handSize = Math.floor(allCards.length / playerKeys.length);
                let offset = 0;
                playerKeys.forEach(key => {
                    updatePayload[`players.${key}.hand`] = allCards.slice(offset, offset + handSize);
                    offset += handSize;
                });
                endsTurn = true;
                break;
            case 'arc_en_ciel':
                updatePayload[`players.${myPlayerKey}.turnState`] = 'action_arc_en_ciel';
                updatePayload[`players.${myPlayerKey}.arcEnCielPlays`] = 0;
                break;
            case 'chance':
                let drawPileForChance = [...gameState.drawPile];
                const choiceCards = drawPileForChance.splice(0, 3);
                updatePayload.drawPile = drawPileForChance;
                updatePayload[`players.${myPlayerKey}.turnState`] = 'action_chance_choose_card';
                updatePayload[`players.${myPlayerKey}.cardsForChance`] = choiceCards;
                
                // ✅ AJOUTÉ : Retirer la carte Chance du jeu (pas dans la défausse)
                // Elle n'est PAS ajoutée à discardPile
                updatePayload.log = `${player.name} a joué Chance (carte retirée du jeu).`;
                break;
        }
        
        if (endsTurn) {
            await endTurn(gameId, myPlayerKey, updatePayload);
        } else {
            await updateGame(gameId, updatePayload);
        }
        return { success: true, requiresTarget: cardDef.requiresTarget, actionType: cardDef.action.type };
    } 
    
    // CARTES MALUS
    else if (cardDef.type === 'malus') {
        if (cardDef.requiresTarget) {
            return { success: true, requiresTarget: true, card: card };
        } else {
            // Attentat : tous les joueurs
            playerKeys.forEach(key => {
                if (key !== myPlayerKey) {
                    const targetPlayed = [...gameState.players[key].played];
                    const result = applyMalusEffect(card.id, targetPlayed, discardPile, gameState.players[key], key, myPlayerKey);
                    updatePayload[`players.${key}.played`] = result.targetPlayed;
                    discardPile = result.discardPile;
                    if(result.updatePayload) Object.assign(updatePayload, result.updatePayload);
                }
            });
            updatePayload.discardPile = discardPile;
            await endTurn(gameId, myPlayerKey, updatePayload);
            return { success: true };
        }
    } 
    
    // CARTES NORMALES
    else { 
        playerPlayed.push(card);


            // ✅ Promotion : Grand Prof remplace Prof
    if (card.id === 'grand_prof') {
        const profIndex = playerPlayed.findIndex(c => c.id === 'prof');
        if (profIndex !== -1) {
            const profCard = playerPlayed.splice(profIndex, 1)[0];
            discardPile.push(profCard);
            updatePayload.log = `${player.name} a joué ${cardDef.name}. Prof est remplacé par Grand Prof.`;
        }
    }
        
        // Investir salaires si acquisition
        if (cardDef.type === 'acquisition' && cardDef.cost > 0) {
            playerPlayed = investSalariesForCard(playerPlayed, card.id);
        }
        
        updatePayload[`players.${myPlayerKey}.played`] = playerPlayed;
        updatePayload.discardPile = discardPile;

        if (isArcEnCielTurn) {
            const plays = (player.arcEnCielPlays || 0) + 1;
            updatePayload[`players.${myPlayerKey}.arcEnCielPlays`] = plays;
            
            await updateGame(gameId, updatePayload);
            
            if (plays >= 3) {
                await endTurn(gameId, myPlayerKey, {});
            }
        } else {
            await endTurn(gameId, myPlayerKey, updatePayload);
        }
        return { success: true };
    }

    
    // ✅ AJOUTÉ : Ajouter à la défausse seulement si ce n'est pas Chance
    if (cardDef.id !== 'chance') {
        discardPile.push(card);
        updatePayload.discardPile = discardPile;
    }
    
    if (endsTurn) {
        await endTurn(gameId, myPlayerKey, updatePayload);
    } else {
        await updateGame(gameId, updatePayload);
    }
    
    return { success: true, requiresTarget: cardDef.requiresTarget, actionType: cardDef.action.type };
}

/**
 * Défausse une carte
 */
export async function handleDiscardCard(gameId, gameState, userId, card) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    if (gameState.currentPlayer !== myPlayerKey) return false;
    if (player.turnState !== 'needs_to_play' && player.turnState !== 'action_arc_en_ciel') return false;

    const currentHand = player.hand.filter(c => c.instanceId !== card.instanceId);
    const cardToDiscard = {...card, discardedBy: userId };
    const discardPile = [...gameState.discardPile, cardToDiscard];
    
    
    const updatePayload = {
        [`players.${myPlayerKey}.hand`]: currentHand,
        discardPile: discardPile,
        turnNumber: (gameState.turnNumber || 0) + 1,  // ✅ Incrémenter le numéro de tour
        log: `${player.name} a défaussé une carte.`
        
    };

    if (player.turnState === 'action_arc_en_ciel') {
        const plays = (player.arcEnCielPlays || 0) + 1;
        updatePayload[`players.${myPlayerKey}.arcEnCielPlays`] = plays;
        await updateGame(gameId, updatePayload);
        if(plays >= 3) await endTurn(gameId, myPlayerKey, {});
    } else {
        await endTurn(gameId, myPlayerKey, updatePayload);
    }
    return true;
}

// Import nécessaire
import { shuffleArray } from '../utils/helpers.js';