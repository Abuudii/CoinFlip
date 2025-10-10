import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../App.css";
import { API_URL } from "../utils/config";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); // Token aus URL
    const [newPassword, setNewPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            setMsg("❌ Kein Token in der URL gefunden.");
            return;
        }
        setLoading(true);
        setMsg("");

        try {
            const res = await fetch(`${API_URL}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(`✅ ${data.message}`);
                setTimeout(() => (window.location.href = "/login"), 1500);
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
                <h2>Neues Passwort setzen</h2>
                <p className="sub">Bitte gib dein neues Passwort ein.</p>
                <input
                    className="input"
                    type="password"
                    placeholder="Neues Passwort"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Speichern..." : "Passwort ändern"}
                </button>
                <p style={{ marginTop: "12px" }}>{msg}</p>
            </form>
        </main>
    );
}
