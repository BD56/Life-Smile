# ⚡ Smile Life - Cheatsheet Développeur

## 🗺️ Navigation Rapide

| Je veux... | Fichier | Fonction |
|------------|---------|----------|
| Ajouter une carte | `config/cards.js` + `utils/card-helpers.js` | `CARD_DEFINITIONS`, `createFullDeck()` |
| Modifier la logique de tour | `services/game.js` | `endTurn()` |
| Changer l'affichage du plateau | `ui/board.js` | `renderGame()` |
| Ajouter une action spéciale | `services/game-actions.js` | Nouvelle fonction |
| Modifier le lobby | `ui/lobby.js` | `renderLobby()` |
| Changer le style | `css/styles.css` | Classes CSS |
| Débugger Firebase | `services/firebase-service.js` | Console.log dans listeners |

## 🎯 Commandes Rapides

### Démarrer le serveur local
```bash
python -m http.server 8000
# ou
npx serve
```

### Ouvrir la console
```
F12 (Chrome/Firefox)
Cmd+Opt+I (Mac)
```

### Voir l'état du jeu
```javascript
console.log(window.localGameState);
console.log(window.userId);
```

### Forcer un re-render
```javascript
window.dispatchEvent(new Event('opponentsViewModeChanged'));
```

## 📦 Imports Fréquents

```javascript
// Cartes
import { CARD_DEFINITIONS } from '../config/cards.js';
import { createFullDeck, countSmiles, canPlayCard } from '../utils/card-helpers.js';

// Firebase
import { updateGame, listenToGame } from '../services/firebase-service.js';

// Jeu
import * as GameService from '../services/game.js';
import * as GameActions from '../services/game-actions.js';

// UI
import * as BoardUI from '../ui/board.js';
import * as ModalsUI from '../ui/modals.js';

// Utils
import { shuffleArray, copyToClipboard } from '../utils/helpers.js';
```

## 🎮 Snippets Courants

### Ajouter une nouvelle carte

**1. Définir la carte** (`config/cards.js`)
```javascript
'ma_nouvelle_carte': {
    name: "Ma Carte",
    type: 'special',        // pro, perso, malus, acquisition, distinction, special
    category: 'special',
    smiles: 2,
    text: "Description de l'effet",
    action: { type: 'mon_action' },
    requiresTarget: true    // Si besoin de sélectionner un adversaire
}
```

**2. Ajouter au deck** (`utils/card-helpers.js`)
```javascript
export function createFullDeck() {
    // ...
    addCards('ma_nouvelle_carte', 3);  // 3 exemplaires
    // ...
}
```

**3. Implémenter l'action** (si spéciale - `services/game-actions.js`)
```javascript
export async function handleMaAction(gameId, gameState, userId, params) {
    const playerKeys = Object.keys(gameState.players);
    const myPlayerKey = playerKeys.find(key => gameState.players[key].id === userId);
    
    // Logique de l'action
    const updates = {
        log: `Action effectuée !`
    };
    
    await updateGame(gameId, updates);
    return true;
}
```

### Modifier l'affichage d'une zone

**Dans `ui/board.js`**
```javascript
export function renderPlayerBoard(playerPrefix, playedCards, playerKey, gameState, userId, callbacks) {
    const zones = [
        { id: `${playerPrefix}-ma-zone`, type: 'custom', title: 'Ma Zone' }
    ];
    
    zones.forEach(zoneInfo => {
        const zoneEl = document.getElementById(zoneInfo.id);
        // Logique de rendu
    });
}
```

### Ajouter un callback

**1. Dans `main.js`**
```javascript
function getBoardCallbacks() {
    return {
        onMonAction: handleMonAction,
        // ... autres callbacks
    };
}

async function handleMonAction(param) {
    await GameActions.handleMaAction(currentGameId, localGameState, userId, param);
}
```

**2. Dans le module UI**
```javascript
export function initializeBoard(callbacks) {
    monBtn.addEventListener('click', () => {
        callbacks.onMonAction(data);
    });
}
```

### Créer une nouvelle modale

**Dans `ui/modals.js`**
```javascript
const maModal = document.getElementById('ma-modal');

export function showMaModal(data, callback) {
    // Remplir le contenu
    maModal.querySelector('.content').innerHTML = data;
    
    // Gérer la fermeture
    maModal.querySelector('.close').onclick = () => hideMaModal();
    
    // Afficher
    maModal.classList.remove('hidden');
    maModal.classList.add('flex');
}

export function hideMaModal() {
    maModal.classList.add('hidden');
    maModal.classList.remove('flex');
}
```

## 🐛 Debug Rapide

### Voir les cartes d'un joueur
```javascript
const player = window.localGameState.players.p1;
console.table(player.hand.map(c => ({
    id: c.id,
    name: CARD_DEFINITIONS[c.id].name
})));
```

### Forcer un état de tour
```javascript
// ⚠️ DEV ONLY - Ne pas utiliser en prod
await updateGame(currentGameId, {
    'players.p1.turnState': 'needs_to_play',
    currentPlayer: 'p1'
});
```

### Vérifier les listeners actifs
```javascript
// Dans la console
console.log('Game listener:', unsubscribeGame !== null);
console.log('Chat listener:', unsubscribeChat !== null);
```

### Simuler une carte
```javascript
const testCard = {
    id: 'flirt',
    instanceId: crypto.randomUUID()
};
console.log(CARD_DEFINITIONS[testCard.id]);
```

## 📊 État du Jeu

