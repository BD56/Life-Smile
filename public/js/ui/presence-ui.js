/**
 * UI : Affichage des timers et gestion des votes d'éjection
 */


/**
 * Affiche le timer sur l'icône d'un adversaire
 */

/**
 * ✅ NOUVEAU : Afficher le timer à côté de "Votre main"
 */
export function updateInlineTimer(seconds, isWarning) {
    const handTitleEl = document.getElementById('hand-title');
    if (!handTitleEl) return;
    
    // Chercher ou créer l'élément timer
    let timerEl = document.getElementById('inline-timer');
    if (!timerEl) {
        timerEl = document.createElement('span');
        timerEl.id = 'inline-timer';
        timerEl.className = 'inline-timer';
        handTitleEl.appendChild(timerEl);
    }
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    timerEl.className = `inline-timer ${isWarning ? 'warning' : ''}`;
    timerEl.textContent = ` ⏱️ ${timeString}`;
}

/**
 * ✅ NOUVEAU : Cacher le timer inline
 */
export function hideInlineTimer() {
    const timerEl = document.getElementById('inline-timer');
    if (timerEl) timerEl.remove();
}




/**
 * Affiche le timer sur l'icône d'un adversaire
 */
export function renderTimerOnIcon(iconElement, seconds, isWarning) {
    if (!iconElement) return;
    
    // Retirer ancien timer
    const existingTimer = iconElement.querySelector('.turn-timer-overlay');
    if (existingTimer) existingTimer.remove();
    
    // Créer overlay de timer
    const timerOverlay = document.createElement('div');
    timerOverlay.className = 'turn-timer-overlay';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    timerOverlay.innerHTML = `
        <div class="timer-badge ${isWarning ? 'warning' : ''}">
            ⏱️ ${timeString}
        </div>
    `;
    
    iconElement.style.position = 'relative';
    iconElement.appendChild(timerOverlay);
}

/**
 * Retire le timer d'une icône
 */
export function removeTimerFromIcon(iconElement) {
    if (!iconElement) return;
    const existingTimer = iconElement.querySelector('.turn-timer-overlay');
    if (existingTimer) existingTimer.remove();
}

/**
 * Calcule le stroke-dashoffset pour l'animation circulaire
 */
function calculateDashOffset(remainingSeconds, totalSeconds) {
    const circumference = 2 * Math.PI * 36; // rayon = 36
    const progress = remainingSeconds / totalSeconds;
    return circumference * (1 - progress);
}


/**
 * Affiche le timer plein écran pour le joueur actif
 */
export function showFullScreenTimer(seconds, isWarning, onExtensionRequest) {
    // Vérifier si déjà présent
    let timerEl = document.getElementById('fullscreen-timer');
    
    if (!timerEl) {
        timerEl = document.createElement('div');
        timerEl.id = 'fullscreen-timer';
        timerEl.className = 'fullscreen-timer';
        document.body.appendChild(timerEl);
    }
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    timerEl.className = `fullscreen-timer ${isWarning ? 'warning' : ''}`;
    timerEl.innerHTML = `
        <div class="fullscreen-timer-content">
            <div class="timer-label">⏱️ C'est votre tour !</div>
            <div class="timer-display ${isWarning ? 'warning' : ''}">${timeString}</div>
            ${!isWarning ? `
                <button id="extension-btn" class="extension-btn">
                    ⏰ +30 secondes (1×)
                </button>
            ` : '<div class="timer-warning-text">⚠️ Dépêchez-vous !</div>'}
        </div>
    `;
    
    // Gérer le bouton d'extension
    if (!isWarning && onExtensionRequest) {
        const extensionBtn = timerEl.querySelector('#extension-btn');
        if (extensionBtn) {
            extensionBtn.onclick = () => {
                onExtensionRequest();
                extensionBtn.disabled = true;
                extensionBtn.textContent = '✓ Extension utilisée';
            };
        }
    }
}

/**
 * Cache le timer plein écran
 */
export function hideFullScreenTimer() {
    const timerEl = document.getElementById('fullscreen-timer');
    if (timerEl) timerEl.remove();
}

/**
 * Affiche le badge AFK sur une icône
 */
export function showAFKBadge(iconElement, playerName) {
    // Retirer ancien badge
    const existingBadge = iconElement.querySelector('.afk-badge');
    if (existingBadge) return; // Déjà présent
    
    const badge = document.createElement('div');
    badge.className = 'afk-badge';
    badge.innerHTML = `⚠️ AFK`;
    badge.title = `${playerName} est absent`;
    
    iconElement.appendChild(badge);
}

/**
 * Retire le badge AFK
 */
export function removeAFKBadge(iconElement) {
    const existingBadge = iconElement.querySelector('.afk-badge');
    if (existingBadge) existingBadge.remove();
}

/**
 * Affiche la modale de vote d'éjection
 */
