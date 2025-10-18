# 🎮 Smile Life - Architecture Modulaire

## 📁 Structure du Projet

```
smile-life/
├── index.html                      # Shell HTML minimal
├── css/
│   └── styles.css                 # Styles personnalisés
├── js/
│   ├── config/
│   │   ├── firebase.js            # Configuration Firebase
│   │   └── cards.js               # Définitions des 217 cartes
│   ├── services/
│   │   ├── firebase-service.js    # Opérations Firebase (CRUD)
│   │   ├── game.js                # Logique de jeu (tours, pioche, défausse)
│   │   ├── game-actions.js        # Actions spéciales (malus, cartes spéciales)
│   │   └── chat.js                # Système de chat temps réel
│   ├── ui/
│   │   ├── home.js                # Écran d'accueil
│   │   ├── lobby.js               # Salle d'attente
│   │   ├── board.js               # Plateau de jeu principal
│   │   ├── modals.js              # Toutes les modales
│   │   └── opponents.js           # Affichage adversaires (3 modes)
│   ├── utils/
│   │   ├── helpers.js             # Fonctions utilitaires générales
│   │   └── card-helpers.js        # Utilitaires spécifiques aux cartes
│   └── main.js                    # Point d'entrée & orchestration
└── README.md
```

## 🏗️ Architecture

### **Séparation des responsabilités**

#### 1️⃣ **Configuration** (`config/`)
- `firebase.js` : Credentials Firebase
- `cards.js` : Base de données des 217 cartes avec toutes leurs propriétés

#### 2️⃣ **Services** (`services/`)
Logique métier pure, sans manipulation DOM :

- **firebase-service.js** : CRUD Firebase
  - `createGame()`, `joinGame()`, `updateGame()`
  - `listenToGame()`, `voteEndGame()`, `voteRematch()`
  
- **game.js** : Mécanique de jeu principale
  - `endTurn()` : Gestion des tours et correction des mains
  - `handleDrawCard()`, `handlePlayCard()`, `handleDiscardCard()`
  
- **game-actions.js** : Actions spéciales
  - `handleMalusWithTarget()`, `handleTrocWithTarget()`
  - `handleVengeanceSelection()`, `handleChanceSelection()`
  - `handleResign()`, `handleDivorce()`
  
- **chat.js** : Chat temps réel
  - `listenToChat()`, `sendMessage()`, `toggleChat()`

#### 3️⃣ **UI** (`ui/`)
Modules d'interface utilisateur :

- **home.js** : Écran d'accueil (créer/rejoindre)
- **lobby.js** : Salle d'attente (pseudo, paramètres, start)
- **board.js** : Plateau principal (main, zones, statuts)
- **modals.js** : Toutes les modales (cartes, actions, cibles, rematch)
- **opponents.js** : Affichage adversaires avec 3 modes de vue

#### 4️⃣ **Utilitaires** (`utils/`)
- **helpers.js** : Fonctions génériques (shuffle, URL, clipboard)
- **card-helpers.js** : Logique cartes (deck, validation, effets)

#### 5️⃣ **Orchestration** (`main.js`)
Point d'entrée qui :
- Initialise Firebase et tous les modules UI
- Gère l'état global (`localGameState`, `userId`)
- Route les événements vers les bons handlers
- Coordonne les mises à jour de l'interface

## 🔄 Flux de Données

```
Firebase (Source de vérité)
    ↓
  main.js (Orchestrateur)
    ↓
  Listeners → handleGameStateUpdate()
    ↓
  Rendu UI (board.js, opponents.js)
    ↓
  Actions utilisateur
    ↓
  Services (game.js, game-actions.js)
    ↓
  firebase-service.js → Firebase
```

## 🎯 Avantages de cette Architecture

### ✅ **Maintenabilité**
- Chaque fichier a une responsabilité unique
- Code facilement localisable
- Modifications isolées

### ✅ **Testabilité**
- Services purs testables unitairement
- Mocks faciles (Firebase, DOM)

### ✅ **Lisibilité**
- Fichiers < 400 lignes
- Import explicites
- Nommage clair

### ✅ **Performance**
- Modules chargés à la demande
- Pas de duplication de code
- Optimisations ciblées

### ✅ **Scalabilité**
- Ajout de nouvelles cartes : `cards.js`
- Nouvelle action : `game-actions.js`
- Nouveau mode d'affichage : `opponents.js`

## 🚀 Démarrage

1. **Cloner le projet**
```bash
git clone [repo-url]
cd smile-life
```

2. **Configurer Firebase**
- Créer un projet Firebase
- Activer Firestore et Auth anonyme
- Copier les credentials dans `js/config/firebase.js`

3. **Déployer**
```bash
# Avec Firebase Hosting
firebase deploy

# Ou serveur local
python -m http.server 8000
```

4. **Accéder**
```
http://localhost:8000
```

## 🔧 Règles Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read, write: if true; // À sécuriser en production
      
      match /chat/{messageId} {
        allow read, write: if true;
      }
    }
  }
}
```

## 📝 Ajouter une Nouvelle Carte

1. **Définition** (`config/cards.js`)
```javascript
'ma_carte': {
    name: "Ma Carte",
    type: 'special',
    category: 'special',
    smiles: 0,
    text: "Description",
    action: { type: 'mon_action' }
}
```

2. **Deck** (`utils/card-helpers.js`)
```javascript
addCards('ma_carte', 3); // 3 exemplaires
```

3. **Action** (`services/game-actions.js`)
```javascript
case 'mon_action':
    // Logique de l'action
    break;
```

## 🎨 Ajouter un Mode d'Affichage

Dans `ui/opponents.js` :
```javascript
const modes = ['expanded', 'compact', 'minimal', 'nouveau_mode'];
```

## 🐛 Debugging

### État global
```javascript
console.log(window.localGameState); // État du jeu
console.log(window.userId);          // ID utilisateur
```

### Listeners Firebase
```javascript
// Dans main.js
unsubscribeGame = listenToGame(gameId, (state) => {
    console.log('Mise à jour:', state);
});
```

## 📊 Métriques

- **Fichiers** : 15 modules
- **Lignes de code** : ~3000 (vs 1200 monolithique)
- **Taille moyenne** : 200 lignes/fichier
- **Dépendances externes** : Firebase, Tailwind

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT

## 👥 Auteurs

- Architecture originale : Monolithique 1200 lignes
- Refactoring modulaire : Architecture 15 modules

---

**Note** : Cette architecture est conçue pour être extensible. Chaque ajout de fonctionnalité doit respecter la séparation des responsabilités établie.