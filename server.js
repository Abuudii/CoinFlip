require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Verbindung zur MySQL-Datenbank (aus .env)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// Testverbindung
(async () => {
    try {
        const conn = await db.getConnection();
        console.log("✅ Erfolgreich mit MySQL verbunden!");
        conn.release();
    } catch (err) {
        console.error("❌ DB-Verbindung fehlgeschlagen:", err.message);
    }
})();

// ==========================================================
// 📊 1. Hole alle verfügbaren Währungen aus der Datenbank
// ==========================================================
app.get("/api/exchange/currencies", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT DISTINCT base_currency AS currency FROM exchange_rates
      UNION
      SELECT DISTINCT target_currency AS currency FROM exchange_rates
      ORDER BY currency ASC
    `);

        const currencies = rows.map((r) => r.currency);
        if (currencies.length === 0) {
            return res.json({
                success: false,
                currencies: [],
                message: "Keine Währungen in der Datenbank gefunden.",
            });
        }

        res.json({ success: true, currencies });
    } catch (err) {
        console.error("❌ Fehler in /api/exchange/currencies:", err);
        res.status(500).json({
            success: false,
            message: "Fehler beim Laden der Währungen.",
        });
    }
});

// ==========================================================
// 💱 2. Berechne Umrechnung basierend auf Datenbankwerten
// ==========================================================
app.get("/api/exchange", async (req, res) => {
    try {
        const { from, to, amount } = req.query;
        if (!from || !to || !amount) {
            return res
                .status(400)
                .json({ success: false, message: "Parameter fehlen." });
        }

        const [rows] = await db.query(
            "SELECT rate FROM exchange_rates WHERE base_currency=? AND target_currency=? LIMIT 1",
            [from, to]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Kein Kurs für ${from} → ${to} gefunden.`,
            });
        }

        const rate = parseFloat(rows[0].rate);
        const result = (parseFloat(amount) * rate).toFixed(2);

        res.json({
            success: true,
            from,
            to,
            rate,
            amount: parseFloat(amount),
            result: parseFloat(result),
        });
    } catch (err) {
        console.error("❌ Fehler in /api/exchange:", err);
        res.status(500).json({ success: false, message: "Serverfehler." });
    }
});

// ==========================================================
// ➕ 3. Kurs hinzufügen oder aktualisieren
// ==========================================================
app.post("/api/exchange/add", async (req, res) => {
    try {
        const { from, to, rate } = req.body;
        if (!from || !to || !rate) {
            return res.status(400).json({
                success: false,
                message: "Daten fehlen (from, to, rate).",
            });
        }

        await db.query(
            `INSERT INTO exchange_rates (base_currency, target_currency, rate)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rate=VALUES(rate), updated_at=NOW()`,
            [from, to, rate]
        );

        res.json({ success: true, message: "Kurs erfolgreich gespeichert." });
    } catch (err) {
        console.error("❌ Fehler in /api/exchange/add:", err);
        res.status(500).json({ success: false, message: "Fehler beim Speichern." });
    }
});

// Root
app.get("/", (req, res) => {
    res.send("💱 Fiat Exchange REST-API läuft!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
