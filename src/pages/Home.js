import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function Home() {
    return (
        <main className="main container">
            <section className="hero" aria-labelledby="hero-title">
                <div className="hero-left">
                    <h1 id="hero-title">Schnell. Sicher. Einfach.</h1>
                    <p className="lead">
                        Tausche Fiat und Kryptowährungen in Sekunden — transparent, fair und mit modernen Sicherheitsmechanismen.
                    </p>

                    <div className="hero-ctas">
                        <Link
                            to="/exchange?from=EUR&to=BTC"
                            className="btn btn-outlined"
                            aria-label="Start exchange"
                        >
                            START EXCHANGE
                        </Link>
                        <Link
                            to="/how-it-works"
                            className="btn btn-outlined"
                            aria-label="How it works"
                            style={{ marginLeft: 12 }}
                        >
                            WIE ES FUNKTIONIERT
                        </Link>
                    </div>

                    <ul
                        className="benefits"
                        style={{ listStyle: "none", paddingLeft: 0 }}
                        aria-hidden="false"
                    >
                        <li>🔒 Sicherheit: Gehashte Passwörter</li>
                        <li>⚡ Geschwindigkeit: Instant-Umrechnungen, minimale Latenz</li>
                        <li>🔍 Transparenz: Klare Gebühren & nachvollziehbare Kurse</li>
                    </ul>

                    <div className="trust-row" aria-hidden="true">
                        <span className="trust-badge">✔️ KYC optional</span>
                        <span className="trust-badge">🔁 24/7 Umsätze</span>
                        <span className="trust-badge">📊 Echtzeit-Kurse</span>
                    </div>
                </div>

                <div className="hero-right">
                    <img
                        className="coin"
                        alt="coin icon"
                        src="https://cdn-icons-png.flaticon.com/512/2769/2769230.png"
                    />
                </div>

                <div className="cards">
                    <article className="card">
                        <h3>Verstehen</h3>
                        <p>Schätze Emissionen und vergleiche Kosten einfach.</p>
                    </article>
                    <article className="card">
                        <h3>Unterstützen</h3>
                        <p>Unterstütze Projekte mit transparenten Gebühren.</p>
                    </article>
                    <article className="card">
                        <h3>Sparen</h3>
                        <p>Nutze Favoriten und wiederkehrende Paare für schnellen Zugriff.</p>
                    </article>
                </div>
            </section>
        </main>
    );
}
