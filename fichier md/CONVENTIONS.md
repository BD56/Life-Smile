# 📐 Conventions et Patterns - Smile Life

## 🎯 Principes Fondamentaux

### **1. Séparation des Responsabilités (SoC)**
- **Services** : Logique métier pure, pas de DOM
- **UI** : Rendu et événements, pas de logique métier
- **Utils** : Fonctions pures réutilisables
- **Config** : Données statiques uniquement

### **2. Single Responsibility Principle (SRP)**
Chaque module a **une seule raison de changer** :
- `game.js` : Mécanique de jeu uniquement
- `firebase-service.js` : Communication Firebase uniquement
- `board.js` : Affichage plateau uniquement

### **3. Dependency Injection**
Utiliser des callbacks pour inverser les dépendances :
```javascript
// ✅ Bon - UI ne connaît pas Firebase
export function initializeBoard(callbacks) {
    button.onclick = callbacks.onAction;
}

// ❌ Mauvais - Couplage fort
export function initializeBoard() {
    button.onclick = () => updateFirebase();
}
```

## 📝 Conventions de Nommage

### **Fichiers**
```
kebab-case.js          ✅ game-actions.js
camelCase.js           ❌ gameActions.js
PascalCase.js          ❌ GameActions.js
```

### **Variables**
```javascript
// Constantes globales
const CARD_DEFINITIONS = {...};
const MAX_PLAYERS = 6;

// Variables locales
let currentGameId = null;
let localGameState = null;

// Fonctions
function handleDrawCard() {}
async function updateGame() {}

// Booléens
let isMyTurn = false;
let hasMetier = true;
```

### **Modules**
```javascript
// Exports nommés (préféré)
export function myFunction() {}
export const myConst = 42;

// Export default (éviter sauf config)
export default { config };
```

## 🏗️ Patterns d'Architecture

### **Pattern 1 : Service Layer**

**Définition** : Logique métier isolée dans des services

**Exemple** :
```javascript
// ✅ services/game.js
export async function handleDrawCard(gameId, gameState, userId) {
    // Logique pure
    const card = gameState.drawPile.shift();
    await updateGame(gameId, { 
        drawPile: gameState.drawPile 
    });
}

// ❌ board.js (UI)
function handleDrawCard() {
    const card = localGameState.drawPile.shift();
    updateDoc(doc(db, "games", gameId), {...}); // ❌ Firebase dans UI
}
```

### **Pattern 2 : Callbacks/Events**

**Définition** : Communication UI → Main via callbacks

**Exemple** :
```javascript
// main.js
BoardUI.initializeBoard({
    onDrawCard: handleDrawCard,
    onPlayCard: handlePlayCard
});

// board.js
export function initializeBoard(callbacks) {
    drawBtn.onclick = callbacks.onDrawCard;
}
```

### **Pattern 3 : Pure Functions**

**Définition** : Fonctions sans effets de bord

**Exemple** :
```javascript
// ✅ Pure
export function countSmiles(playedCards) {
    return playedCards.reduce((acc, card) => 
        acc + CARD_DEFINITIONS[card.id].smiles
    , 0);
}

// ❌ Impure (modifie l'état global)
function countSmiles() {
    return localGameState.players[userId].played.reduce(...);
}
```

### **Pattern 4 : Factory Functions**

**Définition** : Créer des objets complexes

**Exemple** :
```javascript
// ✅ card-helpers.js
export function createFullDeck() {
    let deck = [];
    const addCards = (id, count) => {
        for (let i = 0; i < count; i++) {
            deck.push({ 
                id: id, 
                instanceId: crypto.randomUUID() 
            });
        }
    };
    // ...
    return shuffleArray(deck);
}
```

### **Pattern 5 : Module Pattern**

**Définition** : Encapsuler état privé

**Exemple** :
```javascript
// chat.js
let isChatOpen = false;  // Privé
let unreadCount = 0;     // Privé

export function toggleChat(forceShow) {
    isChatOpen = forceShow ?? !isChatOpen;
    // ...
}

export function getUnreadCount() {
    return unreadCount;
}
```

## 🔄 Gestion d'État

### **État Local vs Global**

```javascript
// ✅ État global (main.js)
let localGameState = null;
let userId = null;
window.localGameState = localGameState; // Exposé si nécessaire

// ✅ État local de module (ui/opponents.js)
let opponentsViewMode = 'expanded';
let expandedInactiveOpponents = new Set();

// ❌ État dupliqué
// Éviter de stocker gameState dans plusieurs modules
```

### **Principe de Source Unique de Vérité**

```javascript
// ✅ Firebase est la source de vérité
listenToGame(gameId, (newState) => {
    localGameState = newState;  // Mise à jour locale
    renderGame();               // Re-render
});

// ❌ Modifier l'état local sans sync
localGameState.currentPlayer = 'p2';  // ❌ Désynchronisé
```

## 📦 Structure de Fonction

