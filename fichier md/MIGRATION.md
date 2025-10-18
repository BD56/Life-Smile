# 🔄 Guide de Migration - Smile Life

## 📋 Vue d'ensemble

Ce document explique comment migrer du fichier monolithique `index.html` (1200 lignes) vers l'architecture modulaire (15 fichiers).

## ⚡ Migration Rapide

### **Option 1 : Remplacement complet (Recommandé)**

1. **Sauvegarder** l'ancien fichier
```bash
cp index.html index.html.backup
```

2. **Remplacer** par la nouvelle structure
```bash
# Créer la structure
mkdir -p css js/config js/services js/ui js/utils

# Copier les nouveaux fichiers
# (voir structure dans README.md)
```

3. **Vérifier** Firebase
- Les credentials dans `js/config/firebase.js` sont identiques
- Les règles Firestore sont compatibles

4. **Tester**
```bash
python -m http.server 8000
# Ouvrir http://localhost:8000
```

### **Option 2 : Migration progressive**

Si vous avez des modifications personnalisées, migrez module par module.

## 🗺️ Correspondance Ancien → Nouveau

### **Configuration**

| Ancien (index.html) | Nouveau |
|---------------------|---------|
| `const firebaseConfig = {...}` | `js/config/firebase.js` |
| `const CARD_DEFINITIONS = {...}` | `js/config/cards.js` |

### **Fonctions Utilitaires**

| Ancien | Nouveau |
|--------|---------|
| `shuffleArray()` | `js/utils/helpers.js` |
| `createFullDeck()` | `js/utils/card-helpers.js` |
| `canPlayCard()` | `js/utils/card-helpers.js` |
| `countSmiles()` | `js/utils/card-helpers.js` |
| `discardCardFromBoard()` | `js/utils/card-helpers.js` |

### **Services Firebase**

| Ancien | Nouveau |
|--------|---------|
| `createNewGame()` | `firebase-service.js : createGame()` |
| `initializeNewGame()` | `firebase-service.js : createGame()` |
| `joinAndListenToGame()` | `firebase-service.js : joinGame()` + `listenToGame()` |
| `updateDoc()` direct | `firebase-service.js : updateGame()` |

### **Logique de Jeu**

| Ancien | Nouveau |
|--------|---------|
| `endTurn()` | `game.js : endTurn()` |
| `handleDrawCard()` | `game.js : handleDrawCard()` |
| `handlePlayCard()` | `game.js : handlePlayCard()` |
| `handleDiscardCard()` | `game.js : handleDiscardCard()` |

### **Actions Spéciales**

| Ancien | Nouveau |
|--------|---------|
| `handleMalusWithTarget()` | `game-actions.js : handleMalusWithTarget()` |
| `handleTrocWithTarget()` | `game-actions.js : handleTrocWithTarget()` |
| `handleVengeanceSelection()` | `game-actions.js : handleVengeanceSelection()` |
| `handleVoluntaryAction()` | `game-actions.js : handleResign()` / `handleDivorce()` |

### **Interface Utilisateur**

| Ancien | Nouveau |
|--------|---------|
| `showScreen()` | `home.js : showHome()` / `lobby.js : showLobby()` / etc. |
| `renderLobby()` | `lobby.js : renderLobby()` |
| `renderGame()` | `board.js : renderGame()` |
| `renderOpponents()` | `opponents.js : renderOpponents()` |
| Modales inline | `modals.js : show*Modal()` |

### **Chat**

| Ancien | Nouveau |
|--------|---------|
| `listenToChat()` | `chat.js : listenToChat()` |
| `sendChatMessage()` | `chat.js : sendMessage()` |
| `toggleChat()` | `chat.js : toggleChat()` |

## 🔍 Changements Importants

### **1. Variables Globales**

**Avant :**
```javascript
let userId = null;
let localGameState = null;
let currentGameId = null;
```

**Après :**
```javascript
// Dans main.js uniquement
let userId = null;
let localGameState = null;
let currentGameId = null;

// Exposées globalement si nécessaire
window.userId = userId;
window.localGameState = localGameState;
```

### **2. Imports ES6**

**Avant :**
```javascript
// Tout dans un seul fichier
function myFunction() { }
```

**Après :**
```javascript
// Dans chaque module
export function myFunction() { }

// Dans main.js
import { myFunction } from './module.js';
```

### **3. Event Listeners**

**Avant :**
```javascript
document.getElementById('btn').addEventListener('click', () => {
    // Logique inline
});
```

**Après :**
```javascript
// Dans ui/board.js
export function initializeBoard(callbacks) {
    document.getElementById('btn').addEventListener('click', 
        callbacks.onAction
    );
}

// Dans main.js
BoardUI.initializeBoard({
    onAction: handleAction
});
```

