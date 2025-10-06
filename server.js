// server.js
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// 🔗 MySQL-Verbindung
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("❌ DB-Verbindung fehlgeschlagen:", err);
        process.exit(1);
    } else {
        console.log("✅ Mit MySQL verbunden!");
    }
});

// ✉️ Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true", // true = 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --------------------
// 📌 Registrierung mit Ethereal-Mail
app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Bitte alle Felder ausfüllen." });
    }

    db.query(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        [username, email],
        async (err, results) => {
            if (results.length > 0) {
                return res.status(400).json({ error: "Benutzername oder E-Mail schon vergeben." });
            }

            try {
                const hashed = await bcrypt.hash(password, 10);
                db.query(
                    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                    [username, email, hashed],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: "Fehler beim Anlegen des Users." });
                        }

                        // Mail-Optionen
                        const mailOptions = {
                            from: process.env.EMAIL_FROM,
                            to: email,
                            subject: "Willkommen bei CoinFlip!",
                            text: `Hallo ${username}, danke für deine Registrierung bei CoinFlip!`,
                            html: `<h3>Hallo ${username}</h3><p>Danke für deine Registrierung bei <b>CoinFlip</b>.</p>`,
                        };

                        // Mail verschicken
                        transporter.sendMail(mailOptions, (mailErr, info) => {
                            if (mailErr) {
                                console.error("❌ Mail-Fehler:", mailErr);
                                return res.status(200).json({
                                    message: "User registriert ✅ (E-Mail konnte nicht gesendet werden).",
                                });
                            }

                            console.log("✅ Mail gesendet:", info.messageId);
                            console.log("🔗 Vorschau:", nodemailer.getTestMessageUrl(info));

                            return res.status(200).json({
                                message: "User registriert ✅ – Willkommens-Mail gesendet.",
                                previewUrl: nodemailer.getTestMessageUrl(info), // Vorschau-URL zurück ans Frontend
                            });
                        });
                    }
                );
            } catch (err) {
                return res.status(500).json({ error: "Serverfehler." });
            }
        }
    );
});


// --------------------
// 📌 Login (Username ODER Email)
app.post("/api/login", (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: "Bitte Username/E-Mail und Passwort angeben." });
    }

    db.query(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [identifier, identifier],
        async (err, results) => {
            if (err || results.length === 0) {
                return res.status(400).json({ error: "Ungültige Zugangsdaten" });
            }

            const user = results[0];
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) return res.status(400).json({ error: "Ungültige Zugangsdaten" });

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
            res.json({ token });
        }
    );
});

// --------------------
// 📌 Geschützter Endpoint
app.get("/api/profile", (req, res) => {
    const auth = req.headers["authorization"];
    if (!auth) return res.status(403).json({ error: "Kein Token vorhanden" });

    try {
        const token = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ message: `Willkommen ${decoded.username} (${decoded.email})!` });
    } catch {
        res.status(403).json({ error: "Ungültiges Token" });
    }
});

const crypto = require("crypto");

app.post("/api/request-reset", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-Mail erforderlich" });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 30; // 30 Min gültig

    db.query(
        "UPDATE users SET reset_token=?, reset_expires=? WHERE email=?",
        [token, expires, email],
        (err, result) => {
            if (err || result.affectedRows === 0) {
                return res.status(400).json({ error: "E-Mail nicht gefunden" });
            }

            const resetLink = `http://10.110.49.48:3000/reset?token=${token}`;

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: email,
                subject: "Passwort zurücksetzen",
                text: `Klicke hier um dein Passwort zurückzusetzen: ${resetLink}`,
                html: `<p>Klicke hier um dein Passwort zurückzusetzen:</p>
               <a href="${resetLink}">${resetLink}</a>`,
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error("❌ Mail-Fehler:", mailErr);
                    return res.status(500).json({ error: "E-Mail konnte nicht gesendet werden" });
                }
                console.log("✅ Reset-Mail gesendet:", nodemailer.getTestMessageUrl(info));
                res.json({ message: "Reset-Mail gesendet ✅", previewUrl: nodemailer.getTestMessageUrl(info) });
            });
        }
    );
});

app.post("/api/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ error: "Ungültige Anfrage" });
    }

    db.query(
        "SELECT * FROM users WHERE reset_token=? AND reset_expires > ?",
        [token, Date.now()],
        async (err, results) => {
            if (err || results.length === 0) {
                return res.status(400).json({ error: "Token ungültig oder abgelaufen" });
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            db.query(
                "UPDATE users SET password_hash=?, reset_token=NULL, reset_expires=NULL WHERE id=?",
                [hashed, results[0].id],
                (err2) => {
                    if (err2) return res.status(500).json({ error: "Fehler beim Speichern" });
                    res.json({ message: "Passwort erfolgreich geändert ✅" });
                }
            );
        }
    );
});



