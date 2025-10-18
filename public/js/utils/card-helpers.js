import { CARD_DEFINITIONS } from '../config/cards.js';
import { shuffleArray } from './helpers.js';

/**
 * Crée un deck complet de 217 cartes
 */
export function createFullDeck() {
    let deck = [];
    
    const addCards = (id, count) => {
        for (let i = 0; i < count; i++) {
            deck.push({ id: id, instanceId: crypto.randomUUID() });
        }
    };
    
    // Études
    addCards('etudes_double', 3);
    addCards('etudes1', 22);
    
    // Métiers
    addCards('barman', 1);
    addCards('prof', 4);
    addCards('medecin', 2);
    addCards('avocat', 1);
    addCards('chercheur', 1);
    addCards('journaliste', 1);
    addCards('bandit', 1);
    addCards('architecte', 1);
    addCards('pilote', 1);
    addCards('policier', 1);
    addCards('militaire', 1);
    addCards('pharmacien', 1);
    addCards('garagiste', 1);
    addCards('grand_prof', 1);
    
    // Salaires
    addCards('salaire1', 10);
    addCards('salaire2', 10);
    addCards('salaire3', 10);
    addCards('salaire4', 10);
    
    // Vie personnelle
    addCards('flirt', 20);
    addCards('mariage', 7);
    addCards('enfant', 10);
    addCards('adultere', 3);
    
    // Acquisitions
    addCards('animal', 5);
    addCards('voyage', 5);
    addCards('maison', 5);
    
    // Distinctions
    addCards('grand_prix', 2);
    addCards('legion_honneur', 1);
    
    // Malus
    addCards('accident', 5);
    addCards('licenciement', 5);
    addCards('divorce_malus', 5);
    addCards('impot', 5);
    addCards('redoublement', 5);
    addCards('burn_out', 5);
    addCards('maladie', 5);
    addCards('prison', 1);
    addCards('attentat', 1);
    
    // Cartes spéciales
    addCards('piston', 1);
    addCards('troc', 1);
    addCards('anniversaire', 1);
    addCards('vengeance', 1);
    addCards('arc_en_ciel', 1);
    addCards('chance', 1);
    addCards('tsunami', 1);
    
    return shuffleArray(deck);
}

/**
 * Compte le nombre total de smiles d'un joueur
 */
export function countSmiles(playedCards) {
    return playedCards.reduce((total, card) => {
        const cardDef = CARD_DEFINITIONS[card.id];
        return cardDef.type !== 'malus' ? total + cardDef.smiles : total;
    }, 0);
}

/**
 * Vérifie si une carte peut être jouée
 */
