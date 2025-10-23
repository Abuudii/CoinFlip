import React from "react";
import { NavLink } from "react-router-dom";
import { getToken, decodeJwt } from "../utils/auth";
import "../App.css";
import { useEffect, useState } from "react";
import { API_URL } from "../utils/config";


export default function Sidebar({ onLogout }) {
    const token = getToken();
    const [favorites, setFavorites] = useState([]);
    const [favoritesExpanded, setFavoritesExpanded] = useState(false);

    const fetchFavorites = async () => {
        try {
            if (!token) return;
            const res = await fetch(`${API_URL}/favorites`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setFavorites(data.favorites);
        } catch (err) {
            console.error("Fehler beim Laden der Favoriten:", err);
        }
    };

    useEffect(() => {
        fetchFavorites();

        // Event Listener für Favoriten-Updates
        const handleFavoriteUpdate = () => fetchFavorites();
        window.addEventListener("favorites:updated", handleFavoriteUpdate);

        return () => {
            window.removeEventListener("favorites:updated", handleFavoriteUpdate);
        };
    }, [token]);

    if (!token) return null;

    const user = decodeJwt(token);
    const username = user?.username || "User";

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-logo">CoinFlip</h2>
                <span className="sidebar-user">👋 Hallo, {username}</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/exchange/fiat" className="sidebar-link">
                    💱 <span>Fiat Exchange</span>
                </NavLink>

                <NavLink to="/exchange/crypto" className="sidebar-link">
                    ₿ <span>Crypto Exchange</span>
                </NavLink>

                <NavLink to="/portfolio" className="sidebar-link">
                    💼 <span>Portfolio</span>
                </NavLink>

                {user?.role === "admin" && (
                    <NavLink to="/admin" className="sidebar-link">
                        ⚙️ <span>Admin Panel</span>
                    </NavLink>
                )}
            </nav>

            {/* ⭐ Favoriten-Bereich */}
            {favorites.length > 0 && (
                <div className="favorites-section">
                    <div
                        className="favorites-header"
                        onClick={() => setFavoritesExpanded(!favoritesExpanded)}
                    >
                        <h4 className="favorites-title">⭐ Favoriten</h4>
                        <span className={`favorites-arrow ${favoritesExpanded ? 'expanded' : ''}`}>
                            ▼
                        </span>
                    </div>

                    {favoritesExpanded && (
                        <nav className="sidebar-nav favorites-list">
                            {favorites.map((fav) => {
                                const parts = fav.split('/');
                                const from = parts[0];
                                const to = parts[1];
                                const cryptoSet = new Set(["BTC", "ETH", "XRP", "LTC", "BCH", "ADA", "DOT", "DOGE"]);
                                const isCryptoPair = cryptoSet.has(from) || cryptoSet.has(to);
                                const toPath = isCryptoPair ? '/exchange/crypto' : '/exchange/fiat';
                                return (
                                    <NavLink
                                        key={fav}
                                        to={`${toPath}?from=${from}&to=${to}`}
                                        className="sidebar-link"
                                    >
                                        💱 <span>{fav}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>
                    )}
                </div>
            )}

            <div className="sidebar-footer">
                <button onClick={onLogout} className="btn logout-btn">
                    Logout
                </button>
            </div>
        </aside>
    );
}
