import React from "react";
import "../App.css";


export default function HowItWorks() {
    return (
        <main className="container">
            <div className="howitworks-card">
                <h1>Wie CoinFlip funktioniert</h1>

                <p className="muted">Kurz und knapp: Wir ermöglichen den schnellen Tausch zwischen Fiat‑ und Kryptowährungen — sicher, transparent und ohne komplizierte Abläufe.</p>

                <h2>So funktioniert's</h2>
                <ol>
                    <li>Wähle die Währungen (z. B. EUR → BTC) und den Betrag.</li>
                    <li>Sieh dir den aktuellen Wechselkurs an und bestätige die Transaktion.</li>
                    <li>Bei Bedarf logge dich ein oder erstelle ein Konto, um Guthaben zu speichern und Transfers zu tätigen.</li>
                    <li>Wir führen die Umrechnung durch und buchen das Ergebnis auf dein Konto bzw. liefern die Auszahlung.</li>
                </ol>

                <h2>Sicherheit & Datenschutz</h2>
                <p className="muted">Deine Daten und Guthaben sind uns wichtig. Passwörter werden gehasht, sensible Informationen nicht im Klartext gespeichert und API‑Zugriffe sind JWT‑gesichert.</p>

                <h2>Gebühren</h2>
                <p className="muted">Gebühren werden transparent vor Bestätigung angezeigt. Es gibt keine versteckten Kosten — nur der angezeigte Kurs und eine kleine Servicegebühr.</p>

                <h2>Support & Hilfe</h2>
                <p className="muted">Bei Problemen erreichst du unseren Support unter <a href="/support">/support</a> oder per Email (siehe Support‑Seite).</p>

                <h2>Noch Fragen?</h2>
                <p className="muted">Wenn du möchtest, erweitere ich diese Seite mit einem FAQ‑Bereich, Screenshots oder einem Schritt‑für‑Schritt‑Video.</p>
            </div>
        </main>
    );
}