// --------------------
// 📌 Currency Exchange Proxy (um CORS-Probleme zu vermeiden)
app.get("/api/exchange/:from/:to/:amount", async (req, res) => {
    const { from, to, amount } = req.params;

    try {
        // Try multiple APIs
        const apis = [
            // API 1: ExchangeRate-API
            async () => {
                const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
                const data = await response.json();
                if (data.rates && data.rates[to]) {
                    const rate = data.rates[to];
                    const result = parseFloat(amount) * rate;
                    return {
                        success: true,
                        result: result,
                        rate: rate,
                        from: from,
                        to: to,
                        amount: parseFloat(amount)
                    };
                }
                return null;
            },
            // API 2: Open Exchange Rates
            async () => {
                const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
                const data = await response.json();
                if (data.rates && data.rates[to]) {
                    const rate = data.rates[to];
                    const result = parseFloat(amount) * rate;
                    return {
                        success: true,
                        result: result,
                        rate: rate,
                        from: from,
                        to: to,
                        amount: parseFloat(amount)
                    };
                }
                return null;
            },
            // API 3: Currency API via CDN
            async () => {
                const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${from.toLowerCase()}/${to.toLowerCase()}.json`);
                const data = await response.json();
                if (data && data[to.toLowerCase()]) {
                    const rate = data[to.toLowerCase()];
                    const result = parseFloat(amount) * rate;
                    return {
                        success: true,
                        result: result,
                        rate: rate,
                        from: from,
                        to: to,
                        amount: parseFloat(amount)
                    };
                }
                return null;
            }
        ];

        // Try each API
        for (let i = 0; i < apis.length; i++) {
            try {
                console.log(`Trying exchange API ${i + 1} for ${from} -> ${to}`);
                const result = await apis[i]();
                if (result) {
                    console.log(`Exchange API ${i + 1} successful`);
                    return res.json(result);
                }
            } catch (error) {
                console.warn(`Exchange API ${i + 1} failed:`, error.message);
                continue;
            }
        }

        // If all APIs fail
        res.status(500).json({
            success: false,
            error: "Alle Wechselkurs-APIs sind nicht verfügbar"
        });

    } catch (error) {
        console.error("Exchange error:", error);
        res.status(500).json({
            success: false,
            error: "Server-Fehler bei der Währungsumrechnung"
        });
    }
});

// 📌 Crypto Exchange Proxy
app.get("/api/crypto/:from/:to/:amount", async (req, res) => {
    const { from, to, amount } = req.params;

    try {
        const cryptoMapping = {
            'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binancecoin',
            'SOL': 'solana', 'USDC': 'usd-coin', 'XRP': 'ripple', 'STETH': 'staked-ether',
            'TON': 'the-open-network', 'DOGE': 'dogecoin', 'ADA': 'cardano', 'TRX': 'tron',
            'AVAX': 'avalanche-2', 'SHIB': 'shiba-inu', 'WBTC': 'wrapped-bitcoin',
            'LINK': 'chainlink', 'BCH': 'bitcoin-cash', 'DOT': 'polkadot', 'NEAR': 'near',
            'MATIC': 'matic-network', 'LTC': 'litecoin', 'UNI': 'uniswap', 'ICP': 'internet-computer',
            'LEO': 'leo-token', 'DAI': 'dai', 'ETC': 'ethereum-classic', 'APT': 'aptos',
            'CRO': 'crypto-com-chain', 'XLM': 'stellar', 'OKB': 'okb', 'ATOM': 'cosmos',
            'MNT': 'mantle', 'XMR': 'monero', 'HBAR': 'hedera-hashgraph', 'FIL': 'filecoin',
            'TAO': 'bittensor', 'IMX': 'immutable-x', 'VET': 'vechain', 'ARB': 'arbitrum',
            'OP': 'optimism'
        };

        // Get crypto ID for CoinGecko
        const fromId = cryptoMapping[from.toUpperCase()] || from.toLowerCase();
        const toId = cryptoMapping[to.toUpperCase()] || to.toLowerCase();

        if (fromId && toId) {
            // Crypto to crypto
            const [fromResponse, toResponse] = await Promise.all([
                fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=usd`),
                fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${toId}&vs_currencies=usd`)
            ]);

            const [fromData, toData] = await Promise.all([fromResponse.json(), toResponse.json()]);
            const fromPrice = fromData[fromId]?.usd;
            const toPrice = toData[toId]?.usd;

            if (fromPrice && toPrice) {
                const rate = fromPrice / toPrice;
                const result = parseFloat(amount) * rate;
                return res.json({
                    success: true,
                    result: result,
                    rate: rate,
                    from: from,
                    to: to,
                    amount: parseFloat(amount)
                });
            }
        } else {
            // Crypto to fiat or fiat to crypto
            const cryptoId = cryptoMapping[from.toUpperCase()] || cryptoMapping[to.toUpperCase()];
            const fiatCurrency = cryptoMapping[from.toUpperCase()] ? to.toLowerCase() : from.toLowerCase();

            if (cryptoId) {
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${fiatCurrency}`);
                const data = await response.json();
                const rate = data[cryptoId]?.[fiatCurrency];

                if (rate) {
                    const finalRate = cryptoMapping[from.toUpperCase()] ? rate : 1 / rate;
                    const result = parseFloat(amount) * finalRate;
                    return res.json({
                        success: true,
                        result: result,
                        rate: finalRate,
                        from: from,
                        to: to,
                        amount: parseFloat(amount)
                    });
                }
            }
        }

        res.status(500).json({
            success: false,
            error: "Crypto-Konvertierung fehlgeschlagen"
        });

    } catch (error) {
        console.error("Crypto exchange error:", error);
        res.status(500).json({
            success: false,
            error: "Server-Fehler bei der Crypto-Umrechnung"
        });
    }
});

app.listen(PORT, () => console.log(`🚀 Server läuft auf http://10.110.49.48:${PORT}`));