export function showKickVoteModal(kickVote, onVote) {
    // Créer la modale
    const modal = document.createElement('div');
    modal.id = 'kick-vote-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50';
    
    const timeLeft = Math.ceil((kickVote.endTime - Date.now()) / 1000);
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
            <div class="text-5xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Vote d'éjection</h2>
            <p class="text-gray-700 mb-6">${kickVote.reason}</p>
            
            <div class="bg-gray-100 rounded-lg p-4 mb-6">
                <div class="text-sm text-gray-600 mb-2">Temps restant</div>
                <div id="vote-timer" class="text-3xl font-bold text-gray-800">${timeLeft}s</div>
            </div>
            
            <p class="text-sm text-gray-600 mb-6">
                Voulez-vous exclure ce joueur de la partie ?
            </p>
            
            <div class="flex gap-4">
                <button id="vote-no-btn" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    ❌ NON, ATTENDRE
                </button>
                <button id="vote-yes-btn" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    ✓ OUI, EXCLURE
                </button>
            </div>
            
            <p class="text-xs text-gray-500 mt-4">
                Si le vote est rejeté, la partie sera mise en pause 2 minutes
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer les votes
    const yesBtn = modal.querySelector('#vote-yes-btn');
    const noBtn = modal.querySelector('#vote-no-btn');
    
    yesBtn.onclick = () => {
        onVote(true);
        modal.remove();
    };
    
    noBtn.onclick = () => {
        onVote(false);
        modal.remove();
    };
    
    // Compte à rebours
    const timerEl = modal.querySelector('#vote-timer');
    const interval = setInterval(() => {
        const remaining = Math.ceil((kickVote.endTime - Date.now()) / 1000);
        if (remaining <= 0) {
            clearInterval(interval);
            modal.remove();
        } else {
            timerEl.textContent = `${remaining}s`;
        }
    }, 1000);
}

/**
 * Cache la modale de vote
 */
export function hideKickVoteModal() {
    const modal = document.getElementById('kick-vote-modal');
    if (modal) modal.remove();
}

/**
 * Affiche la modale de pause (partie à 2 joueurs)
 */
/**
 * ✅ MODIFIÉ : Affiche la modale de pause avec détection d'activité
 */
export function showPauseModal(playerName, pauseEndTime, onWait, onQuit, onUserActive) {
    // Retirer ancienne modale si existante
    hidePauseModal();
    
    const modal = document.createElement('div');
    modal.id = 'pause-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50';
    
    const timeLeft = Math.ceil((pauseEndTime - Date.now()) / 1000);
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
            <div class="text-5xl mb-4">⏸️</div>
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Partie en pause</h2>
            <p class="text-gray-700 mb-4">
                <strong>${playerName}</strong> est absent depuis trop longtemps.<br>
                Impossible de continuer à 2 joueurs.
            </p>
            
            <div class="bg-blue-50 rounded-lg p-4 mb-6">
                <div class="text-sm text-gray-600 mb-2">En attente du retour...</div>
                <div id="pause-timer" class="text-3xl font-bold text-blue-600">${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}</div>
            </div>
            
            <p class="text-sm text-gray-600 mb-6">
                Que souhaitez-vous faire ?
            </p>
            
            <div class="flex flex-col gap-3">
                <button id="wait-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    ⏳ ATTENDRE ${Math.floor(timeLeft / 60)} MIN
                </button>
                <button id="quit-btn" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    🚪 QUITTER
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const waitBtn = modal.querySelector('#wait-btn');
    const quitBtn = modal.querySelector('#quit-btn');
    
    waitBtn.onclick = () => {
        if (onWait) onWait();
    };
    
    quitBtn.onclick = () => {
        if (onQuit) onQuit();
        removeActivityListeners();
        modal.remove();
    };
    
    // ✅ NOUVEAU : Détecter l'activité utilisateur pour fermer la modale
    const activityEvents = ['mousedown', 'touchstart', 'keydown', 'click'];
    const handleActivity = () => {
        console.log('🎯 Activité utilisateur détectée');
        if (onUserActive) onUserActive();
        removeActivityListeners();
        modal.remove();
    };
    
    const removeActivityListeners = () => {
        activityEvents.forEach(event => {
            document.removeEventListener(event, handleActivity);
        });
    };
    
    // Ajouter les listeners après un court délai pour éviter la fermeture immédiate
    setTimeout(() => {
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { once: true });
        });
    }, 500);
    
    // Compte à rebours
    const timerEl = modal.querySelector('#pause-timer');
    const interval = setInterval(() => {
        const remaining = Math.ceil((pauseEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
            clearInterval(interval);
            removeActivityListeners();
            if (onQuit) onQuit();
            modal.remove();
        } else {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

/**
 * Cache la modale de pause
 */
export function hidePauseModal() {
    const modal = document.getElementById('pause-modal');
    if (modal) modal.remove();
}

/**
 * Affiche une notification de retour d'un joueur
 */
export function showPlayerReturnNotification(playerName) {
    const notification = document.createElement('div');
    notification.className = 'player-return-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="text-2xl">🎉</span>
            <span class="notification-text">${playerName} est de retour !</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Retirer après 3 secondes
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

/**
 * Met à jour l'affichage de présence (si nécessaire)
 */
export function updatePresenceUI(gameState, userId) {
    // Fonction optionnelle pour l'affichage de présence
    // Peut être étendue si besoin
}