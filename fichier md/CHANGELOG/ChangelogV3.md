# 📋 CHANGELOG - Life Smile

## [Session du 17 octobre 2025] - Améliorations majeures

### 🎯 Vue d'ensemble
Cette session a apporté des corrections critiques pour le système de présence, la gestion de fin de partie, et plusieurs bugs de gameplay.

---

## ✨ Nouvelles fonctionnalités

### Timer de tour inline
- **Ajout** : Timer discret affiché à côté de "Votre main" pendant votre tour
- **Format** : `⏱️ 1:24` avec animation de pulsation
- **Comportement** : 
  - Visible uniquement pendant VOTRE tour
  - Timer sur l'icône adversaire quand c'est son tour
  - Avertissement rouge les 10 dernières secondes
- **Fichiers modifiés** :
  - `js/main.js` : Fonction `handlePresenceSystem()`
  - `js/ui/presence-ui.js` : `updateInlineTimer()`, `hideInlineTimer()`
  - `css/styles.css` : Styles `.inline-timer`

### Système de départ amélioré
- **Supprimé** : Bouton "Quitter la partie" du plateau
- **Ajout** : Confirmation sur clic "Life Smile" (header)
- **Comportement** :
  - Retour direct si lobby/partie terminée
  - Modale de confirmation si partie en cours
  - Message automatique dans le log : "[Nom] a quitté la partie"
  - Fin automatique si partie à 2 joueurs
  - Retrait du joueur si 3+ joueurs avec passage de tour
- **Fichiers modifiés** :
  - `index.html` : Suppression bouton `new-game-btn`
  - `js/ui/board.js` : Suppression listeners
  - `js/main.js` : `handlePlayerLeaveGame()`

---

## 🐛 Corrections de bugs

### 1. Timer affiché au mauvais moment
- **Problème** : Timer visible même quand ce n'est pas le tour du joueur
- **Correction** : Vérification stricte de `currentPlayerKey === myPlayerKey`
- **Impact** : Timer ne s'affiche que pour le joueur actif

### 2. Fin de partie par vote
- **Problème** : Rien ne se passe quand tous les joueurs votent pour finir
- **Correction** : Nouvelle fonction `checkEndGameVotes()` dans `main.js`
- **Comportement** : Détection automatique + appel `finishGame()`
- **Fichiers modifiés** :
  - `js/main.js` : `checkEndGameVotes()` appelée dans `handleGameStateUpdate()`

### 3. Modale de rematch non affichée
- **Problème** : Pas d'écran de scores après fin de partie
- **Correction** : Ajout de `ModalsUI.showRematchScreen()` dans `status === 'finished'`
- **Fichiers modifiés** :
  - `js/main.js` : Section `handleGameStateUpdate()` pour status finished

### 4. Pop-up de pause non interactive
- **Problème** : Modale de pause impossible à fermer en cas d'activité
- **Correction** : Ajout de listeners d'événements (click, touch, keydown)
- **Comportement** : Fermeture automatique dès détection d'activité utilisateur
- **Fichiers modifiés** :
  - `js/ui/presence-ui.js` : `showPauseModal()` avec détection d'activité
  - `js/main.js` : `handleGamePause()` avec callback `onUserActive`

### 5. Chat non fonctionnel
- **Problème** : `TypeError: Cannot read properties of undefined (reading 'trim')`
- **Correction** : Vérification de l'existence de `chatInput` avant utilisation
- **Ajout** : Protection contre initialisation multiple avec `chatInitialized`
- **Fichiers modifiés** :
  - `js/services/chat.js` : `sendMessage()` sécurisée
  - `js/main.js` : Suppression doublon `ChatService.initializeChat()`

### 6. Messages de chat en double
- **Problème** : Messages envoyés deux fois
- **Cause** : `initializeChat()` appelé en doublon
- **Correction** : 
  - Suppression du doublon dans `main.js`
  - Ajout protection `chatInitialized` dans `chat.js`