### **4. Rendu du Plateau**

**Avant :**
```javascript
function renderPlayerBoard(prefix, cards, key) {
    // DOM manipulation directe
}
```

**Après :**
```javascript
// board.js
export function renderPlayerBoard(prefix, cards, key, gameState, userId, callbacks) {
    // Logique de rendu isolée
    // Callbacks pour les interactions
}
```

## 🐛 Problèmes Courants

### **1. "Module not found"**

**Cause** : Chemin d'import incorrect

**Solution** :
```javascript
// ✅ Bon
import { myFunc } from './services/game.js';

// ❌ Mauvais
import { myFunc } from 'services/game';
```

### **2. "Cannot read property of undefined"**

**Cause** : Variable globale non exposée

**Solution** :
```javascript
// Dans main.js
window.userId = userId;
window.localGameState = localGameState;
```

### **3. "Failed to load module script"**

**Cause** : Type module non spécifié

**Solution** :
```html
<!-- Dans index.html -->
<script type="module" src="js/main.js"></script>
```

### **4. Callbacks ne fonctionnent pas**

**Cause** : Callback non passé ou non défini

**Solution** :
```javascript
// Vérifier que tous les callbacks sont définis
function getBoardCallbacks() {
    return {
        onDrawCard: handleDrawCard,
        onPlayCard: handlePlayCard,
        // ... tous les callbacks nécessaires
    };
}
```

## ✅ Checklist de Migration

- [ ] Structure de dossiers créée
- [ ] `index.html` mis à jour (script type="module")
- [ ] `css/styles.css` créé
- [ ] Configuration Firebase (`js/config/firebase.js`)
- [ ] Définitions cartes (`js/config/cards.js`)
- [ ] Services Firebase (`js/services/firebase-service.js`)
- [ ] Logique jeu (`js/services/game.js`)
- [ ] Actions spéciales (`js/services/game-actions.js`)
- [ ] Chat (`js/services/chat.js`)
- [ ] Utilitaires (`js/utils/*.js`)
- [ ] UI Home (`js/ui/home.js`)
- [ ] UI Lobby (`js/ui/lobby.js`)
- [ ] UI Board (`js/ui/board.js`)
- [ ] UI Modals (`js/ui/modals.js`)
- [ ] UI Opponents (`js/ui/opponents.js`)
- [ ] Point d'entrée (`js/main.js`)
- [ ] Tests manuels effectués
- [ ] Déploiement

## 🧪 Tests de Validation

### **Test 1 : Créer une partie**
1. Cliquer "Créer une partie"
2. Vérifier le code généré
3. Entrer un pseudo
4. ✅ Le lobby s'affiche correctement

### **Test 2 : Rejoindre une partie**
1. Ouvrir dans un autre navigateur
2. Entrer le code
3. Entrer un pseudo différent
4. ✅ Les deux joueurs apparaissent

### **Test 3 : Jouer une partie**
1. Hôte lance la partie
2. Piocher une carte
3. Jouer une carte
4. ✅ Le tour passe correctement

### **Test 4 : Chat**
1. Ouvrir le chat
2. Envoyer un message
3. ✅ Visible chez l'autre joueur

### **Test 5 : Fin de partie**
1. Voter pour finir
2. ✅ Écran rematch s'affiche
3. Voter rejouer
4. ✅ Nouvelle partie démarre

## 📈 Performance

### **Avant (Monolithique)**
- **Taille** : 1 fichier × 1200 lignes = ~80 KB
- **Parsing** : ~150ms
- **Maintenabilité** : ⭐⭐

### **Après (Modulaire)**
- **Taille** : 15 fichiers × 200 lignes = ~90 KB total
- **Parsing** : ~180ms (chargement parallèle)
- **Maintenabilité** : ⭐⭐⭐⭐⭐
- **Cache** : Modules indépendants cachés séparément

## 🎓 Bonnes Pratiques Post-Migration

1. **Ne jamais modifier directement `main.js`**
   - Ajouter la logique dans les modules appropriés

2. **Un module = Une responsabilité**
   - Services : logique métier
   - UI : rendu et interactions
   - Utils : fonctions réutilisables

3. **Imports explicites**
   ```javascript
   // ✅ Bon
   import { createGame, joinGame } from './services/firebase-service.js';
   
   // ❌ Éviter
   import * as Firebase from './services/firebase-service.js';
   ```

4. **Callbacks pour la communication**
   - UI ne manipule jamais Firebase directement
   - Passer par les callbacks vers main.js

## 🆘 Support

En cas de problème :
1. Vérifier la console navigateur (F12)
2. Comparer avec le fichier backup
3. Consulter le README.md
4. Vérifier les imports/exports

---

**Migration réussie ?** 🎉 Vous disposez maintenant d'une architecture maintenable et scalable !