/**
 * Mélange aléatoirement un tableau (Fisher-Yates)
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Génère un ID de partie unique
 */
export function generateGameId() {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Copie du texte dans le presse-papiers
 */
export async function copyToClipboard(text, type = "Texte") {
    try {
        await navigator.clipboard.writeText(text);
        // ✅ Retourner succès au lieu d'alert
        return { success: true, message: `${type} copié !` };
    } catch (err) {
        // ✅ Retourner échec
        return { success: false, message: text };
    }
}

/**
 * Partage natif ou fallback
 */
export async function shareGame(gameCode, inviteLink) {
    const shareData = {
        title: 'Rejoins ma partie de Life Smile !',
        text: `Rejoins ma partie de Life Smile avec ce code : ${gameCode}`,
        url: inviteLink,
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            alert("La fonction de partage n'est pas supportée sur ce navigateur. Veuillez copier le lien manuellement.");
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("Erreur de partage:", err);
        }
    }
}

/**
 * Obtient l'URL de base sans paramètres
 */
export function getBaseUrl() {
    return window.location.href.split('?')[0].split('#')[0];
}

/**
 * Met à jour l'URL avec le code de partie
 */
export function updateUrlWithGameCode(gameCode) {
    const url = new URL(window.location);
    url.searchParams.set('gameCode', gameCode);
    window.history.replaceState({}, '', url);
}

/**
 * Récupère le code de partie depuis l'URL
 */
export function getGameCodeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('gameCode');
}

/**
 * Trouve la clé du joueur actuel
 */
export function findMyPlayerKey(players, userId) {
    return Object.keys(players).find(key => players[key].id === userId);
}

/**
 * Trie les clés des joueurs pour assurer la cohérence
 */
export function sortPlayerKeys(playerKeys) {
    return [...playerKeys].sort();
}

/**
 * Génère un symbole de vote pour l'affichage
 */
export function getVoteSymbol(vote) {
    if (vote === true) return '<span class="text-green-500">✔</span>';
    if (vote === 'no') return '<span class="text-red-500">✗</span>';
    return '<span>&nbsp;</span>';
}