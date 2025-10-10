import React, { useState } from "react";
import "../App.css";
import { API_URL } from "../utils/config";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");

        try {
            const res = await fetch(`${API_URL}/request-reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(`✅ ${data.message}`);
                if (data.previewUrl) {
                    // Ethereal Test-Link automatisch öffnen
                    window.open(data.previewUrl, "_blank");
                }
            } else {
                setMsg(`❌ ${data.error}`);
            }
        } catch (err) {
            setMsg("❌ Server nicht erreichbar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container">
            <form className="auth" onSubmit={handleSubmit}>
                <h2>Passwort zurücksetzen</h2>
                <p className="sub">Gib deine registrierte E-Mail-Adresse ein.</p>
                <input
                    className="input"
                    type="email"
                    placeholder="E-Mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Senden..." : "Reset-Link anfordern"}
                </button>
                <p style={{ marginTop: "12px" }}>{msg}</p>
            </form>
        </main>
    );
}
