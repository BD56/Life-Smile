import { CARD_DEFINITIONS } from '../config/cards.js';
import { 
    discardCardFromBoard, 
    handleDivorceConsequences,
    applyMalusEffect
} from '../utils/card-helpers.js';
import { updateGame } from './firebase-service.js';
import { endTurn } from './game.js';

/**
 * Gère le malus avec une cible spécifique
 */
export async function handleMalusWithTarget(gameId, gameState, userId, card, targetKey) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];
    const target = gameState.players[targetKey];

    let currentHand = player.hand.filter(c => c.instanceId !== card.instanceId);
    let targetPlayed = [...target.played];
    let discardPile = [...gameState.discardPile];

    let updatePayload = {
        log: `${player.name} a joué ${CARD_DEFINITIONS[card.id].name} contre ${target.name}.`,
        [`players.${myPlayerKey}.hand`]: currentHand
    };

    // Vérifier immunités
    let actionBlocked = false;
    const cardDef = CARD_DEFINITIONS[card.id];
    const targetMetier = target.played.find(c => CARD_DEFINITIONS[c.id].category === 'metier');
    malusCard.playedBy = myPlayerKey;
    if (card.id === 'licenciement' && targetMetier && CARD_DEFINITIONS[targetMetier.id].status === 'fonctionnaire') actionBlocked = true;
    if (card.id === 'divorce_malus' && targetMetier && CARD_DEFINITIONS[targetMetier.id].advantage === 'immune_to_divorce_malus') actionBlocked = true;
    if (card.id === 'impot' && targetMetier && targetMetier.id === 'bandit') actionBlocked = true;
    if (card.id === 'maladie' && targetMetier && CARD_DEFINITIONS[targetMetier.id].advantage === 'immune_to_maladie') actionBlocked = true;
    if (card.id === 'accident' && targetMetier && CARD_DEFINITIONS[targetMetier.id].advantage === 'immune_to_accident') actionBlocked = true;

    if (!actionBlocked) {
        targetPlayed.push(card);
        const result = applyMalusEffect(card.id, targetPlayed, discardPile, target, targetKey, myPlayerKey);
        targetPlayed = result.targetPlayed;
        discardPile = result.discardPile;
        if(result.updatePayload) Object.assign(updatePayload, result.updatePayload);
    } else {
        discardPile.push(card);
        updatePayload.log += " (Effet bloqué par une immunité)";
    }

    updatePayload[`players.${targetKey}.played`] = targetPlayed;
    updatePayload.discardPile = discardPile;

    await endTurn(gameId, myPlayerKey, updatePayload);
    return true;
}

/**
 * Gère le Troc avec une cible
 */
export async function handleTrocWithTarget(gameId, gameState, userId, card, targetKey) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];
    const target = gameState.players[targetKey];

    let currentHand = player.hand.filter(c => c.instanceId !== card.instanceId);
    let targetHand = [...target.hand];
    let discardPile = [...gameState.discardPile];

    discardPile.push(card);

    if (currentHand.length > 0 && targetHand.length > 0) {
        const playerCardIndex = Math.floor(Math.random() * currentHand.length);
        const targetCardIndex = Math.floor(Math.random() * targetHand.length);
        [currentHand[playerCardIndex], targetHand[targetCardIndex]] = [targetHand[targetCardIndex], currentHand[playerCardIndex]];
    }

    const updatePayload = {
        [`players.${myPlayerKey}.hand`]: currentHand,
        [`players.${targetKey}.hand`]: targetHand,
        discardPile: discardPile,
        log: `${player.name} a utilisé Troc avec ${target.name}.`
    };

    await endTurn(gameId, myPlayerKey, updatePayload);
    return true;
}

/**
 * Gère l'Anniversaire avec une cible
 */
export async function handleAnniversaireWithTarget(gameId, gameState, userId, card, targetKey) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    let currentHand = player.hand.filter(c => c.instanceId !== card.instanceId);
    let discardPile = [...gameState.discardPile];
    discardPile.push(card);

    const updatePayload = {
        [`players.${myPlayerKey}.hand`]: currentHand,
        [`players.${targetKey}.turnState`]: 'needs_to_give_salary',
        discardPile: discardPile,
        log: `${player.name} a joué Anniversaire ! ${gameState.players[targetKey].name} doit donner un salaire.`
    };

    await updateGame(gameId, updatePayload);
    return true;
}

/**
 * Gère le don de salaire (Anniversaire)
 */