export function canPlayCard(card, playerPlayedCards, opponentsPlayedCards) {
    const cardDef = CARD_DEFINITIONS[card.id];
    const getPlayedByCategory = (category) => playerPlayedCards.filter(c => CARD_DEFINITIONS[c.id].category === category);
    const hasCardOfCategory = (category) => getPlayedByCategory(category).length > 0;
    const getMetier = () => playerPlayedCards.find(c => CARD_DEFINITIONS[c.id].category === 'metier');
    const hasMedecin = playerPlayedCards.some(c => c.id === 'medecin');

if (cardDef.id === 'vengeance') {
    // ✅ CORRIGÉ : Vérifier dans tous les malus joués
    const hasReceivedMalus = playerPlayed.some(c => {
        const def = CARD_DEFINITIONS[c.id];
        // Un malus posé par quelqu'un d'autre que moi
        return def.type === 'malus' && c.playedBy && c.playedBy !== 'me';
    });
    
    if (!hasReceivedMalus) {
        console.log('❌ Vengeance : Aucun malus reçu');
        return false;
    }
}

    // Anniversaire nécessite un adversaire avec salaire disponible
    if (card.id === 'anniversaire') {
        const anyOpponentHasAvailableSalary = opponentsPlayedCards.some(opp => 
            opp.played.some(c => CARD_DEFINITIONS[c.id].category === 'salaire' && !c.invested)
        );
        if (!anyOpponentHasAvailableSalary) return false;
    }

    // Troc nécessite un adversaire avec cartes en main
    if (card.id === 'troc') {
        const anyOpponentHasCards = opponentsPlayedCards.some(opp => opp.hand.length > 0);
        if (!anyOpponentHasCards) return false;
    }

    // Salaire : vérifier métier et niveau max
    if (cardDef.category === 'salaire') {
        const metierCard = getMetier();
        if (!metierCard) return false;
        let maxLevel = CARD_DEFINITIONS[metierCard.id].salaryMax;
        if(hasCardOfCategory('grand_prix')) maxLevel = 4;
        return cardDef.level <= maxLevel;
    }
    
    // Règles générales
    if (cardDef.category === 'etudes' && hasCardOfCategory('metier') && !hasMedecin) return false;
    if (cardDef.category === 'metier' && hasCardOfCategory('metier')) return false;
    if (cardDef.category === 'mariage' && hasCardOfCategory('mariage')) return false;
    if (cardDef.category === 'flirt' && hasCardOfCategory('mariage') && !hasCardOfCategory('adultere')) return false;
    
    // Coûts des acquisitions
    if (cardDef.cost !== undefined) {
        let finalCost = cardDef.cost;
        const isMarried = hasCardOfCategory('mariage');
        const metierCard = getMetier();
        
        if (card.id === 'maison') {
            if (metierCard && metierCard.id === 'architecte') {
                finalCost = 0;
            } else if (isMarried) {
                finalCost = Math.ceil(cardDef.cost / 2);
            }
        }
        
        if (card.id === 'voyage' && metierCard && metierCard.id === 'pilote') {
            finalCost = 0;
        }
        
        const availableSalaryValue = playerPlayedCards
            .filter(c => CARD_DEFINITIONS[c.id].category === 'salaire' && !c.invested)
            .reduce((total, c) => total + CARD_DEFINITIONS[c.id].level, 0);
        if (availableSalaryValue < finalCost) return false;
    }

    // Vérifier les prérequis
    if (!cardDef.requirements) return true;

    if (cardDef.requirements.etudes !== undefined) {
        const totalEtudes = getPlayedByCategory('etudes').reduce((acc, c) => acc + (CARD_DEFINITIONS[c.id].value || 1), 0);
        return totalEtudes >= cardDef.requirements.etudes;
    }
    if (cardDef.requirements.flirt !== undefined) return getPlayedByCategory('flirt').length >= cardDef.requirements.flirt;
    if (cardDef.requirements.mariage !== undefined) return hasCardOfCategory('mariage');
    
    if (cardDef.requirements.metiers) {
        const metier = getMetier();
        if (!metier || !cardDef.requirements.metiers.includes(metier.id)) return false;
    }
    if(cardDef.requirements.excluded_metiers) {
        const metier = getMetier();
        if (metier && cardDef.requirements.excluded_metiers.includes(metier.id)) return false;
    }
    if (cardDef.requirements.metier) {
        const metier = getMetier();
        return metier && metier.id === cardDef.requirements.metier;
    }

    return true;
}

/**
 * Défausse une carte d'une catégorie spécifique
 */
export function discardCardFromBoard(cardArray, category) {
    let removedCard = null;
    let found = false;
    const newArray = cardArray.filter(c => {
        if (!found && CARD_DEFINITIONS[c.id].category === category) {
            removedCard = c;
            found = true;
            return false;
        }
        return true;
    });
    return { cardArray: newArray, removedCard };
}

/**
 * Défausse la dernière carte d'une catégorie
 */
export function discardLastCardOfCategory(cardArray, category, filterFn = () => true) {
    let removedCard = null;
    let lastIndex = -1;
    for (let i = cardArray.length - 1; i >= 0; i--) {
        const card = cardArray[i];
        if (CARD_DEFINITIONS[card.id].category === category && filterFn(card)) {
            lastIndex = i;
            break;
        }
    }
    if (lastIndex !== -1) {
        removedCard = cardArray.splice(lastIndex, 1)[0];
    }
    return { cardArray, removedCard };
}

/**
 * Gère les conséquences d'un divorce
 */
export function handleDivorceConsequences(cardArray) {
    const hasAdultere = cardArray.some(c => CARD_DEFINITIONS[c.id].category === 'adultere');
    let removedCards = [];
    
    if (!hasAdultere) return { cardArray, removedCards };

    const finalArray = cardArray.filter(c => {
        const cardCategory = CARD_DEFINITIONS[c.id].category;
        if (cardCategory === 'enfant' || cardCategory === 'adultere') {
            removedCards.push(c);
            return false;
        }
        return true;
    });
    return { cardArray: finalArray, removedCards };
}

/**
 * Applique l'effet d'un malus sur une cible
 */
