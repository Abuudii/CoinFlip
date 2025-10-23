import React from "react";
import "../App.css";

export default function Support() {
    return (
        <main className="container">
            <section className="card">
                <h1>Support</h1>
                <p className="muted">Wenn du Hilfe brauchst, erreich uns über die folgenden Wege:</p>

                <ul>
                    <li>Email: <a href="mailto:support@coinflip.example">support@coinflip.at</a></li>
                    <li>FAQ: <a href="/how-it-works">How it Works / FAQ</a></li>
                    <li>Chat: In Echtzeit über unser Support‑Widget (nicht implementiert)</li>
                </ul>

                <h2>Problem melden</h2>
                <p>Schreibe kurz das Problem und deine Kontaktdaten. Wir melden uns schnellstmöglich.</p>

                <form onSubmit={(e) => { e.preventDefault(); alert('Supportteam ist am Arbeiten)'); }}>
                    <div className="form-row">
                        <label>Name</label>
                        <input className="clean-input" placeholder="Dein Name" />
                    </div>

                    <div className="form-row">
                        <label>Email</label>
                        <input className="clean-input" placeholder="du@beispiel.de" />
                    </div>

                    <div className="form-row">
                        <label>Nachricht</label>
                        <textarea className="clean-input" rows={6} placeholder="Beschreibe dein Problem..." />
                    </div>

                    <div className="form-row">
                        <button className="btn btn-primary">Absenden</button>
                    </div>
                </form>
            </section>
        </main>
    );
}