export async function handleGiveSalary(gameId, gameState, userId, cardToGive) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    if (player.turnState !== 'needs_to_give_salary') return false;

    const recipientKey = playerKeys.find(key => 
        gameState.players[key].turnState === 'needs_to_play' || 
        gameState.players[key].turnState === 'action_arc_en_ciel'
    );

    if (!recipientKey) return false;

    const playerPlayed = player.played.filter(c => c.instanceId !== cardToGive.instanceId);
    const recipientPlayed = [...gameState.players[recipientKey].played, cardToGive];

    await updateGame(gameId, {
        [`players.${myPlayerKey}.played`]: playerPlayed,
        [`players.${recipientKey}.played`]: recipientPlayed,
        [`players.${myPlayerKey}.turnState`]: 'needs_to_draw',
        log: `${player.name} a donné un salaire à ${gameState.players[recipientKey].name}.`
    });
    return true;
}

/**
 * Gère le Piston (jouer un métier)
 */
export async function handlePlayPistonMetier(gameId, gameState, userId, card) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];
    
    if (player.turnState !== 'action_piston_choose_metier') return false;

    let currentHand = player.hand.filter(c => c.instanceId !== card.instanceId);
    let playerPlayed = [...player.played, card];
    
    const updatePayload = {
        [`players.${myPlayerKey}.hand`]: currentHand,
        [`players.${myPlayerKey}.played`]: playerPlayed,
        log: `${player.name} a utilisé Piston pour jouer ${CARD_DEFINITIONS[card.id].name}.`
    };
    
    await endTurn(gameId, myPlayerKey, updatePayload);
    return true;
}

/**
 * Gère la sélection d'une Vengeance
 */
export async function handleVengeanceSelection(gameId, gameState, userId, malusCard, targetKey) {
    return await handleMalusWithTarget(gameId, gameState, userId, malusCard, targetKey);
}

/**
 * Gère la Chance (sélection d'une carte)
 */
export async function handleChanceSelection(gameId, gameState, userId, selectedCard) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];
    
    const otherCards = player.cardsForChance.filter(c => c.instanceId !== selectedCard.instanceId);
    let drawPile = [...gameState.drawPile];
    drawPile.unshift(...otherCards);

    const tempHand = [...player.hand, selectedCard];

    const updatePayload = {
        drawPile: drawPile,
        [`players.${myPlayerKey}.cardsForChance`]: [],
        [`players.${myPlayerKey}.hand`]: tempHand,
        [`players.${myPlayerKey}.turnState`]: 'needs_to_play'
    };
    
    await updateGame(gameId, updatePayload);
    return { success: true, selectedCard };
}

/**
 * Actions volontaires : Démission
 */
export async function handleResign(gameId, gameState, userId) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    if (player.turnState !== 'needs_to_draw') return false;

    let playerPlayed = [...player.played];
    let discardPile = [...gameState.discardPile];
    
    const result = discardCardFromBoard(playerPlayed, 'metier');
    if (!result.removedCard) return false;

    playerPlayed = result.cardArray;
    discardPile.push(result.removedCard);

    const cardDef = CARD_DEFINITIONS[result.removedCard.id];
    const isInterimaire = cardDef.status === 'interimaire';
    
    let updatePayload = {
        [`players.${myPlayerKey}.played`]: playerPlayed,
        discardPile: discardPile,
        log: `${player.name} a démissionné.`
    };

    if (isInterimaire) {
        await updateGame(gameId, updatePayload);
    } else {
        await endTurn(gameId, myPlayerKey, updatePayload);
    }
    return true;
}

/**
 * Actions volontaires : Divorce
 */
export async function handleDivorce(gameId, gameState, userId) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    if (player.turnState !== 'needs_to_draw') return false;

    let playerPlayed = [...player.played];
    let discardPile = [...gameState.discardPile];
    
    const result = discardCardFromBoard(playerPlayed, 'mariage');
    if (!result.removedCard) return false;

    playerPlayed = result.cardArray;
    discardPile.push(result.removedCard);

    const consequences = handleDivorceConsequences(playerPlayed);
    playerPlayed = consequences.cardArray;
    discardPile = [...discardPile, ...consequences.removedCards];

    let updatePayload = {
        [`players.${myPlayerKey}.played`]: playerPlayed,
        discardPile: discardPile,
        log: `${player.name} a divorcé.`
    };

    await endTurn(gameId, myPlayerKey, updatePayload);
    return true;
}

/**
 * Termine Arc-en-ciel manuellement
 */
export async function handleStopRainbow(gameId, gameState, userId) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    const player = gameState.players[myPlayerKey];

    if (player.turnState !== 'action_arc_en_ciel') return false;

    await endTurn(gameId, myPlayerKey, { 
        log: `${player.name} termine son tour Arc-en-ciel.`
    });
    return true;
}