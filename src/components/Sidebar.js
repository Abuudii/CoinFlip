import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearToken, getToken, decodeJwt } from "../utils/auth";
import "../App.css";

export default function Sidebar() {
    const nav = useNavigate();
    const token = getToken();
    if (!token) return null;

    const user = decodeJwt(token);
    const username = user?.username || "User";

    const logout = () => {
        clearToken();
        nav("/login");
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-logo">CoinFlipX</h2>
                <span className="sidebar-user">👋 Hallo, {username}</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/exchange/fiat" className="sidebar-link">
                    💱 Währung Exchange
                </NavLink>
                <NavLink to="/exchange/crypto" className="sidebar-link">
                    ₿ Crypto Exchange
                </NavLink>
                <NavLink to="/exchange/graph" className="sidebar-link">
                    📊 Graphen
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="btn btn-danger">
                    Logout
                </button>
            </div>
        </aside>
    );
}
