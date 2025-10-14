// src/utils/auth.js

// JWT Payload dekodieren
export function decodeJwt(token) {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        let payload = parts[1];
        // JWT uses URL-safe base64 (- and _). atob expects standard base64.
        payload = payload.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with '=' to make length a multiple of 4
        while (payload.length % 4) payload += '=';
        // atob is available in browsers; in some test/node environments Buffer may be needed
        let json;
        if (typeof atob === 'function') json = atob(payload);
        else json = Buffer.from(payload, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

// prüfen ob Token abgelaufen ist
export function isExpired(token) {
    const d = decodeJwt(token);
    if (!d || !d.exp) return true;
    return Date.now() >= d.exp * 1000;
}

// Token speichern (localStorage oder sessionStorage)
export function saveToken(token, remember) {
    try {
        if (remember) localStorage.setItem("token", token);
        else sessionStorage.setItem("token", token);
    } catch (e) {
        // storage might be unavailable (private mode) - ignore silently
        console.warn('saveToken: storage unavailable', e.message);
    }
}

// Token holen
export function getToken() {
    try {
        return localStorage.getItem("token") || sessionStorage.getItem("token");
    } catch (e) {
        console.warn('getToken: storage unavailable', e.message);
        return null;
    }
}

// Token löschen
export function clearToken() {
    try {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
    } catch (e) {
        console.warn('clearToken: storage unavailable', e.message);
    }
}

// Auto-Logout Timer setzen
let logoutTimer;
export function scheduleAutoLogout(onLogout) {
    clearTimeout(logoutTimer);
    try {
        const t = getToken();
        const d = decodeJwt(t || "");
        if (!d || !d.exp) return;
        const ms = d.exp * 1000 - Date.now();
        if (ms <= 0) return onLogout();
        logoutTimer = setTimeout(onLogout, ms);
    } catch (e) {
        console.warn('scheduleAutoLogout error', e.message);
    }
}

export function cancelAutoLogout() {
    clearTimeout(logoutTimer);
}