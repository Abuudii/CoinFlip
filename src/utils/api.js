import { API_URL } from "./config";

async function jsonFetch(url, opts = {}, retries = 1) {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
        ...opts,
    });

    const text = await res.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        // falls kein JSON, ignorieren
    }

    // nur EINMAL klare Fehlermeldung zurückgeben
    if (!res.ok) {
        const msg =
            data.error ||
            data.message ||
            `Fehler ${res.status} – ${res.statusText}`;
        throw new Error(msg);
    }

    return data;
}

export const registerUser = (username, email, password) =>
    jsonFetch(`${API_URL}/register`, {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
    });

export const loginUser = (identifier, password) =>
    jsonFetch(`${API_URL}/login`, {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
    });

export const getProfile = (token) =>
    jsonFetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
    });
