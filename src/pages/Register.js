import React, { useMemo, useState } from "react";
import { registerUser } from "../utils/api";
import Toast from "../components/Toast";
import "../App.css";

function scorePassword(pw) {
    let s = 0;
    if (!pw) return 0;
    if (pw.length >= 8) s += 25;
    if (/[A-Z]/.test(pw)) s += 15;
    if (/[a-z]/.test(pw)) s += 15;
    if (/[0-9]/.test(pw)) s += 15;
    if (/[^A-Za-z0-9]/.test(pw)) s += 15;
    if (pw.length >= 12) s += 15;
    return Math.min(s, 100);
}

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const strength = useMemo(() => scorePassword(password), [password]);
    const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!username || !emailValid || password.length < 6) {
            setToast({ type: "error", message: "Bitte Eingaben prüfen (gültige E-Mail, Passwort ≥ 6)." });
            return;
        }
        setLoading(true);
        try {
            const data = await registerUser(username.trim(), email.trim(), password);
            setToast({ type: "success", message: data.message || "Registriert!" });
            if (data.previewUrl) window.open(data.previewUrl, "_blank", "noopener,noreferrer");
            setTimeout(() => window.location.href = "/login", 800);
        } catch (err) {
            setToast({ type: "error", message: err.message || "Registrierung fehlgeschlagen" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <form className="auth auth-neon" onSubmit={onSubmit} noValidate>
                <h2 className="auth-title">Registrieren</h2>
                <p className="auth-sub">Erstelle deinen sicheren Account</p>

                <div className="field">
                    <label className="label" htmlFor="username">Benutzername</label>
                    <input
                        id="username"
                        className="input input-neon"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                    <div className="helper">min. 3 Zeichen</div>
                </div>

                <div className="field">
                    <label className="label" htmlFor="email">E-Mail</label>
                    <input
                        id="email"
                        className="input input-neon"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        aria-invalid={!emailValid}
                    />
                    {!emailValid && email && <div className="helper" style={{ color: "var(--danger)" }}>Bitte gültige E-Mail angeben</div>}
                </div>

                <div className="field">
                    <label className="label" htmlFor="password">Passwort</label>
                    <div className="input-group input-group-neon">
                        <input
                            id="password"
                            className="input input-neon"
                            type={showPw ? "text" : "password"}
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
                    <div className="meter meter-neon" aria-hidden="true"><i style={{ width: `${strength}%` }} /></div>
                    <div className="helper">Mind. 8 Zeichen, ideal: Groß/Klein, Zahl, Sonderzeichen.</div>
                </div>

                <div className="row row-neon row-buttons">
                    <button
                        className="btn btn-gradient"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Wird angelegt…" : "Konto erstellen"}
                    </button>
                    <a className="btn btn-outlined" href="/login">Ich habe bereits ein Konto</a>
                </div>
            </form>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </main>
    );
}