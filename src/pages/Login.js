import React, { useState, useEffect } from "react";
import { loginUser } from "../utils/api";
import { saveToken, scheduleAutoLogout } from "../utils/auth";
import Toast from "../components/Toast";
import "../App.css";

export default function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Enter -> submit
    useEffect(() => {
        const onKey = e => { if (e.key === "Enter") handleLogin(e); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) {
            setToast({ type: "error", message: "Bitte alle Felder ausfüllen" });
            return;
        }
        setLoading(true);
        try {
            const data = await loginUser(identifier.trim(), password);
            saveToken(data.token, remember);
            scheduleAutoLogout(() => setToast({ type: "info", message: "Sitzung abgelaufen – bitte neu anmelden." }));
            setToast({ type: "success", message: "Login erfolgreich!" });
            setTimeout(() => window.location.href = "/exchange", 500);
        } catch (err) {
            setToast({ type: "error", message: err.message || "Login fehlgeschlagen" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <form className="auth auth-neon" onSubmit={handleLogin} noValidate>
                <h2 className="auth-title">Login</h2>
                <p className="auth-sub">Mit Benutzername <em>oder</em> E-Mail</p>

                <div className="field">
                    <label className="label" htmlFor="identifier">Benutzername oder E-Mail</label>
                    <input
                        id="identifier"
                        className="input input-neon"
                        autoComplete="username"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        required
                    />
                </div>

                <div className="field">
                    <label className="label" htmlFor="password">Passwort</label>
                    <div className="input-group input-group-neon">
                        <input
                            id="password"
                            className="input input-neon"
                            type={showPw ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="btn btn-icon btn-toggle"
                            onClick={() => setShowPw(s => !s)}
                            aria-label={showPw ? "Passwort ausblenden" : "Passwort anzeigen"}
                        >
                            <span className="toggle-icon">{showPw ? "👁️‍🗨️" : "👁️"}</span>
                        </button>
                    </div>
                    <div className="row row-neon">
                        <label className="helper">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={e => setRemember(e.target.checked)}
                            /> Angemeldet bleiben
                        </label>
                        <a className="link link-neon" href="/forgot">Passwort vergessen?</a>
                    </div>
                </div>

                <div className="row row-neon row-buttons">
                    <button
                        className="btn btn-gradient"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Wird geprüft…" : "Anmelden"}
                    </button>
                    <a className="btn btn-outlined" href="/register">Neu registrieren</a>
                </div>
            </form>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </main>
    );
}