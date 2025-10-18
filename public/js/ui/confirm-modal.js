// Éléments DOM
const confirmModal = document.getElementById('confirm-modal');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalMessage = document.getElementById('confirm-modal-message');
const confirmModalOkBtn = document.getElementById('confirm-modal-ok-btn');
const confirmModalCancelBtn = document.getElementById('confirm-modal-cancel-btn');

// Éléments DOM pour alert
const alertModal = document.getElementById('alert-modal');
const alertModalTitle = document.getElementById('alert-modal-title');
const alertModalMessage = document.getElementById('alert-modal-message');
const alertModalOkBtn = document.getElementById('alert-modal-ok-btn');


let resolveCallback = null;

/**
 * Affiche une modale de confirmation personnalisée
 * @param {string} message - Le message à afficher
 * @param {string} title - Le titre (optionnel)
 * @returns {Promise<boolean>} - true si OK cliqué, false si Annuler
 */


/**
 * Affiche une modale d'alerte
 * @param {string} message - Le message à afficher
 * @param {string} title - Le titre (optionnel)
 * @returns {Promise<void>}
 */

/**
 * Affiche une notification toast (non-bloquante)
 * @param {string} message - Message à afficher
 * @param {string} type - 'success' | 'error' | 'info'
 */

export function showAlert(message, title = "Information") {
    return new Promise((resolve) => {
        alertModalTitle.textContent = title;
        alertModalMessage.textContent = message;
        
        alertModal.classList.remove('hidden');
        alertModal.classList.add('flex');
        
        const handleClose = () => {
            alertModal.classList.add('hidden');
            alertModal.classList.remove('flex');
            alertModalOkBtn.removeEventListener('click', handleClose);
            resolve();
        };
        
        alertModalOkBtn.addEventListener('click', handleClose);
    });
}



export function showConfirm(message, title = "Confirmation") {
    return new Promise((resolve) => {
        resolveCallback = resolve;
        
        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        
        confirmModal.classList.remove('hidden');
        confirmModal.classList.add('flex');
    });
}

/**
 * Masque la modale de confirmation
 */
function hideConfirm(result) {
    confirmModal.classList.add('hidden');
    confirmModal.classList.remove('flex');
    
    if (resolveCallback) {
        resolveCallback(result);
        resolveCallback = null;
    }
}

/**
 * Initialise les listeners
 */
export function initializeConfirmModal() {
    confirmModalOkBtn.addEventListener('click', () => hideConfirm(true));
    confirmModalCancelBtn.addEventListener('click', () => hideConfirm(false));
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !confirmModal.classList.contains('hidden')) {
            hideConfirm(false);
        }
    });

        
    // Gérer Escape pour alert aussi
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!confirmModal.classList.contains('hidden')) {
                hideConfirm(false);
            }
            if (!alertModal.classList.contains('hidden')) {
                alertModal.classList.add('hidden');
                alertModal.classList.remove('flex');
            }
        }
    });

}

export function showToast(message, type = 'success') {
    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-[60] px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-slide-in`;
    
    // Couleur selon le type
    if (type === 'success') {
        toast.classList.add('bg-green-500');
        toast.innerHTML = `✅ ${message}`;
    } else if (type === 'error') {
        toast.classList.add('bg-red-500');
        toast.innerHTML = `❌ ${message}`;
    } else {
        toast.classList.add('bg-blue-500');
        toast.innerHTML = `ℹ️ ${message}`;
    }
    
    document.body.appendChild(toast);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        toast.style.animation = 'slide-out 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}