export function applyMalusEffect(malusCardId, targetPlayed, discardPile, targetState, targetRole, currentPlayerRole) {
    const cardDef = CARD_DEFINITIONS[malusCardId];
    let actionResult = { targetPlayed, discardPile, updatePayload: {} };
    
    if (cardDef.action) {
        let result;
        switch(cardDef.action.type) {
            case 'skip_turn':
                actionResult.updatePayload.currentPlayer = currentPlayerRole;
                break;
            case 'skip_turn_if_worker':
                const targetHasMetier = targetState.played.some(c => CARD_DEFINITIONS[c.id].category === 'metier');
                if (targetHasMetier) {
                    actionResult.updatePayload.currentPlayer = currentPlayerRole;
                }
                break;
            case 'prison':
                const banditCardIndex = targetPlayed.findIndex(c => c.id === 'bandit');
                if (banditCardIndex > -1) {
                    const [removedBandit] = targetPlayed.splice(banditCardIndex, 1);
                    actionResult.discardPile.push(removedBandit);
                    actionResult.updatePayload[`players.${targetRole}.prisonTurns`] = 3;
                    actionResult.log = `${targetState.name} est envoyé en prison !`;
                }
                break;
            case 'discard_metier':
                result = discardCardFromBoard(targetPlayed, 'metier');
                actionResult.targetPlayed = result.cardArray;
                if (result.removedCard) actionResult.discardPile.push(result.removedCard);
                break;
            case 'discard_mariage':
                result = discardCardFromBoard(targetPlayed, 'mariage');
                if (result.removedCard) {
                    actionResult.discardPile.push(result.removedCard);
                    const consequences = handleDivorceConsequences(result.cardArray);
                    actionResult.targetPlayed = consequences.cardArray;
                    actionResult.discardPile = [...actionResult.discardPile, ...consequences.removedCards];
                }
                break;
            case 'discard_salaire':
                result = discardLastCardOfCategory(targetPlayed, 'salaire', (c) => !c.invested);
                actionResult.targetPlayed = result.cardArray;
                if (result.removedCard) actionResult.discardPile.push(result.removedCard);
                break;
            case 'discard_etudes':
                result = discardLastCardOfCategory(targetPlayed, 'etudes');
                actionResult.targetPlayed = result.cardArray;
                if (result.removedCard) actionResult.discardPile.push(result.removedCard);
                break;
            case 'discard_all_enfants':
                const removedEnfants = targetPlayed.filter(c => CARD_DEFINITIONS[c.id].category === 'enfant');
                actionResult.targetPlayed = targetPlayed.filter(c => CARD_DEFINITIONS[c.id].category !== 'enfant');
                actionResult.discardPile = [...actionResult.discardPile, ...removedEnfants];
                break;
        }
    }
    return actionResult;
}

/**
 * Investit des salaires pour payer une acquisition
 */
export function investSalariesForCard(playerPlayed, cardId) {
    const cardDef = CARD_DEFINITIONS[cardId];
    if (!cardDef.cost || cardDef.cost === 0) return playerPlayed;
    
    let costToPay = cardDef.cost;
    const isMarried = playerPlayed.some(c => CARD_DEFINITIONS[c.id].category === 'mariage');
    const metierCard = playerPlayed.find(c => CARD_DEFINITIONS[c.id].category === 'metier');
    
    if (cardId === 'maison') {
        if (metierCard && metierCard.id === 'architecte') {
            return playerPlayed; // Gratuit
        } else if (isMarried) {
            costToPay = Math.ceil(cardDef.cost / 2);
        }
    }
    
    if (cardId === 'voyage' && metierCard && metierCard.id === 'pilote') {
        return playerPlayed; // Gratuit
    }
    
    const availableSalaries = playerPlayed
        .filter(c => CARD_DEFINITIONS[c.id].category === 'salaire' && !c.invested)
        .sort((a, b) => CARD_DEFINITIONS[a.id].level - CARD_DEFINITIONS[b.id].level);

    const salariesToInvestIds = [];
    let paidAmount = 0;
    for (const salaryCard of availableSalaries) {
        if (paidAmount < costToPay) {
            salariesToInvestIds.push(salaryCard.instanceId);
            paidAmount += CARD_DEFINITIONS[salaryCard.id].level;
        }
    }
    
    playerPlayed.forEach(c => {
        if (salariesToInvestIds.includes(c.instanceId)) c.invested = true;
    });
    
    return playerPlayed;
}