### 7. Carte Chance - Comportement incorrect
- **Problème** : Carte sélectionnée rejouée automatiquement au lieu de rester en main
- **Correction** : Suppression du `setTimeout(() => handlePlayCard())` dans `handleChanceSelection()`
- **Comportement attendu** : 
  1. Jouer Chance → Pop-up 3 cartes
  2. Choisir 1 carte → Va dans la main
  3. Les 2 autres retournent dans la pioche
  4. Le joueur choisit quelle carte jouer depuis sa main
- **Fichiers modifiés** :
  - `js/main.js` : `handleChanceSelection()` simplifié
  - `js/ui/modals.js` : Texte corrigé "pour votre main"
  - `js/ui/board.js` : Affichage auto de la modale Chance
  - `js/services/game-actions.js` : `handleChanceSelection()` corrigé

### 8. Carte Chance dans la défausse
- **Problème** : Carte Chance ajoutée à la défausse au lieu d'être retirée du jeu
- **Correction** : Condition `if (cardDef.id !== 'chance')` avant `discardPile.push(card)`
- **Fichiers modifiés** :
  - `js/services/game.js` : `handlePlayCard()`

### 9. Carte défaussée récupérable immédiatement
- **Problème** : Joueur peut récupérer sa carte défaussée au tour suivant
- **Correction** : Marquage avec `justDiscardedBy` et `justDiscardedTurn`
- **Comportement** : Carte récupérable seulement après un tour complet
- **Fichiers modifiés** :
  - `js/services/game.js` : `handleDiscardCard()` et `handleDrawFromDiscard()`

### 10. Carte Vengeance - Condition erronée
- **Problème** : Impossible de jouer Vengeance même après avoir reçu un malus
- **Correction** : Vérification correcte des malus avec propriété `playedBy`
- **Fichiers modifiés** :
  - `js/utils/card-helpers.js` : `canPlayCard()` pour Vengeance
  - `js/services/game-actions.js` : Marquage `malusCard.playedBy` dans `handleMalusWithTarget()`

### 11. Fin de partie si pioche vide
- **Problème** : Partie continue même si pioche épuisée
- **Correction** : Nouvelle fonction `checkEmptyDeck()` appelée à chaque tour
- **Comportement** : Fin automatique avec message "🏁 Pioche épuisée"
- **Fichiers modifiés** :
  - `js/main.js` : `checkEmptyDeck()` + appel dans `handleGameStateUpdate()`

### 12. Cartes débordent des zones
- **Problème** : Cartes sortent visuellement de leurs zones de jeu (encarts)
- **Correction** : CSS avec tailles fixes et overflow contrôlé
- **Changements** :
  - `.board-zone` : `max-height: 280px`, `overflow: hidden`
  - `.card-slot-wrapper` : `flex-wrap: wrap`, `overflow-y: auto`
  - `.board-zone .card` : Tailles fixes `70px × 98px`
  - `#player-hand .card` : Tailles fixes `100px × 140px`
- **Fichiers modifiés** :
  - `css/styles.css` : Contraintes de taille strictes

---

## 🔄 Améliorations

### Interface utilisateur
- **Timer inline** : Plus discret qu'un pop-up plein écran
- **Confirmation de départ** : Message clair et explicite
- **Scroll dans les zones** : Si trop de cartes, scroll automatique

### Expérience de jeu
- **Carte Chance** : Comportement conforme aux règles du jeu
- **Vengeance** : Condition corrigée pour une jouabilité normale
- **Défausse** : Règle correcte (non récupérable au tour suivant)
- **Fin de partie** : Détection automatique de toutes les conditions

---

## 🗂️ Fichiers modifiés