### Structure gameState
```javascript
{
    players: {
        p1: {
            id: "userId1",
            name: "Alice",
            hand: [{id: "flirt", instanceId: "..."}],
            played: [{id: "etudes1", instanceId: "..."}],
            turnState: "waiting" | "needs_to_draw" | "needs_to_play",
            arcEnCielPlays: 0,
            cardsForChance: [],
            prisonTurns: 0
        }
    },
    drawPile: [],
    discardPile: [],
    currentPlayer: "p1",
    status: "lobby" | "active" | "finished",
    log: "Dernier message",
    endGameVotes: { p1: false, p2: false },
    rematchVotes: { p1: false, p2: false },
    maxPlayers: 2
}
```

### Accès rapide
```javascript
// État global
window.localGameState
window.userId
window.currentGameId

// Joueur courant
const playerKeys = Object.keys(localGameState.players);
const myKey = playerKeys.find(k => localGameState.players[k].id === userId);
const me = localGameState.players[myKey];

// Adversaires
const opponents = playerKeys.filter(k => k !== myKey);
```

## 🎨 Classes CSS Utiles

### Cartes
```css
.card                     /* Carte de base */
.card-type-pro           /* Bleu */
.card-type-perso         /* Rose */
.card-type-malus         /* Rouge */
.card-type-acquisition   /* Vert */
.card-type-special       /* Violet */
.card-type-distinction   /* Indigo */
.card-invested           /* Grisée */
.card-back               /* Face cachée */
```

### Animations
```css
.vengeance-target        /* Pulse jaune */
.choice-target           /* Pulse jaune */
.current-turn-indicator  /* Clignotant vert */
```

### Adversaires
```css
.opponent-card           /* Carte adversaire */
.opponent-card.active-turn /* Tour actif */
.opponent-board.compact  /* Mode compact */
.opponent-summary        /* Résumé minimal */
```

## 🔧 Utilitaires Fréquents

### Copier dans le presse-papier
```javascript
import { copyToClipboard } from '../utils/helpers.js';
copyToClipboard(text, "Type");
```

### Mélanger un tableau
```javascript
import { shuffleArray } from '../utils/helpers.js';
const shuffled = shuffleArray([1, 2, 3, 4, 5]);
```

### Compter les smiles
```javascript
import { countSmiles } from '../utils/card-helpers.js';
const score = countSmiles(player.played);
```

### Valider une carte
```javascript
import { canPlayCard } from '../utils/card-helpers.js';
const canPlay = canPlayCard(card, player.played, opponents);
```

## 🚨 Erreurs Communes

### "Module not found"
**Cause** : Chemin d'import incorrect
**Solution** : Vérifier le chemin relatif
```javascript
// ✅ Bon
import { myFunc } from '../services/game.js';

// ❌ Mauvais
import { myFunc } from 'services/game';
```

### "Cannot read property of undefined"
**Cause** : État non initialisé
**Solution** : Vérifier l'existence
```javascript
// ✅ Bon
if (gameState && gameState.players) {
    const player = gameState.players[myKey];
}

// ❌ Mauvais
const player = gameState.players[myKey];
```

### "Function is not defined"
**Cause** : Fonction non importée
**Solution** : Ajouter l'import
```javascript
import { endTurn } from '../services/game.js';
```

### "classList is not a function"
**Cause** : Élément DOM non trouvé
**Solution** : Vérifier getElementById
```javascript
const el = document.getElementById('mon-element');
if (el) {
    el.classList.add('ma-classe');
}
```

## 📱 Responsive

### Breakpoints
```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablette */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

### Classes Tailwind utiles
```html
<!-- Responsive flex -->
<div class="flex flex-col sm:flex-row">

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

<!-- Responsive text -->
<p class="text-sm md:text-base lg:text-lg">
```

## 🎯 Tests Manuels Rapides

### Test création partie
```
1. Ouvrir http://localhost:8000
2. Clic "Créer une partie"
3. Vérifier URL contient ?gameCode=xxx
4. ✅ Lobby s'affiche
```

### Test rejoindre
```
1. Copier le code de partie
2. Ouvrir nouvel onglet incognito
3. Coller le code
4. ✅ Pseudo demandé, puis lobby
```

### Test jouer carte
```
1. Lancer partie (2 joueurs)
2. Joueur 1 : Piocher
3. Joueur 1 : Jouer une carte
4. ✅ Tour passe à joueur 2
```

### Test chat
```
1. Ouvrir chat (bouton violet)
2. Envoyer message
3. ✅ Apparaît chez tous les joueurs
```

## 🔑 Raccourcis Clavier Console

### Inspecter l'état
```javascript
// Alias pratiques à définir dans console
window.gs = () => console.log(window.localGameState);
window.me = () => console.log(window.localGameState.players[
    Object.keys(window.localGameState.players)
        .find(k => window.localGameState.players[k].id === window.userId)
]);
```

### Auto-complétion
```javascript
// Taper "window.local" puis Tab
window.localGameState

// Taper "CARD_DEF" puis Tab
CARD_DEFINITIONS
```

## 📞 Contacts & Support

### Problème avec un module ?
1. Vérifier la console (F12)
2. Consulter CONVENTIONS.md
3. Voir les exemples dans le code
4. Créer une issue GitHub

### Ajouter une fonctionnalité ?
1. Lire README.md (architecture)
2. Suivre les patterns existants
3. Tester manuellement
4. Documenter si nécessaire

## ⚡ Commandes Git

```bash
# Créer une branche feature
git checkout -b feature/ma-feature

# Commit
git add .
git commit -m "feat: ajout de ma feature"

# Push
git push origin feature/ma-feature

# Revenir à main
git checkout main
```

## 🎓 Ressources

- **Firebase Docs** : https://firebase.google.com/docs
- **Tailwind** : https://tailwindcss.com/docs
- **ES6 Modules** : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- **Architecture** : Voir README.md

---

**💡 Astuce** : Gardez ce fichier ouvert pendant le développement pour accès rapide aux snippets !

**🚀 Happy Coding !**