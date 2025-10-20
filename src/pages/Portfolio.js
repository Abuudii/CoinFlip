import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Tooltip as RTooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getToken } from "../utils/auth";
import { API_URL } from "../utils/config";
import "../App.css";

// ----------------- Hilfsfunktionen -----------------
const COLORS = ["#60a5fa", "#c084fc", "#34d399", "#fbbf24", "#f87171", "#f472b6", "#22d3ee"];

const currency = (n) => {
    const num = parseFloat(n);
    return !isNaN(num)
        ? num.toLocaleString(undefined, { style: "currency", currency: "USD" })
        : "—";
};

const percent = (n) => {
    const num = parseFloat(n);
    if (isNaN(num)) return "0.00%";
    return `${num.toFixed(2)}%`;
};

// ----------------- Komponenten -----------------
function TimeframeTabs({ value, onChange }) {
    const tabs = ["1D", "1W", "1M", "1Y"];
    return (
        <div className="pf-timeframe">
            {tabs.map((t) => (
                <button
                    key={t}
                    className={`pf-tab ${value === t ? "active" : ""}`}
                    onClick={() => onChange(t)}
                >
                    {t}
                </button>
            ))}
        </div>
    );
}

function PortfolioValueChart({ data }) {
    return (
        <div className="pf-card">
            <div className="pf-card-head">
                <h3>Portfolio-Verlauf</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data}>
                    <XAxis dataKey="t" hide />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <RTooltip
                        formatter={(v) => currency(v)}
                        labelFormatter={(l) => `Zeit: ${l}`}
                        contentStyle={{
                            background: "#1b1b2b",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 8,
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function DonutDistribution({ items, total }) {
    const pieData = items.map((b) => ({
        name: b.currency || b.symbol,
        value: parseFloat(b.balance || b.value || 0),
    }));

    return (
        <div className="pf-card">
            <div className="pf-card-head">
                <h3>Gesamt-Verteilung</h3>
            </div>
            <div className="pf-donut">
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                        >
                            {pieData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <RTooltip
                            formatter={(v, n) => [currency(v), n]}
                            contentStyle={{
                                background: "#1b1b2b",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: 8,
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pf-donut-center">
                    <div className="pf-donut-total">{currency(total)}</div>
                    <div className="pf-donut-sub">Gesamt</div>
                </div>
            </div>
        </div>
    );
}

function BalancesTable({ balances }) {
    return (
        <div className="pf-card">
            <div className="pf-card-head">
                <h3>💰 Fiat-Guthaben</h3>
            </div>
            <div className="pf-table">
                <div className="pf-thead">
                    <div>Währung</div>
                    <div>Betrag</div>
                </div>
                {balances.length > 0 ? (
                    balances.map((b, i) => (
                        <div key={i} className="pf-row pf-trow">
                            <div>{b.currency}</div>
                            <div>{currency(b.balance)}</div>
                        </div>
                    ))
                ) : (
                    <div className="pf-empty">Keine Guthaben vorhanden.</div>
                )}
            </div>
        </div>
    );
}

function HoldingsTable({ holdings }) {
    console.log("📊 HoldingsTable received:", holdings);
    return (
        <div className="pf-card">
            <div className="pf-card-head">
                <h3>📈 Holdings (Assets)</h3>
            </div>
            <div className="pf-table">
                <div className="pf-thead">
                    <div>Symbol</div>
                    <div>Menge</div>
                    <div>Wert (USD)</div>
                </div>
                {holdings && holdings.length > 0 ? (
                    holdings.map((h, i) => (
                        <div key={i} className="pf-row pf-trow">
                            <div>{h.symbol || "—"}</div>
                            <div>{h.amount || "0"}</div>
                            <div>{currency(h.value_usd)}</div>
                        </div>
                    ))
                ) : (
                    <div className="pf-empty">Keine Holdings vorhanden.</div>
                )}
            </div>
        </div>
    );
}

function TransactionsTable({ txs }) {
    return (
        <div className="pf-card">
            <div className="pf-card-head">
                <h3>📜 Transaktionen</h3>
            </div>
            <div className="pf-table">
                <div className="pf-thead">
                    <div>Datum</div>
                    <div>Typ</div>
                    <div>Symbol</div>
                    <div>Menge</div>
                    <div>Gesamt</div>
                </div>
                {txs.length > 0 ? (
                    txs.map((t, i) => (
                        <div key={i} className="pf-row pf-trow">
                            <div>{new Date(t.ts).toLocaleString()}</div>
                            <div>{t.type}</div>
                            <div>{t.symbol}</div>
                            <div>{t.amount}</div>
                            <div>{currency(t.total)}</div>
                        </div>
                    ))
                ) : (
                    <div className="pf-empty">Keine Transaktionen vorhanden.</div>
                )}
            </div>
        </div>
    );
}

// ----------------- Hauptseite -----------------
// Transfer-Komponente mit Username-Suche
function TransferForm({ balances }) {
    const [username, setUsername] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currency, setCurrency] = useState("");
    const [amount, setAmount] = useState("");
    const [searching, setSearching] = useState(false);

    // Debounced search
    useEffect(() => {
        if (username.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(username)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (json.success) {
                    setSearchResults(json.users || []);
                }
            } catch (err) {
                console.error("Suche fehlgeschlagen:", err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setUsername(user.username);
        setSearchResults([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedUser || !currency || !amount) {
            alert("Bitte alle Felder ausfüllen.");
            return;
        }

        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/transfer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    toUsername: selectedUser.username,
                    currency,
                    amount: parseFloat(amount)
                }),
            });
            const json = await res.json();
            if (json.success) {
                alert(`✅ ${amount} ${currency} erfolgreich an ${selectedUser.username} gesendet!`);
                setUsername("");
                setSelectedUser(null);
                setCurrency("");
                setAmount("");
                window.location.reload();
            } else {
                alert("❌ " + (json.message || "Fehler beim Senden."));
            }
        } catch (err) {
            alert("❌ Serverfehler: " + err.message);
        }
    };

    return (
        <div className="pf-card">
            <div className="pf-card-head">
                <h3>💸 Geld senden</h3>
            </div>
            <form onSubmit={handleSubmit} className="transfer-form-business">
                <div className="transfer-row">
                    <div className="transfer-field" style={{ position: "relative" }}>
                        <label>Empfänger (Username)</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setSelectedUser(null);
                            }}
                            placeholder="Username eingeben..."
                            autoComplete="off"
                        />
                        {searching && <div className="search-loading">Suche...</div>}
                        {searchResults.length > 0 && (
                            <div className="user-dropdown">
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className="user-dropdown-item"
                                        onClick={() => handleSelectUser(user)}
                                    >
                                        👤 {user.username}
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedUser && (
                            <div className="selected-user">
                                ✓ Ausgewählt: <strong>{selectedUser.username}</strong>
                            </div>
                        )}
                    </div>
                    <div className="transfer-field">
                        <label>Währung</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            <option value="">Wählen...</option>
                            {(balances || []).map((b) => (
                                <option key={b.currency} value={b.currency}>
                                    {b.currency} (Verfügbar: {b.balance})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="transfer-field">
                        <label>Betrag</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <button type="submit" className="btn btn-gradient">
                        Senden
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function Portfolio() {
    const [data, setData] = useState(null);
    const [tf, setTf] = useState("1W");

    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/portfolio`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                console.log("📊 Portfolio API Response:", json);
                console.log("📊 Holdings:", json.holdings);
                console.log("📊 Balances:", json.balances);
                if (json && json.success) {
                    setData(json);
                } else {
                    console.warn("Fehler beim Laden:", json.message);
                }
            } catch (e) {
                console.error("Fehler:", e.message);
            }
        };
        loadPortfolio();
    }, []);

    if (!data) return <div className="loadingMessage">Portfolio wird geladen…</div>;

    const totalValue = parseFloat(data.totalValue || 0);
    const positive = totalValue >= 0;

    return (
        <motion.div
            className="portfolio-screen"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
        >
            {/* HEADER */}
            <div className="pf-header">
                <div>
                    <h2 className="pf-title">💼 Portfolio</h2>
                    <div className="pf-sub">Gesamtübersicht deines Accounts</div>
                </div>
                <div className="pf-kpis">
                    <div className="kpi">
                        <div className="kpi-label">Gesamtwert</div>
                        <div className="kpi-value">{currency(data.totalValue)}</div>
                    </div>
                    <div className={`kpi change ${positive ? "pos" : "neg"}`}>
                        <div className="kpi-label">24h</div>
                        <div className="kpi-value">
                            {positive ? "▲" : "▼"} {percent(data.change24hPct)}
                        </div>
                    </div>
                </div>
            </div>

            {/* CHART + DONUT */}
            <div className="pf-grid">
                <div className="pf-card stack">
                    <div className="pf-card-head pf-row">
                        <h3>Überblick</h3>
                        <TimeframeTabs value={tf} onChange={setTf} />
                    </div>
                    <PortfolioValueChart data={data.timeline[tf] || []} />
                </div>

                <DonutDistribution items={data.balances} total={data.totalValue} />
            </div>

            {/* BALANCES + HOLDINGS */}
            <div className="pf-grid">
                <BalancesTable balances={data.balances || []} />
                <HoldingsTable holdings={data.holdings || []} />
            </div>

            {/* TRANSAKTIONEN */}
            <div className="pf-grid">
                <TransactionsTable txs={data.transactions} />
            </div>

            {/* GELD SENDEN */}
            <div className="pf-grid">
                <TransferForm balances={data.balances} />
            </div>
        </motion.div>
    );
}