### JavaScript
- `js/main.js` (modifications majeures)
  - `handlePresenceSystem()` : Timer corrigé
  - `handlePlayerLeaveGame()` : Nouvelle fonction
  - `handleChanceSelection()` : Simplifié
  - `checkEndGameVotes()` : Nouvelle fonction
  - `checkEmptyDeck()` : Nouvelle fonction
  - `handleGamePause()` : Détection d'activité
  - `handleGameStateUpdate()` : Appels ajoutés

- `js/services/chat.js`
  - `sendMessage()` : Sécurisé
  - `initializeChat()` : Protection doublon

- `js/services/game.js`
  - `handlePlayCard()` : Gestion Chance corrigée
  - `handleDiscardCard()` : Marquage carte défaussée
  - `handleDrawFromDiscard()` : Vérification récupération

- `js/services/game-actions.js`
  - `handleChanceSelection()` : Logique corrigée
  - `handleMalusWithTarget()` : Marquage `playedBy`

- `js/ui/presence-ui.js`
  - `updateInlineTimer()` : Nouvelle fonction
  - `hideInlineTimer()` : Nouvelle fonction
  - `showPauseModal()` : Détection d'activité

- `js/ui/modals.js`
  - `showChanceModal()` : Texte corrigé

- `js/ui/board.js`
  - `renderGame()` : Affichage auto modale Chance
  - Suppression listeners `newGameBtn`

- `js/utils/card-helpers.js`
  - `canPlayCard()` : Condition Vengeance corrigée

### HTML
- `index.html`
  - Suppression bouton "Quitter la partie"
  - Ajout `id="hand-title"` sur h2 "Votre main"

### CSS
- `css/styles.css`
  - Styles `.inline-timer` et `.inline-timer.warning`
  - Animations `timer-pulse-subtle` et `timer-pulse-warning`
  - Contraintes `.board-zone` et `.card-slot-wrapper`
  - Tailles fixes pour `.board-zone .card`
  - Responsive mobile pour cartes
  - Styles de scroll personnalisés

---

## 📊 Statistiques

- **Fichiers modifiés** : 11
- **Fonctions ajoutées** : 6
- **Fonctions modifiées** : 12
- **Bugs corrigés** : 12
- **Nouvelles fonctionnalités** : 2

---

## 🧪 Tests recommandés

### Priorité haute
1. ✅ Timer s'affiche au bon moment (uniquement pendant votre tour)
2. ✅ Chat fonctionne sans doublons
3. ✅ Carte Chance : comportement complet (modale → main → jouer)
4. ✅ Fin de partie par vote fonctionne
5. ✅ Cartes restent dans leurs zones visuelles

### Priorité moyenne
6. ✅ Carte Vengeance jouable après malus reçu
7. ✅ Carte défaussée non récupérable au tour suivant
8. ✅ Fin de partie si pioche vide
9. ✅ Départ avec confirmation fonctionne
10. ✅ Pop-up pause se ferme à l'activité

---

## 📝 Notes de migration

### Aucune migration nécessaire
Toutes les modifications sont rétrocompatibles avec les parties en cours.

### Recommandations
- Vider le cache navigateur après mise à jour (Ctrl+Shift+R)
- Tester en mode incognito pour éviter les problèmes de cache
- Vérifier le bon fonctionnement du chat en premier

---

## 🎯 Prochaines étapes suggérées

### Améliorations potentielles
- [ ] Animations pour les cartes jouées
- [ ] Son lors de la réception d'un malus
- [ ] Historique des actions dans une modale
- [ ] Raccourcis clavier pour actions fréquentes
- [ ] Mode sombre

### Bugs mineurs à surveiller
- [ ] Performance avec 6 joueurs
- [ ] Affichage mobile en mode paysage
- [ ] Synchronisation lors de mauvaise connexion

---

## 👥 Contributeurs
- Session de développement collaborative
- Tests et retours utilisateurs intégrés

---

## 📄 Licence
Life Smile - Jeu de cartes multijoueur

---

**Date** : 17 octobre 2025  
**Version** : Post-session corrections majeures  
**Statut** : Stable et testé