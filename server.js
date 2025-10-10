require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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

// -----------------------------
// Auth: register & login
// -----------------------------
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body || {};
        if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });

        // check existing
        const [exists] = await db.query("SELECT id FROM users WHERE username=? OR email=? LIMIT 1", [username, email]);
        if (exists.length > 0) return res.status(409).json({ error: "User already exists" });

        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            "INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())",
            [username, email, hash, 'user']
        );

        const userId = result.insertId;
        const [rows] = await db.query("SELECT id, username, role FROM users WHERE id = ? LIMIT 1", [userId]);
        const user = rows[0];

        const secret = process.env.JWT_SECRET || "devsecret";
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '2h' });
        res.json({ token });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { identifier, password } = req.body || {};
        if (!identifier || !password) return res.status(400).json({ error: "Missing fields" });

        const [rows] = await db.query("SELECT id, username, email, password, role FROM users WHERE username=? OR email=? LIMIT 1", [identifier, identifier]);
        if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Invalid credentials" });

        const secret = process.env.JWT_SECRET || "devsecret";
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '2h' });
        res.json({ token });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Protected user management routes will be defined below using the promise pool

// JWT middleware - verifies token and attaches payload to req.user
function authenticateJWT(req, res, next) {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
    const token = auth.split(" ")[1];
    try {
        const secret = process.env.JWT_SECRET || "devsecret";
        const payload = jwt.verify(token, secret);
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

// admin-only middleware
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    next();
}

// Protected user management routes
app.get("/api/users", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, username, email, role FROM users");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/users/:id", authenticateJWT, requireAdmin, async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/users/:id", authenticateJWT, requireAdmin, async (req, res) => {
    const { username, email, role } = req.body;
    try {
        await db.query(
            "UPDATE users SET username=?, email=?, role=? WHERE id=?",
            [username, email, role, req.params.id]
        );
        res.json({ message: "User updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
