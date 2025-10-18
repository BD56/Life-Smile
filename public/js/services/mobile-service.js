/**
 * SERVICE : Détection et gestion du mode mobile
 * VERSION CORRIGÉE - Applique bien les classes CSS
 */

// État du mode mobile
let isMobileDevice = false;
let isLandscape = false;
let viewportWidth = 0;
let viewportHeight = 0;

/**
 * Détecte si l'appareil est mobile
 */
export function detectMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    const isMobileScreen = window.innerWidth <= 1024;
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    isMobileDevice = (isMobileUA || isMobileScreen) && hasTouchSupport;
    
    console.log('🔍 Détection mobile:', {
        userAgent: isMobileUA,
        screen: isMobileScreen,
        touch: hasTouchSupport,
        result: isMobileDevice
    });
    
    return isMobileDevice;
}

/**
 * Détecte l'orientation de l'écran
 */
export function detectOrientation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    isLandscape = width > height;
    viewportWidth = width;
    viewportHeight = height;
    
    return isLandscape ? 'landscape' : 'portrait';
}

/**
 * Initialise le mode mobile - VERSION CORRIGÉE
 */
export function initializeMobileMode() {
    const isMobile = detectMobileDevice();
    const orientation = detectOrientation();
    
    console.log('📱 Initialisation mode mobile:', { isMobile, orientation });
    
    if (isMobile) {
        // ✅ CORRECTION : Ajouter les classes au body
        document.body.classList.add('mobile-mode');
        document.body.classList.add(orientation);
        
        // Vérifier que les classes sont bien appliquées
        console.log('✅ Classes ajoutées au body:', {
            hasMobileMode: document.body.classList.contains('mobile-mode'),
            hasOrientation: document.body.classList.contains(orientation),
            allClasses: Array.from(document.body.classList)
        });
        
        // Empêcher le zoom par pincement
        preventDefaultZoom();
        
        // Optimiser les performances tactiles
        optimizeTouchPerformance();
        
        // Adapter les modales
        adaptModalsForMobile();
        
        // Adapter le chat
        adaptChatForMobile();
        
        console.log('✅ Mode mobile activé:', {
            device: 'mobile',
            orientation,
            viewport: `${viewportWidth}x${viewportHeight}`
        });
    } else {
        document.body.classList.add('desktop-mode');
        console.log('✅ Mode desktop activé');
    }
    
    return isMobile;
}

/**
 * Empêche le zoom par pincement
 */
function preventDefaultZoom() {
    document.addEventListener('dblclick', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    }, { passive: false });
}

/**
 * Optimise les performances tactiles
 */
function optimizeTouchPerformance() {
    const style = document.createElement('style');
    style.id = 'mobile-touch-optimization';
    style.textContent = `
        .mobile-mode .card {
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        
        .mobile-mode button {
            touch-action: manipulation;
        }
        
        .mobile-mode input {
            font-size: 16px !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Adapte les modales pour mobile
 */
function adaptModalsForMobile() {
    const style = document.createElement('style');
    style.id = 'mobile-modal-styles';
    style.textContent = `
        .mobile-mode #card-modal > div,
        .mobile-mode #choice-modal > div,
        .mobile-mode #target-modal > div,
        .mobile-mode #action-modal > div {
            max-height: 90vh;
            max-width: 95vw;
        }
        
        .mobile-mode #modal-content {
            max-height: 60vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Adapte le chat pour mobile
 */
function adaptChatForMobile() {
    const style = document.createElement('style');
    style.id = 'mobile-chat-styles';
    style.textContent = `
        .mobile-mode #chat-container {
            bottom: 0;
            right: 0;
            width: 100%;
            height: 60vh;
            border-radius: 16px 16px 0 0;
        }
        
        .mobile-mode #chat-toggle-btn {
            bottom: 16px;
            right: 16px;
            width: 56px;
            height: 56px;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Écoute les changements d'orientation
 */
export function onOrientationChange(callback) {
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            const newOrientation = detectOrientation();
            document.body.classList.remove('portrait', 'landscape');
            document.body.classList.add(newOrientation);
            
            console.log('🔄 Orientation changée:', newOrientation);
            
            if (callback) {
                callback(newOrientation, {
                    width: viewportWidth,
                    height: viewportHeight
                });
            }
        }, 100);
    });
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const oldOrientation = isLandscape ? 'landscape' : 'portrait';
            const newOrientation = detectOrientation();
            
            if (oldOrientation !== newOrientation) {
                document.body.classList.remove('portrait', 'landscape');
                document.body.classList.add(newOrientation);
                
                console.log('🔄 Orientation changée (resize):', newOrientation);
                
                if (callback) {
                    callback(newOrientation, {
                        width: viewportWidth,
                        height: viewportHeight
                    });
                }
            }
        }, 200);
    });
}

/**
 * Adapte l'affichage des adversaires pour mobile
 */
/**export function adaptOpponentsView() {
    if (!isMobileDevice) return 'expanded';
    
    const orientation = detectOrientation();
    return orientation === 'portrait' ? 'compact' : 'minimal';
}
*/
// Dans adaptOpponentsView()
export function adaptOpponentsView() {
    if (!isMobileDevice) return 'expanded';
    
    const orientation = detectOrientation();
    const opponentsCount = getOpponentsCount(); // À implémenter
    
    // Mobile portrait : toujours minimal ou icons
    if (orientation === 'portrait') {
        return opponentsCount >= 4 ? 'icons' : 'minimal';
    }
    
    // Mobile landscape : compact ou minimal
    return opponentsCount >= 3 ? 'minimal' : 'compact';
}

/**
 * Adapte la taille des cartes pour mobile
 */
export function adaptCardSize(cardElement) {
    if (!isMobileDevice || !cardElement) return;
    
    const orientation = detectOrientation();
    
    if (orientation === 'portrait') {
        cardElement.style.minWidth = '100px';
        cardElement.style.fontSize = '0.75rem';
    } else {
        cardElement.style.minWidth = '80px';
        cardElement.style.fontSize = '0.65rem';
    }
}

/**
 * Affiche un message d'orientation recommandée
 */
export function suggestBestOrientation() {
    if (!isMobileDevice) return;
    
    const orientation = detectOrientation();
    
    if (orientation === 'portrait') {
        const message = document.createElement('div');
        message.id = 'orientation-suggestion';
        message.style.cssText = `
            position: fixed;
            top: 16px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            font-size: 0.85rem;
            text-align: center;
            max-width: 90vw;
        `;
        message.textContent = '💡 Tournez votre appareil en mode paysage pour une meilleure expérience';
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.transition = 'opacity 0.5s';
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 500);
        }, 5000);
    }
}

/**
 * Vérifie si le device est en mode mobile
 */
export function isMobile() {
    return isMobileDevice;
}

/**
 * Retourne les dimensions actuelles du viewport
 */
export function getViewportInfo() {
    return {
        width: viewportWidth,
        height: viewportHeight,
        orientation: isLandscape ? 'landscape' : 'portrait',
        isMobile: isMobileDevice
    };
}