### **Fonctions Asynchrones**

```javascript
// ✅ Async/await clair
export async function handlePlayCard(gameId, gameState, userId, card) {
    const result = await validateCard(card);
    if (!result.valid) return { success: false };
    
    await updateGame(gameId, {
        [`players.${userId}.played`]: [...gameState.played, card]
    });
    
    return { success: true };
}

// ❌ Promesses chaînées
export function handlePlayCard(gameId, gameState, userId, card) {
    return validateCard(card).then(result => {
        if (!result.valid) return { success: false };
        return updateGame(gameId, {...}).then(() => ({ success: true }));
    });
}
```

### **Gestion d'Erreurs**

```javascript
// ✅ Try-catch explicite
export async function createGame(gameId, userId) {
    try {
        await setDoc(doc(db, "games", gameId), {...});
        return true;
    } catch (error) {
        console.error("Erreur création:", error);
        return false;
    }
}

// ❌ Sans gestion
export async function createGame(gameId, userId) {
    await setDoc(doc(db, "games", gameId), {...}); // Peut crasher
    return true;
}
```

### **Validation des Paramètres**

```javascript
// ✅ Validation early return
export function canPlayCard(card, playerCards, opponents) {
    if (!card || !card.id) return false;
    if (!CARD_DEFINITIONS[card.id]) return false;
    
    const cardDef = CARD_DEFINITIONS[card.id];
    // ... validation
    
    return true;
}

// ❌ Nested conditions
export function canPlayCard(card, playerCards, opponents) {
    if (card && card.id) {
        if (CARD_DEFINITIONS[card.id]) {
            const cardDef = CARD_DEFINITIONS[card.id];
            // ... logique profonde
        }
    }
}
```

## 🎨 Conventions UI

### **Sélecteurs DOM**

```javascript
// ✅ Déclaration au début du module
const gameContainer = document.getElementById('game-container');
const playerHandEl = document.getElementById('player-hand');

export function renderGame(gameState) {
    gameContainer.classList.remove('hidden');
    playerHandEl.innerHTML = '';
}

// ❌ Sélection répétée
export function renderGame(gameState) {
    document.getElementById('game-container').classList.remove('hidden');
    document.getElementById('player-hand').innerHTML = '';
}
```

### **Création d'Éléments**

```javascript
// ✅ Template literals pour HTML simple
const cardEl = document.createElement('div');
cardEl.className = 'card';
cardEl.innerHTML = `
    <div class="card-title">${cardDef.name}</div>
    <div class="card-text">${cardDef.text}</div>
`;

// ✅ Construction manuelle pour logique complexe
const cardEl = document.createElement('div');
cardEl.classList.add('card', `card-type-${cardDef.type}`);
if (card.invested) cardEl.classList.add('card-invested');
const titleEl = document.createElement('div');
titleEl.className = 'card-title';
titleEl.textContent = cardDef.name;
cardEl.appendChild(titleEl);
```

### **Event Listeners**

```javascript
// ✅ Initialisation centralisée
export function initializeBoard(callbacks) {
    drawBtn.addEventListener('click', callbacks.onDraw);
    discardBtn.addEventListener('click', callbacks.onDiscard);
}

// ❌ Listeners éparpillés
drawBtn.addEventListener('click', () => {...});
// ... 100 lignes plus loin
discardBtn.addEventListener('click', () => {...});
```

## 📊 Conventions de Données

### **Structure d'Objet**

```javascript
// ✅ Consistant et typé
const player = {
    id: 'abc123',
    name: 'Alice',
    hand: [],
    played: [],
    turnState: 'waiting',
    arcEnCielPlays: 0,
    cardsForChance: [],
    prisonTurns: 0
};

// ❌ Inconsistant
const player = {
    playerId: 'abc123',  // Préfixe inconsistant
    playerName: 'Alice',
    cards: [],           // Ambigu
    // Propriétés manquantes
};
```

### **Immutabilité**

```javascript
// ✅ Copie avant modification
const newHand = [...player.hand, drawnCard];
const newPlayed = player.played.filter(c => c.id !== cardId);

await updateGame(gameId, {
    [`players.${key}.hand`]: newHand,
    [`players.${key}.played`]: newPlayed
});

// ❌ Mutation directe
player.hand.push(drawnCard);  // ❌ Modifie l'original
await updateGame(gameId, {
    [`players.${key}.hand`]: player.hand  // État incohérent
});
```

## 📝 Documentation

### **JSDoc pour Fonctions Publiques**

```javascript
/**
 * Termine le tour d'un joueur et passe au suivant
 * @param {string} gameId - ID de la partie
 * @param {string} playerRole - Clé du joueur (p1, p2, etc.)
 * @param {Object} updatePayload - Mises à jour à appliquer
 * @returns {Promise<boolean>} Succès de l'opération
 */
export async function endTurn(gameId, playerRole, updatePayload = {}) {
    // ...
}
```

