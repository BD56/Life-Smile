import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
let unsubscribeChat = null;
let isChatOpen = false;
let unreadCount = 0;

// Éléments DOM
const chatToggleBtn = document.getElementById('chat-toggle-btn');
const chatNotificationBadge = document.getElementById('chat-notification-badge');
const chatContainer = document.getElementById('chat-container');
const chatMinimizeBtn = document.getElementById('chat-minimize-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

/**
 * Initialise le système de chat
 */
export function initializeChat() {
    chatToggleBtn.addEventListener('click', () => toggleChat(true));
    chatMinimizeBtn.addEventListener('click', () => toggleChat(false));
    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

/**
 * Écoute les messages d'une partie
 */
export function listenToChat(db, gameId, userId) {
    if (unsubscribeChat) unsubscribeChat();
    
    const chatRef = collection(db, "games", gameId, "chat");
    const q = query(chatRef, orderBy("timestamp"));

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                const msg = change.doc.data();
                addMessageToUI(msg);

                if (!isChatOpen && msg.senderId !== userId) {
                    unreadCount++;
                    updateBadge();
                }
            }
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

/**
 * Ajoute un message à l'interface
 */
function addMessageToUI(msg) {
    const msgEl = document.createElement('div');
    msgEl.classList.add('mb-2');
    msgEl.innerHTML = `<span class="font-bold">${msg.senderName || 'Anonyme'}:</span> ${escapeHtml(msg.text)}`;
    chatMessages.appendChild(msgEl);
}

/**
 * Envoie un message
 */
async function sendMessage() {
    // ✅ Vérifier que chatInput existe
    if (!chatInput) {
        console.error('❌ Élément chat-input introuvable');
        return;
    }
    
    const text = chatInput.value?.trim() || '';
    
    console.log('📤 Tentative envoi message:', {
        text,
        currentGameId: window.currentGameId,
        userId: window.userId
    });
    
    if (!text) {
        console.warn('⚠️ Texte vide');
        return;
    }
    
    if (!window.currentGameId || !window.userId || !window.db || !window.localGameState) {
        console.error('❌ Variables globales manquantes');
        return;
    }

    const playerKeys = Object.keys(window.localGameState.players);
    const myPlayerKey = playerKeys.find(key => window.localGameState.players[key].id === window.userId);
    
    if (!myPlayerKey) {
        console.error('❌ Joueur non trouvé');
        return;
    }
    
    const senderName = window.localGameState.players[myPlayerKey].name || myPlayerKey;
    const chatRef = collection(window.db, "games", window.currentGameId, "chat");
    
    try {
        await addDoc(chatRef, {
            senderId: window.userId,
            senderName: senderName,
            text: text,
            timestamp: serverTimestamp()
        });
        console.log('✅ Message envoyé !');
        chatInput.value = '';
    } catch (error) {
        console.error("❌ Erreur envoi:", error);
    }
}
/**
 * Bascule l'affichage du chat
 */
export function toggleChat(forceShow = null) {
    const isVisible = !chatContainer.classList.contains('translate-x-full');
    isChatOpen = forceShow === true || (forceShow === null && !isVisible);

    if (isChatOpen) {
        chatContainer.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
        unreadCount = 0;
        updateBadge();
    } else {
        chatContainer.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
    }
}

/**
 * Met à jour le badge de notifications
 */
function updateBadge() {
    if (unreadCount > 0) {
        chatNotificationBadge.textContent = unreadCount;
        chatNotificationBadge.classList.remove('hidden');
    } else {
        chatNotificationBadge.classList.add('hidden');
    }
}

/**
 * Nettoie le listener
 */
export function cleanupChat() {
    if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
    }
    chatMessages.innerHTML = '';
    unreadCount = 0;
    updateBadge();
    isChatOpen = false;
}

/**
 * Échappe le HTML pour éviter les injections
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Affiche/masque le bouton de chat
 */
export function showChatButton(show = true) {
    if (show) {
        chatToggleBtn.classList.remove('hidden');
    } else {
        chatToggleBtn.classList.add('hidden');
    }
}