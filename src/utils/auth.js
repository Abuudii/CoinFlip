// src/utils/auth.js

// JWT Payload dekodieren
export function decodeJwt(token) {
    try {
        const payload = token.split(".")[1];
        return JSON.parse(atob(payload));
    } catch {
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
    if (remember) localStorage.setItem("token", token);
    else sessionStorage.setItem("token", token);
}

// Token holen
export function getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// Token löschen
export function clearToken() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
}

// Auto-Logout Timer setzen
let logoutTimer;
export function scheduleAutoLogout(onLogout) {
    clearTimeout(logoutTimer);
    const t = getToken();
    const d = decodeJwt(t || "");
    if (!d || !d.exp) return;
    const ms = d.exp * 1000 - Date.now();
    if (ms <= 0) return onLogout();
    logoutTimer = setTimeout(onLogout, ms);
}
