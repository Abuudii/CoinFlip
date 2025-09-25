import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../utils/auth";
import "../App.css";

export default function Header() {
    const nav = useNavigate();
    const authed = !!getToken();

    const logout = () => { clearToken(); nav("/login"); };

    return (
        <header className="header">
            <div className="header-inner container">
                <div className="brand">
                    <img alt="logo" src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" />
                    Coin Flip
                </div>

                <nav className="nav" aria-label="Hauptnavigation">
                    <Link to="/">Home</Link>
                    <Link to="/exchange">Exchange</Link>
                    {!authed && <Link to="/login">Login</Link>}
                    {!authed && <Link to="/register">Register</Link>}
                </nav>

                <div className="user-actions">
                    {authed && <span className="badge">angemeldet</span>}
                    {authed && <button className="btn btn-ghost" onClick={logout}>Logout</button>}
                    <a className="btn btn-primary" href="/exchange">Start</a>
                </div>
            </div>
        </header>
    );
}
