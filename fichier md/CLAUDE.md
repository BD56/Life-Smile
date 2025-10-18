# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smile Life** is a multiplayer card game built with vanilla JavaScript and Firebase. The project follows a modular architecture with clear separation of concerns between services (business logic), UI components, utilities, and configuration.

## Build & Development Commands

### Local Development
```bash
# Serve locally
python -m http.server 8000
# Access at http://localhost:8000
```

### Firebase Deployment
```bash
# Deploy to Firebase Hosting
firebase deploy

# View deployment logs
firebase deploy --only hosting
```

### Testing
No automated test suite currently exists. Manual testing is required by:
1. Creating a game and inviting 2-6 players
2. Testing card play mechanics, special actions, and turn flow
3. Verifying Firebase sync across multiple browser tabs

## Architecture

### Core Principles
1. **Separation of Concerns**: Services handle business logic without DOM manipulation; UI modules handle rendering without business logic
2. **Single Responsibility**: Each module has one clear purpose
3. **Callback Pattern**: UI communicates with main.js via callbacks, not direct service calls
4. **Firebase as Source of Truth**: All state mutations go through Firebase; local state is read-only

### Directory Structure
```
public/
├── index.html                    # Main entry point
├── css/styles.css               # Custom styles
└── js/
    ├── main.js                  # Orchestrator: initializes modules, manages global state
    ├── config/
    │   ├── firebase.js          # Firebase configuration
    │   └── cards.js             # 217 card definitions
    ├── services/                # Business logic (no DOM)
    │   ├── firebase-service.js  # CRUD operations for Firebase
    │   ├── game.js              # Core game mechanics (turns, draw, play, discard)
    │   ├── game-actions.js      # Special card actions (malus, vengeance, etc.)
    │   └── chat.js              # Real-time chat
    ├── ui/                      # Interface components (DOM only)
    │   ├── home.js              # Home screen
    │   ├── lobby.js             # Waiting room
    │   ├── board.js             # Main game board
    │   ├── modals.js            # All modal windows
    │   ├── opponents.js         # Opponent display (3 view modes)
    │   └── confirm-modal.js     # Confirmation dialogs
    └── utils/                   # Pure utility functions
        ├── helpers.js           # General utilities (shuffle, URL parsing, clipboard)
        └── card-helpers.js      # Card-specific logic (deck creation, validation, effects)
```

### Data Flow
```
Firebase (source of truth)
    ↓
main.js listenToGame()
    ↓
handleGameStateUpdate()
    ↓
UI Rendering (board.js, opponents.js)
    ↓
User Actions → Callbacks
    ↓
Services (game.js, game-actions.js)
    ↓
firebase-service.js → Firebase
```

## Key Patterns

### Service Layer Pattern
Services contain pure business logic and return success/failure states. They never manipulate the DOM.

```javascript
// services/game.js
export async function handleDrawCard(gameId, gameState, userId) {
    // Pure logic, no DOM
    const card = gameState.drawPile.shift();
    await updateGame(gameId, { drawPile: gameState.drawPile });
}
```

### Callback Injection Pattern
UI modules receive callbacks from main.js to avoid tight coupling:

```javascript
// main.js
BoardUI.initializeBoard({
    onDrawCard: handleDrawCard,
    onPlayCard: handlePlayCard
});

// ui/board.js
export function initializeBoard(callbacks) {
    drawBtn.onclick = callbacks.onDrawCard;
}
```

### State Management
- **Global state**: `main.js` maintains `localGameState`, `userId`, `currentGameId`
- **Module-local state**: UI modules like `opponents.js` maintain view preferences (e.g., `opponentsViewMode`)
- **Never mutate local state directly**: Always update Firebase, then let listeners propagate changes

## Common Tasks

### Adding a New Card

1. **Define card** in `config/cards.js`:
```javascript
'my_card': {
    name: "My Card",
    type: 'special',  // or 'normal', 'malus', 'acquisition'
    category: 'special',
    smiles: 0,
    text: "Card description",
    action: { type: 'my_action' }
}
```

2. **Add to deck** in `utils/card-helpers.js`:
```javascript
// In createFullDeck()
addCards('my_card', 3);  // 3 copies
```

3. **Implement action** in `services/game-actions.js` (if special):
```javascript
case 'my_action':
    // Business logic here
    break;
```

### Adding a Special Card Action

Special actions are handled in `services/game.js` handlePlayCard() function. Add a new case in the switch statement:

```javascript
switch(cardDef.action.type) {
    case 'my_new_action':
        updatePayload[`players.${myPlayerKey}.turnState`] = 'action_my_new_action';
        break;
}
```

Then implement the action handler in `services/game-actions.js`.

### Adding a View Mode for Opponents

Edit `ui/opponents.js` and add to the modes array:
```javascript
const modes = ['expanded', 'compact', 'minimal', 'my_new_mode'];
```

Then implement rendering logic for the new mode in `renderOpponent()`.

