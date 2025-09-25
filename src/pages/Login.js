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
    useEffect(() => { const onKey = e => { if (e.key === "Enter") handleLogin(e); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); });

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) { setToast({ type: "error", message: "Bitte alle Felder ausfüllen" }); return; }
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
            <form className="auth" onSubmit={handleLogin} noValidate>
                <h2>Login</h2>
                <div className="sub">Mit Benutzername <em>oder</em> E-Mail</div>

                <div className="field">
                    <label className="label" htmlFor="identifier">Benutzername oder E-Mail</label>
                    <input id="identifier" className="input" autoComplete="username"
                        value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                </div>

                <div className="field">
                    <label className="label" htmlFor="password">Passwort</label>
                    <div className="input-group">
                        <input id="password" className="input" type={showPw ? "text" : "password"}
                            autoComplete="current-password"
                            value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="button" className="btn btn-ghost" onClick={() => setShowPw(s => !s)} aria-label="Passwort anzeigen/ausblenden">
                            {showPw ? "Hide" : "Show"}
                        </button>
                    </div>
                    <div className="row">
                        <label className="helper"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Angemeldet bleiben</label>
                        <a className="link" href="/forgot">Passwort vergessen?</a>

                    </div>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Wird geprüft…" : "Anmelden"}
                    </button>
                    <a className="btn btn-ghost" href="/register">Neu registrieren</a>
                </div>
            </form>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </main>
    );
}
