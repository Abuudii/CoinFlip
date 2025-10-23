// ============================
// 💱 Coinflip REST Backend (mit Portfolio & Transfer & CryptoExchange)
// ============================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cron = require("node-cron");
const path = require("path");
const fs = require("fs");

// ✅ node-fetch Setup (funktioniert in Node 16–22)
let fetch;
(async () => {
    try {
        fetch = (await import("node-fetch")).default;
        console.log("✅ node-fetch erfolgreich geladen!");
    } catch (err) {
        console.error("❌ Konnte node-fetch nicht laden:", err.message);
    }
})();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Verbindung zur MySQL-Datenbank
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
// ₿ Crypto Exchange Daten (CoinGecko API Integration)
// ==========================================================
const COINS = ["bitcoin", "ethereum", "ripple", "dogecoin", "solana", "cardano"];
const COIN_SYMBOLS = {
    bitcoin: "BTC",
    ethereum: "ETH",
    ripple: "XRP",
    dogecoin: "DOGE",
    solana: "SOL",
    cardano: "ADA",
};

// Hole Daten von CoinGecko und aktualisiere die DB
async function updateCryptoExchangeData() {
    try {
        console.log("🔄 Lade Krypto-Kurse von CoinGecko...");
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(",")}&vs_currencies=usd`;
        const response = await fetch(url);
        const data = await response.json();

        const conn = await db.getConnection();
        for (const [coin, info] of Object.entries(data)) {
            const symbol = COIN_SYMBOLS[coin] || coin.toUpperCase();
            await conn.query(
                `
                INSERT INTO crypto_exchange (symbol, price_usd)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE
                    price_usd = VALUES(price_usd),
                    last_updated = CURRENT_TIMESTAMP
                `,
                [symbol, info.usd]
            );
        }
        conn.release();
        console.log("✅ Crypto-Kurse aktualisiert!");
    } catch (err) {
        console.error("❌ Fehler beim Aktualisieren der Crypto-Daten:", err.message);
    }
}

// Beim Start sofort laden + alle 10 Minuten automatisch
updateCryptoExchangeData();
cron.schedule("*/10 * * * *", updateCryptoExchangeData);

// ==========================================================
// 🔹 API-Routen für CryptoExchange.js
// ==========================================================

// 1️⃣ Liste der verfügbaren Krypto-Währungen
app.get("/api/crypto/currencies", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT symbol AS currency FROM crypto_exchange ORDER BY symbol ASC");
        const currencies = rows.map((r) => r.currency);
        res.json({ success: true, currencies });
    } catch (err) {
        console.error("❌ Fehler /api/crypto/currencies:", err.message);
        res.status(500).json({ success: false, message: "Fehler beim Laden der Krypto-Währungen." });
    }
});

// 2️⃣ Umrechnung zwischen Krypto-Währungen
app.get("/api/crypto/convert", async (req, res) => {
    try {
        const { from, to, amount } = req.query;
        if (!from || !to || !amount)
            return res.status(400).json({ success: false, message: "Parameter fehlen." });

        const [rows] = await db.query(
            "SELECT symbol, price_usd FROM crypto_exchange WHERE symbol IN (?, ?)",
            [from, to]
        );

        if (rows.length < 2)
            return res.status(404).json({ success: false, message: "Währung nicht gefunden." });

        const fromPrice = rows.find(r => r.symbol === from)?.price_usd;
        const toPrice = rows.find(r => r.symbol === to)?.price_usd;

        if (!fromPrice || !toPrice)
            return res.status(404).json({ success: false, message: "Preis fehlt." });

        const rate = (fromPrice / toPrice).toFixed(8);
        const result = (parseFloat(amount) * rate).toFixed(8);

        res.json({
            success: true,
            from,
            to,
            rate,
            amount: parseFloat(amount),
            result: parseFloat(result),
        });
    } catch (err) {
        console.error("❌ Fehler /api/crypto/convert:", err.message);
        res.status(500).json({ success: false, message: "Fehler bei der Umrechnung." });
    }
});

// ==========================================================
// 📊 1. Hole alle verfügbaren Währungen
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
        res.json({ success: true, currencies });
    } catch (err) {
        console.error("❌ Fehler in /api/exchange/currencies:", err);
        res.status(500).json({ success: false, message: "Fehler beim Laden der Währungen." });
    }
});

// ==========================================================
// 💱 2. Umrechnung
// ==========================================================
app.get("/api/exchange", async (req, res) => {
    try {
        const { from, to, amount } = req.query;
        if (!from || !to || !amount)
            return res.status(400).json({ success: false, message: "Parameter fehlen." });

        const [rows] = await db.query(
            "SELECT rate FROM exchange_rates WHERE base_currency=? AND target_currency=? LIMIT 1",
            [from, to]
        );

        if (rows.length === 0)
            return res.status(404).json({
                success: false,
                message: `Kein Kurs für ${from} → ${to} gefunden.`,
            });

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
// ➕ 3. Kurs hinzufügen / aktualisieren
// ==========================================================
app.post("/api/exchange/add", async (req, res) => {
    try {
        const { from, to, rate } = req.body;
        if (!from || !to || !rate)
            return res.status(400).json({ success: false, message: "Daten fehlen." });

        await db.query(
            `INSERT INTO exchange_rates (base_currency, target_currency, rate)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rate=VALUES(rate), updated_at=NOW()`,
            [from, to, rate]
        );

        res.json({ success: true, message: "Kurs gespeichert." });
    } catch (err) {
        console.error("❌ Fehler in /api/exchange/add:", err);
        res.status(500).json({ success: false, message: "Fehler beim Speichern." });
    }
});

// ==========================================================
// 📈 4. Timeseries (automatisch generieren)
// ==========================================================
app.get("/api/timeseries", async (req, res) => {
    try {
        const { base = "EUR", symbol = "USD" } = req.query;
        const [rows] = await db.query(
            "SELECT rate_date, rate_value FROM exchange_rates_graph WHERE base_currency=? AND target_currency=? ORDER BY rate_date ASC",
            [base, symbol]
        );

        res.json({ success: true, rates: rows });
    } catch (err) {
        console.error("❌ Fehler in /api/timeseries:", err.message);
        res.status(500).json({ success: false, message: "Fehler beim Laden der Timeseries." });
    }
});

// ==========================================================
// 👤 Auth: Register & Login
// ==========================================================
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body || {};
        if (!username || !email || !password)
            return res.status(400).json({ error: "Missing fields" });

        const [exists] = await db.query(
            "SELECT id FROM users WHERE username=? OR email=? LIMIT 1",
            [username, email]
        );
        if (exists.length > 0)
            return res.status(409).json({ error: "User already exists" });

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            "INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())",
            [username, email, hash, "user"]
        );

        const userId = result.insertId;
        const [rows] = await db.query(
            "SELECT id, username, role FROM users WHERE id = ? LIMIT 1",
            [userId]
        );
        const user = rows[0];

        const secret = process.env.JWT_SECRET || "devsecret";
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            secret,
            { expiresIn: "2h" }
        );
        res.json({ token });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { identifier, password } = req.body || {};
        if (!identifier || !password)
            return res.status(400).json({ error: "Missing fields" });

        const [rows] = await db.query(
            "SELECT id, username, email, password_hash, role FROM users WHERE username=? OR email=? LIMIT 1",
            [identifier, identifier]
        );
        if (rows.length === 0)
            return res.status(401).json({ error: "Invalid credentials" });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match)
            return res.status(401).json({ error: "Invalid credentials" });

        const secret = process.env.JWT_SECRET || "devsecret";
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            secret,
            { expiresIn: "2h" }
        );
        res.json({ token });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================================
// 💼 Portfolio-Route
// ==========================================================
app.get("/api/portfolio", async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ success: false, message: "Kein Token" });

        const token = auth.split(" ")[1];
        const secret = process.env.JWT_SECRET || "devsecret";
        const decoded = jwt.verify(token, secret);
        const userId = decoded.id;

        // 1️⃣ User-Balances (Fiat & Crypto Guthaben)
        const [balances] = await db.query(
            "SELECT currency, balance FROM user_balances WHERE user_id = ?",
            [userId]
        );

        // 2️⃣ User-Holdings (Assets mit Details)
        const [holdings] = await db.query(
            "SELECT symbol, amount, value_usd FROM user_holdings WHERE user_id = ?",
            [userId]
        );
        console.log(`📊 Holdings für User ${userId}:`, holdings);

        // 3️⃣ Transaktionen
        const [transactions] = await db.query(
            "SELECT id, ts, type, symbol, amount, price, total, currency FROM user_transactions WHERE user_id = ? ORDER BY ts DESC LIMIT 10",
            [userId]
        );

        // 4️⃣ Gesamtwert berechnen (Balances + Holdings)
        const balancesTotal = balances.reduce(
            (sum, b) => sum + parseFloat(b.balance || 0),
            0
        );
        const holdingsTotal = holdings.reduce(
            (sum, h) => sum + parseFloat(h.value_usd || 0),
            0
        );
        const totalValue = balancesTotal + holdingsTotal;

        // 5️⃣ Demo: 24h-Änderung (später durch echte Daten ersetzen)
        const change24hPct = (Math.random() * 4 - 2).toFixed(2);

        // 6️⃣ Timeline-Demo-Daten (später durch echte historische Daten ersetzen)
        const timeline = {
            "1D": Array.from({ length: 24 }, (_, i) => ({
                t: `${i}:00`,
                v: totalValue * (0.98 + Math.random() * 0.04)
            })),
            "1W": Array.from({ length: 7 }, (_, i) => ({
                t: `Tag ${i + 1}`,
                v: totalValue * (0.9 + Math.random() * 0.2)
            })),
            "1M": Array.from({ length: 30 }, (_, i) => ({
                t: `Tag ${i + 1}`,
                v: totalValue * (0.85 + Math.random() * 0.3)
            })),
            "1Y": Array.from({ length: 12 }, (_, i) => ({
                t: `Mon ${i + 1}`,
                v: totalValue * (0.7 + Math.random() * 0.6)
            })),
        };

        res.json({
            success: true,
            totalValue,
            change24hPct: parseFloat(change24hPct),
            timeline,
            holdings,
            transactions,
            balances,
        });
    } catch (err) {
        console.error("❌ Fehler in /api/portfolio:", err);
        res.status(500).json({ success: false, message: "Fehler beim Laden des Portfolios." });
    }
});

// ==========================================================
// � User-Suche (für Transfers)
// ==========================================================
app.get("/api/users/search", async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ success: false, message: "Kein Token" });

        const token = auth.split(" ")[1];
        const secret = process.env.JWT_SECRET || "devsecret";
        const decoded = jwt.verify(token, secret);
        const currentUserId = decoded.id;

        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ success: true, users: [] });
        }

        // Suche nach Username (case-insensitive), aber nicht der aktuelle User
        const [users] = await db.query(
            "SELECT id, username FROM users WHERE username LIKE ? AND id != ? LIMIT 10",
            [`%${q}%`, currentUserId]
        );

        res.json({ success: true, users });
    } catch (err) {
        console.error("❌ Fehler in /api/users/search:", err);
        res.status(500).json({ success: false, message: "Serverfehler" });
    }
});

// ==========================================================
// �💸 Transfer-Route
// ==========================================================
app.post("/api/transfer", async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ success: false, message: "Kein Token" });

        const token = auth.split(" ")[1];
        const secret = process.env.JWT_SECRET || "devsecret";
        const decoded = jwt.verify(token, secret);
        const fromUserId = decoded.id;

        let { toUserId, toUsername, currency, amount } = req.body;

        // Falls Username angegeben wurde, zu userId konvertieren
        if (toUsername && !toUserId) {
            const [users] = await db.query(
                "SELECT id FROM users WHERE username = ? LIMIT 1",
                [toUsername]
            );
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: "Empfänger nicht gefunden." });
            }
            toUserId = users[0].id;
        }

        if (!toUserId || !currency || !amount)
            return res.status(400).json({ success: false, message: "Fehlende Daten." });

        // Nicht an sich selbst senden
        if (toUserId === fromUserId) {
            return res.status(400).json({ success: false, message: "Du kannst nicht an dich selbst senden." });
        }

        const [fromBalance] = await db.query(
            "SELECT balance FROM user_balances WHERE user_id=? AND currency=? LIMIT 1",
            [fromUserId, currency]
        );

        if (fromBalance.length === 0 || fromBalance[0].balance < amount)
            return res.status(400).json({ success: false, message: "Nicht genügend Guthaben." });

        await db.query("UPDATE user_balances SET balance = balance - ? WHERE user_id=? AND currency=?", [amount, fromUserId, currency]);
        await db.query(
            "INSERT INTO user_balances (user_id, currency, balance) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?",
            [toUserId, currency, amount, amount]
        );

        // Transaktionen speichern (symbol = currency für Fiat-Transfers)
        await db.query(
            "INSERT INTO user_transactions (user_id, ts, type, symbol, amount, price, total, currency) VALUES (?, NOW(), 'WITHDRAW', ?, ?, ?, ?, ?)",
            [fromUserId, currency, amount, 1, amount, currency]
        );
        await db.query(
            "INSERT INTO user_transactions (user_id, ts, type, symbol, amount, price, total, currency) VALUES (?, NOW(), 'DEPOSIT', ?, ?, ?, ?, ?)",
            [toUserId, currency, amount, 1, amount, currency]
        );

        res.json({ success: true, message: "Transfer abgeschlossen" });
    } catch (err) {
        console.error("❌ Fehler in /api/transfer:", err);
        res.status(500).json({ success: false, message: "Serverfehler beim Transfer." });
    }
});

// ==========================================================
// ⭐ FAVORITEN
// ==========================================================

// 🔸 Favorit hinzufügen/entfernen (Toggle)
app.post("/api/favorites/toggle", async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ success: false, message: "Kein Token" });

        const token = auth.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
        const userId = user.id;

        const { currencypair } = req.body;
        if (!currencypair) return res.status(400).json({ success: false, message: "Kein Währungspaar angegeben" });

        // Prüfen, ob Favorit bereits existiert
        const [existing] = await db.query(
            "SELECT id FROM favorites WHERE user_id = ? AND currencypair = ? LIMIT 1",
            [userId, currencypair]
        );

        if (existing.length > 0) {
            // Favorit existiert → entfernen
            await db.query("DELETE FROM favorites WHERE user_id = ? AND currencypair = ?", [userId, currencypair]);
            res.json({ success: true, removed: true, message: "Favorit entfernt" });
        } else {
            // Favorit existiert nicht → hinzufügen
            await db.query(
                "INSERT INTO favorites (user_id, currencypair) VALUES (?, ?)",
                [userId, currencypair]
            );
            res.json({ success: true, added: true, message: "Favorit hinzugefügt" });
        }
    } catch (err) {
        console.error("❌ Fehler /api/favorites/toggle:", err);
        res.status(500).json({ success: false, message: "Serverfehler" });
    }
});

// 🔸 Favoriten eines Benutzers abrufen
app.get("/api/favorites", async (req, res) => {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ success: false, message: "Kein Token" });

        const token = auth.split(" ")[1];
        const user = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
        const userId = user.id;

        const [rows] = await db.query("SELECT currencypair FROM favorites WHERE user_id = ?", [userId]);
        res.json({ success: true, favorites: rows.map((r) => r.currencypair) });
    } catch (err) {
        console.error("❌ Fehler /api/favorites:", err);
        res.status(500).json({ success: false, message: "Serverfehler" });
    }
});

// ==========================================================
// 👑 ADMIN: Benutzerverwaltung (mit /api prefix)
// ==========================================================

function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Kein Token angegeben" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET || "devsecret", (err, user) => {
        if (err) return res.status(403).json({ error: "Ungültiger Token" });
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Nur für Admins erlaubt" });
    }
    next();
}

// 🔹 Alle Benutzer abrufen
app.get("/api/users", verifyToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, username, email, role FROM users ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        console.error("❌ Fehler beim Laden der Benutzer:", err);
        res.status(500).json({ error: "Serverfehler beim Laden der Benutzer" });
    }
});

// 🔹 Benutzer löschen
app.delete("/api/users/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ Fehler beim Löschen:", err);
        res.status(500).json({ error: "Serverfehler beim Löschen" });
    }
});

// 🔹 Benutzer bearbeiten
app.put("/api/users/:id", verifyToken, requireAdmin, async (req, res) => {
    const { username, email, role } = req.body;
    try {
        await db.query("UPDATE users SET username=?, email=?, role=? WHERE id=?", [
            username,
            email,
            role,
            req.params.id,
        ]);
        res.json({ success: true });
    } catch (err) {
        console.error("❌ Fehler beim Aktualisieren:", err);
        res.status(500).json({ error: "Serverfehler beim Aktualisieren" });
    }
});

// ==========================================================
// 🛡️ Middleware: authenticateToken (für normale User)
// ==========================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Kein Token angegeben" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET || "devsecret", (err, user) => {
        if (err) {
            console.error("❌ JWT verify error:", err.message);
            return res.status(403).json({ success: false, message: "Ungültiger Token" });
        }

        // Nutzerinfos aus dem Token an die Anfrage hängen
        req.user = user;
        next();
    });
}


app.get("/api/exchange/currencies", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT DISTINCT base_currency AS currency FROM exchange_rates
            UNION
            SELECT DISTINCT target_currency AS currency FROM exchange_rates
            ORDER BY currency ASC
        `);

        let currencies = rows.map((r) => r.currency);
        // 👉 Fallback
        if (currencies.length === 0) {
            currencies = ["USD", "EUR", "BTC", "ETH", "CHF"];
        }

        res.json({ success: true, currencies });
    } catch (err) {
        console.error("❌ Fehler in /api/exchange/currencies:", err);
        res.status(500).json({ success: false, message: "Fehler beim Laden der Währungen." });
    }
});



