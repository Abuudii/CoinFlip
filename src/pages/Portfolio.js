import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Tooltip as RTooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import "../App.css";
import { API_URL } from "../utils/config";
import { getToken, decodeJwt } from "../utils/auth";

const COLORS = ["#60a5fa", "#c084fc", "#34d399", "#fbbf24", "#f87171", "#f472b6", "#22d3ee"];

// ---------- Helpers ----------
const currency = (n) => (typeof n === "number" ? n.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—");
const percent = (n) => (n ?? 0).toFixed(2) + "%";

// Placeholder structure for UI mapping
const emptyResponse = {
    totalValue: 0,
    change24hPct: 0,
    timeline: { '1D': [], '1W': [], '1M': [], '1Y': [] },
    holdings: [],
    transactions: [],
    balances: [],
};

// ---------- Komponenten ----------
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
            <div className="pf-chart">
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data}>
                        <XAxis dataKey="t" hide />
                        <YAxis hide domain={["dataMin", "dataMax"]} />
                        <RTooltip
                            formatter={(v) => currency(v)}
                            labelFormatter={(l) => `Zeit: ${l}`}
                            contentStyle={{ background: "#1b1b2b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
                        />
                        <Line type="monotone" dataKey="v" stroke="#60a5fa" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function DonutDistribution({ items, total }) {
    const pieData = items.map((h) => ({ name: h.symbol, value: h.value }));
    return (
        <div className="pf-card">
            <div className="pf-card-head">
                <h3>Asset-Verteilung</h3>
            </div>
            <div className="pf-donut">
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={2}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RTooltip
                            formatter={(v, n) => [currency(v), n]}
                            contentStyle={{ background: "#1b1b2b", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
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

function Sparkline({ data }) {
    const mapped = data.map((v, i) => ({ t: i, v }));
    return (
        <div className="spark">
            <ResponsiveContainer width="100%" height={40}>
                <LineChart data={mapped}>
                    <Line type="monotone" dataKey="v" stroke="#c084fc" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function HoldingsTable({ items }) {
    const [q, setQ] = useState("");
    const [sort, setSort] = useState({ key: "value", dir: "desc" });

    const filtered = useMemo(() => {
        const f = items.filter((h) =>
            (h.symbol + " " + h.name).toLowerCase().includes(q.toLowerCase())
        );
        const s = [...f].sort((a, b) => {
            const k = sort.key;
            const av = a[k];
            const bv = b[k];
            if (av === bv) return 0;
            return sort.dir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
        return s;
    }, [items, q, sort]);

    const togg = (key) => {
        setSort((prev) => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
    };

    return (
        <div className="pf-card">
            <div className="pf-card-head pf-row">
                <h3>Holdings</h3>
                <input
                    className="pf-input"
                    placeholder="Suchen (BTC, Ether, …)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            <div className="pf-table">
                <div className="pf-thead">
                    <div onClick={() => togg("symbol")}>Asset</div>
                    <div onClick={() => togg("amount")}>Menge</div>
                    <div onClick={() => togg("value")}>Wert</div>
                    <div onClick={() => togg("changePct24h")}>24h</div>
                    <div>Trend</div>
                </div>

                {filtered.map((h) => (
                    <motion.div
                        key={h.symbol}
                        className="pf-row pf-trow"
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    >
                        <div className="pf-asset">
                            <div className="pf-asset-symbol">{h.symbol}</div>
                            <div className="pf-asset-name">{h.name}</div>
                        </div>
                        <div>{h.amount} {h.symbol}</div>
                        <div>{currency(h.value)}</div>
                        <div className={h.changePct24h >= 0 ? "pos" : "neg"}>
                            {h.changePct24h >= 0 ? "+" : ""}{percent(h.changePct24h)}
                        </div>
                        <Sparkline data={h.spark} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function Transactions({ items }) {
    const [q, setQ] = useState("");
    const [type, setType] = useState("ALL");
    const filtered = items.filter((tx) => {
        const okType = type === "ALL" ? true : tx.type === type;
        const okQ = (tx.symbol + tx.type + tx.ts).toLowerCase().includes(q.toLowerCase());
        return okType && okQ;
    });

    return (
        <div className="pf-card">
            <div className="pf-card-head pf-row">
                <h3>Transaktionen</h3>
                <div className="pf-row gap">
                    <select className="pf-input" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="ALL">Alle</option>
                        <option value="BUY">Kauf</option>
                        <option value="SELL">Verkauf</option>
                        <option value="DEPOSIT">Einzahlung</option>
                        <option value="WITHDRAW">Auszahlung</option>
                    </select>
                    <input
                        className="pf-input"
                        placeholder="Suche (Symbol/Datum/Typ)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>
            </div>

            <div className="pf-table">
                <div className="pf-thead">
                    <div>Datum</div>
                    <div>Typ</div>
                    <div>Symbol</div>
                    <div>Menge</div>
                    <div>Preis</div>
                    <div>Gesamt</div>
                </div>

                {filtered.map((tx) => (
                    <div key={tx.id} className="pf-row pf-trow">
                        <div>{tx.ts}</div>
                        <div>{tx.type}</div>
                        <div>{tx.symbol}</div>
                        <div>{tx.amount}</div>
                        <div>{currency(tx.price)}</div>
                        <div>{tx.currency === "USD" ? currency(tx.total) : `${tx.total} ${tx.currency}`}</div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="pf-empty">Keine Transaktionen gefunden.</div>
                )}
            </div>
        </div>
    );
}

// ---------- Hauptseite ----------
export default function Portfolio() {
    const [data, setData] = useState(null);
    const [tf, setTf] = useState("1W");
    const user = decodeJwt(getToken());

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/portfolio`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (isMounted && json && json.success) {
                    // Map backend response to expected UI structure
                    const ui = {
                        totalValue: json.totalValue || 0,
                        change24hPct: json.change24hPct || 0,
                        timeline: json.timeline || emptyResponse.timeline,
                        holdings: (json.holdings || []).map(h => ({ symbol: h.symbol, name: h.symbol, amount: parseFloat(h.amount), value: parseFloat(h.value_usd || 0), changePct24h: 0, spark: [] })),
                        transactions: (json.transactions || []).map(t => ({ id: t.id, ts: t.ts, type: t.type, symbol: t.symbol, amount: parseFloat(t.amount || 0), price: parseFloat(t.price || 0), total: parseFloat(t.total || 0), currency: t.currency })),
                        balances: json.balances || [],
                    };
                    setData(ui);
                } else {
                    setData(emptyResponse);
                }
            } catch (e) {
                console.warn('Failed to load portfolio', e.message);
                setData(emptyResponse);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    if (!data) return <div className="loadingMessage">Portfolio wird geladen…</div>;

    const currentSeries = data.timeline[tf] || [];
    const positive = data.change24hPct >= 0;

    return (
        <motion.div
            className="portfolio-screen"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
        >
            <div className="pf-header">
                <div>
                    <h2 className="pf-title">💼 Portfolio</h2>
                    <div className="pf-sub">Gesamtwert & Performance</div>
                </div>
                <div className="pf-kpis">
                    <div className="kpi">
                        <div className="kpi-label">Gesamtwert</div>
                        <div className="kpi-value">{currency(data.totalValue)}</div>
                    </div>
                    <div className={`kpi change ${positive ? "pos" : "neg"}`}>
                        <div className="kpi-label">24h</div>
                        <div className="kpi-value">{positive ? "▲" : "▼"} {percent(data.change24hPct)}</div>
                    </div>
                </div>
            </div>

            <div className="pf-grid">
                <div className="pf-card stack">
                    <div className="pf-card-head pf-row">
                        <h3>Überblick</h3>
                        <TimeframeTabs value={tf} onChange={setTf} />
                    </div>
                    <PortfolioValueChart data={currentSeries} />
                </div>

                <DonutDistribution items={data.holdings} total={data.totalValue} />
            </div>

            <div className="pf-grid">
                <HoldingsTable items={data.holdings} />
            </div>

            <div className="pf-grid">
                <Transactions items={data.transactions} />
            </div>

            {/* Geld senden Bereich */}
            <div className="pf-grid">
                <div className="pf-card">
                    <div className="pf-card-head">
                        <h3>💸 Geld senden</h3>
                    </div>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target;
                            const toUserId = form.toUserId.value;
                            const currency = form.currency.value;
                            const amount = parseFloat(form.amount.value);

                            if (!toUserId || !currency || !amount) {
                                alert("Bitte alle Felder ausfüllen.");
                                return;
                            }

                            try {
                                const token = getToken();
                                const res = await fetch(`${API_URL}/transfer`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ toUserId: Number(toUserId), currency, amount }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                    alert("✅ Transfer erfolgreich!");
                                    form.reset();
                                    // refresh
                                    const evt = new Event('portfolio:refresh');
                                    window.dispatchEvent(evt);
                                } else {
                                    alert("❌ " + (data.message || "Fehler beim Senden."));
                                }
                            } catch (err) {
                                console.warn(err);
                                alert("❌ Serverfehler beim Senden.");
                            }
                        }}
                        className="transfer-form-business"
                    >
                        <div className="transfer-row">
                            <div className="transfer-field">
                                <label>Empfänger-ID</label>
                                <input name="toUserId" type="number" placeholder="z. B. 2" />
                            </div>
                            <div className="transfer-field">
                                <label>Währung</label>
                                <select name="currency">
                                    {(data.balances || []).map((h) => (
                                        <option key={h.currency} value={h.currency}>{h.currency}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="transfer-field">
                                <label>Betrag</label>
                                <input name="amount" type="number" step="0.01" min="0" placeholder="0.00" />
                            </div>
                            <button type="submit" className="btn btn-gradient">Senden</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="portfolio-footer">Letzte Aktualisierung: {new Date().toLocaleTimeString()}</div>
        </motion.div>
    );
}

// Add event listener to refresh portfolio from other actions
window.addEventListener('portfolio:refresh', () => {
    // simple approach: reload the page data by triggering a custom event consumers can hook
    // in this file we used useEffect without listener; to keep it simple, ask user to refresh page
    console.log('portfolio:refresh received - please refresh the page to see updates');
});