## Firebase Configuration

The project uses:
- **Firestore**: Game state storage (`/games/{gameId}`)
- **Firestore Subcollections**: Chat messages (`/games/{gameId}/chat/{messageId}`)
- **Anonymous Auth**: Each player gets a unique userId

**Important**: Update credentials in `public/js/config/firebase.js` before deploying.

## Debugging

### Inspect Global State
```javascript
console.log(window.localGameState);  // Current game state
console.log(window.userId);           // Current user ID
console.log(window.currentGameId);    // Current game ID
```

### Firebase Listener
The main listener is in `main.js`:
```javascript
unsubscribeGame = listenToGame(gameId, handleGameStateUpdate);
```

### Common Issues
- **Card won't play**: Check `canPlayCard()` validation in `utils/card-helpers.js`
- **State not updating**: Verify Firebase updateGame() is called, not direct state mutation
- **UI not rendering**: Check if callbacks are properly passed through `getBoardCallbacks()`
- **Prison turns**: Handled in `services/game.js` at the start of `handleDrawCard()` and `handleDrawFromDiscard()`

## Code Conventions

### Naming
- **Files**: kebab-case (e.g., `game-actions.js`)
- **Functions**: camelCase (e.g., `handleDrawCard()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `CARD_DEFINITIONS`)
- **Booleans**: is/has prefix (e.g., `isMyTurn`, `hasMetier`)

### Async Functions
Always use async/await, not promise chains:
```javascript
// Good
export async function handlePlayCard(gameId, gameState, userId, card) {
    const result = await validateCard(card);
    if (!result.valid) return { success: false };
    await updateGame(gameId, {...});
    return { success: true };
}
```

### Immutability
Copy arrays/objects before modifying:
```javascript
// Good
const newHand = [...player.hand, drawnCard];
await updateGame(gameId, { [`players.${key}.hand`]: newHand });

// Bad - mutates original
player.hand.push(drawnCard);
```

### Error Handling
Always wrap Firebase calls in try-catch:
```javascript
try {
    await updateGame(gameId, {...});
    return true;
} catch (error) {
    console.error("Update failed:", error);
    return false;
}
```

## Important Notes

### File Locations
- The actual codebase is in the `public/` directory
- `index.html` at root is outdated - use `public/index.html`
- Firebase hosting serves from `public/` directory

### Game State Structure
```javascript
{
    status: 'lobby' | 'active' | 'finished',
    currentPlayer: 'p1' | 'p2' | ...,
    drawPile: [{id: 'card_id', instanceId: 'uuid'}],
    discardPile: [{id: 'card_id', instanceId: 'uuid', discardedBy: 'userId'}],
    players: {
        p1: {
            id: 'userId',
            name: 'Player Name',
            hand: [],
            played: [],
            turnState: 'waiting' | 'needs_to_draw' | 'needs_to_play' | 'action_*',
            arcEnCielPlays: 0,
            cardsForChance: [],
            prisonTurns: 0
        }
    },
    endGameVotes: { p1: false, p2: false, ... },
    rematchVotes: { p1: null, p2: null, ... },
    log: 'Last action message'
}
```

### Special Card Mechanics
- **Arc-en-ciel**: Allows 3 consecutive plays. `arcEnCielPlays` counter tracks progress. `handleStopRainbow()` in `game-actions.js` ends the sequence early.
- **Chance**: Shows 3 cards from draw pile. Selected card is auto-played after selection.
- **Piston**: Requires choosing a "métier" card from discard pile to give to current player.
- **Vengeance**: Allows choosing any malus from hand to play on an opponent.
- **Tsunami**: Redistributes all hands equally among players.
- **Prison**: Player skips turns based on `prisonTurns` counter. Decremented at turn start in `handleDrawCard()`.
- **Chercheur**: Players with this card have hand limit of 6 instead of 5.

### Turn Flow
1. Player draws (either from drawPile or discardPile)
2. `turnState` changes from 'needs_to_draw' to 'needs_to_play'
3. Player plays or discards a card
4. `endTurn()` is called, which:
   - Corrects hand sizes (5 cards, or 6 if Chercheur is played)
   - Advances to next player
   - Resets turn states
   - Updates Firebase with all changes

### Card Categories
Cards are organized by `category` for board placement:
- **pro**: Studies/Jobs/Salaries (blue zone)
- **perso**: Flirts/Marriage/Children (pink zone)
- **acquisition**: Houses/Cars/Pets/Distinctions (green zone)
- **malus**: Negative events (red zone)
- **special**: Action cards (discarded after use)

## Related Documentation

For more detailed information, see:
- `README.md` - Architecture overview and quick start
- `CONVENTIONS.md` - Comprehensive coding standards and patterns
- `CHEATSHEET.md` - Quick reference for common snippets
- `MIGRATION.md` - Guide for understanding the refactoring from monolithic code
- `PROJECT_TREE.txt` - Detailed file structure with line counts
