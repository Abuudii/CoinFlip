import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../utils/auth";
import "../App.css";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const nav = useNavigate();
    const authed = !!getToken();

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <header className="header">
            <div className="header-inner">
                <div className="brand">
                    <span className="logo-text">CoinFlip</span>
                </div>

                <nav className="nav desktop-nav">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/how-it-works" className="nav-link">How it Works</Link>
                    <Link to="/exchange" className="nav-link">Exchange</Link>
                    <Link to="/support" className="nav-link">Support</Link>
                </nav>

                <div className="user-actions desktop-actions">
                    {!authed && <Link to="/login" className="btn btn-outlined">Login</Link>}
                    {!authed && <Link to="/register" className="btn btn-gradient">Registrieren</Link>}
                    {authed && <span className="badge">Angemeldet</span>}
                    {authed && <button className="btn btn-danger" onClick={() => { clearToken(); nav("/login"); closeMenu(); }}>Abmelden</button>}
                </div>

                <button className="hamburger" onClick={toggleMenu} aria-label={isOpen ? "Menü schließen" : "Menü öffnen"}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
                <nav className="nav mobile-nav">
                    <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
                    <Link to="/how-it-works" className="nav-link" onClick={closeMenu}>How it Works</Link>
                    <Link to="/exchange" className="nav-link" onClick={closeMenu}>Exchange</Link>
                    <Link to="/support" className="nav-link" onClick={closeMenu}>Support</Link>
                    {!authed && <Link to="/login" className="nav-link btn-outlined" onClick={closeMenu}>Login</Link>}
                    {!authed && <Link to="/register" className="nav-link btn-gradient" onClick={closeMenu}>Registrieren</Link>}
                    {authed && <span className="nav-link badge">Angemeldet</span>}
                    {authed && <button className="nav-link btn-danger" onClick={() => { clearToken(); nav("/login"); closeMenu(); }}>Abmelden</button>}
                    {/* Admin link for mobile menu */}
                    {authed && (() => {
                        try {
                            const token = getToken();
                            const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
                            if (payload && payload.role === 'admin') return <Link to="/admin" className="nav-link" onClick={closeMenu}>Admin</Link>;
                        } catch (e) { }
                        return null;
                    })()}
                </nav>
            </div>
        </header>
    );
}