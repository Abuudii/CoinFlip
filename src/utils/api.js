import { API_URL } from "./config";

async function jsonFetch(url, opts = {}, retries = 1) {
    try {
        const res = await fetch(url, {
            headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
            ...opts,
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    } catch (e) {
        if (retries > 0) return jsonFetch(url, opts, retries - 1);
        throw e;
    }
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