### **Commentaires Inline**

```javascript
// ✅ Commentaires utiles
// Corriger la taille des mains (5 ou 6 selon Chercheur)
const correctHandSize = (role) => {
    const hasChercheur = players[role].played.some(c => c.id === 'chercheur');
    const limit = hasChercheur ? 6 : 5;
    // ...
};

// ❌ Commentaires obvies
// Incrémenter i
i++;

// Retourner vrai
return true;
```

## 🧪 Testabilité

### **Fonctions Testables**

```javascript
// ✅ Pure, facilement testable
export function countSmiles(playedCards) {
    return playedCards.reduce((total, card) => {
        const cardDef = CARD_DEFINITIONS[card.id];
        return cardDef.type !== 'malus' ? total + cardDef.smiles : total;
    }, 0);
}

// Test
assert(countSmiles([{id: 'flirt'}, {id: 'animal'}]) === 2);

// ❌ Non testable (dépend de l'état global)
function countSmiles() {
    return localGameState.players[userId].played.reduce(...);
}
```

### **Injection de Dépendances**

```javascript
// ✅ Dépendances injectées
export function renderGame(gameState, userId, callbacks) {
    // Testable avec des mocks
    callbacks.onDrawCard();
}

// ❌ Dépendances globales
export function renderGame() {
    // Utilise localGameState et userId globaux
    handleDrawCard(); // Fonction globale
}
```

## ⚡ Performance

### **Éviter les Re-renders Inutiles**

```javascript
// ✅ Render conditionnel
export function renderOpponents(gameState, userId, renderFn) {
    const opponents = getOpponents(gameState, userId);
    
    opponents.forEach(opponent => {
        if (shouldRender(opponent)) {  // Condition
            renderOpponent(opponent, renderFn);
        }
    });
}

// ❌ Render systématique
export function renderOpponents(gameState, userId, renderFn) {
    opponentsArea.innerHTML = '';  // Efface tout à chaque fois
    // Re-render complet même si rien n'a changé
}
```

### **Batch Updates DOM**

```javascript
// ✅ Fragment pour multiples éléments
const fragment = document.createDocumentFragment();
cards.forEach(card => {
    fragment.appendChild(createCardElement(card));
});
containerEl.appendChild(fragment);  // Un seul reflow

// ❌ Ajouts individuels
cards.forEach(card => {
    containerEl.appendChild(createCardElement(card));  // Reflow × N
});
```

## 🔒 Sécurité

### **Échapper le HTML**

```javascript
// ✅ textContent pour données utilisateur
nameEl.textContent = player.name;  // Échappe automatiquement

// ❌ innerHTML avec données utilisateur
nameEl.innerHTML = player.name;  // ⚠️ XSS possible

// ✅ Fonction d'échappement pour templates
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### **Validation Côté Client ET Serveur**

```javascript
// ✅ Validation client (UX)
if (!canPlayCard(card, player.played, opponents)) {
    alert("Conditions non remplies !");
    return;
}

// ⚠️ Toujours valider côté serveur aussi (Firestore Rules)
```

## 📋 Checklist Code Review

Avant de committer :

- [ ] Fonction < 50 lignes
- [ ] Fichier < 400 lignes
- [ ] Pas de code dupliqué
- [ ] Nommage clair et consistant
- [ ] Pas d'état global non nécessaire
- [ ] Gestion d'erreurs présente
- [ ] Callbacks documentés
- [ ] Pas de magic numbers
- [ ] Imports/exports corrects
- [ ] Console.log retirés (sauf debug intentionnel)

## 🎯 Anti-Patterns à Éviter

### ❌ God Object
```javascript
// ❌ Objet qui fait tout
const GameManager = {
    createGame() {},
    joinGame() {},
    renderGame() {},
    handleChat() {},
    // ... 50 méthodes
};
```

### ❌ Callback Hell
```javascript
// ❌ Pyramide de callbacks
doSomething(() => {
    doSomethingElse(() => {
        doAnotherThing(() => {
            // ...
        });
    });
});

// ✅ Async/await
await doSomething();
await doSomethingElse();
await doAnotherThing();
```

### ❌ Magic Numbers
```javascript
// ❌
if (playerKeys.length >= 3) {
    viewModeToggle.classList.remove('hidden');
}

// ✅
const MIN_OPPONENTS_FOR_TOGGLE = 3;
if (playerKeys.length >= MIN_OPPONENTS_FOR_TOGGLE) {
    viewModeToggle.classList.remove('hidden');
}
```

### ❌ Tight Coupling
```javascript
// ❌ UI appelle Firebase directement
function handleClick() {
    updateDoc(doc(db, "games", gameId), {...});
}

// ✅ UI utilise callback
function handleClick() {
    callbacks.onAction();
}
```

---

**Suivre ces conventions garantit** :
- ✅ Code maintenable
- ✅ Bugs minimisés
- ✅ Collaboration facilitée
- ✅ Performance optimale