// BUY
app.post("/buy", authenticateToken, async (req, res) => {
    const { currency, amount } = req.body;
    const userId = req.user.id;
    if (!currency || !amount) return res.json({ success: false, message: "Fehlende Felder" });

    await db.query("INSERT INTO orders (user_id, type, currency, amount, status) VALUES (?, 'BUY', ?, ?, 'completed')", [userId, currency, amount]);
    await db.query("UPDATE balances SET balance = balance + ? WHERE user_id = ? AND currency = ?", [amount, userId, currency]);
    res.json({ success: true });
});

// SELL
app.post("/sell", authenticateToken, async (req, res) => {
    const { currency, amount } = req.body;
    const userId = req.user.id;
    const [rows] = await db.query("SELECT balance FROM balances WHERE user_id=? AND currency=?", [userId, currency]);
    if (!rows.length || rows[0].balance < amount)
        return res.json({ success: false, message: "Nicht genug Guthaben" });

    await db.query("INSERT INTO orders (user_id, type, currency, amount, status) VALUES (?, 'SELL', ?, ?, 'completed')", [userId, currency, amount]);
    await db.query("UPDATE balances SET balance = balance - ? WHERE user_id = ? AND currency = ?", [amount, userId, currency]);
    res.json({ success: true });
});

// ORDERS LIST
app.get("/orders", authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const [rows] = await db.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    res.json({ success: true, orders: rows });
});


// ==========================================================
// 🌐 Server starten
// ==========================================================
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// Wenn ein React build/ Verzeichnis existiert, statische Dateien ausliefern
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));

    // Alle Nicht-API GET-Anfragen an index.html weiterleiten (SPA routing)
    app.get('*', (req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/static')) return next();
        res.sendFile(path.join(buildPath, 'index.html'));
    });

    console.log('🔸 Serving React build from', buildPath);
}
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server läuft auf http://${HOST}:${PORT}`);
});
