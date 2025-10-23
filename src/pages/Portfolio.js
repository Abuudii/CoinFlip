import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RTooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { getToken } from "../utils/auth";
import { API_URL } from "../utils/config";
import "../App.css";

const COLORS = ["#60a5fa", "#c084fc", "#34d399", "#fbbf24", "#f87171", "#f472b6", "#22d3ee"];

const currency = (n) =>
    parseFloat(n).toLocaleString(undefined, { style: "currency", currency: "USD" });

const percent = (n) =>
    `${parseFloat(n || 0).toFixed(2)}%`;

// ====================== COMPONENTS ======================

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
        name: b.currency,
        value: parseFloat(b.balance || 0),
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
            <div className="pf-card-head"><h3>💰 Fiat-Guthaben</h3></div>
            <div className="pf-table">
                <div className="pf-thead">
                    <div>Währung</div>
                    <div>Betrag</div>
                </div>
                {balances.length ? (
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
    return (
        <div className="pf-card">
            <div className="pf-card-head"><h3>📈 Holdings (Assets)</h3></div>
            <div className="pf-table">
                <div className="pf-thead">
                    <div>Symbol</div>
                    <div>Menge</div>
                    <div>Wert (USD)</div>
                </div>
                {holdings.length ? (
                    holdings.map((h, i) => (
                        <div key={i} className="pf-row pf-trow">
                            <div>{h.symbol}</div>
                            <div>{h.amount}</div>
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
            <div className="pf-card-head"><h3>📜 Letzte Transaktionen</h3></div>
            <div className="pf-table">
                <div className="pf-thead">
                    <div>Datum</div>
                    <div>Typ</div>
                    <div>Währung</div>
                    <div>Menge</div>
                    <div>Gesamt</div>
                </div>
                {txs.length ? (
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

// ====================== MAIN PAGE ======================

export default function Portfolio() {
    const [data, setData] = useState(null);
    const [tf, setTf] = useState("1W");
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/portfolio`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (json.success) setData(json);
                else console.warn("Fehler beim Laden:", json.message);
            } catch (e) {
                console.error("Fehler beim Laden:", e);
            }
        };
        load();
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
                        <div className="kpi-value">{currency(totalValue)}</div>
                    </div>
                    <div className={`kpi change ${positive ? "pos" : "neg"}`}>
                        <div className="kpi-label">24h</div>
                        <div className="kpi-value">
                            {positive ? "▲" : "▼"} {percent(data.change24hPct)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pf-actions">
                <button onClick={() => navigate("/buy")} className="btn btn-gradient">💵 Kaufen</button>
                <button onClick={() => navigate("/sell")} className="btn btn-outline">💸 Verkaufen</button>
                <button onClick={() => navigate("/transfer")} className="btn btn-secondary">💌 Senden</button>
                <button onClick={() => navigate("/orders")} className="btn btn-light">📑 Bestellungen</button>
            </div>

            {/* CHART + DONUT */}
            <div className="pf-grid">
                <div className="pf-card stack">
                    <div className="pf-card-head pf-row">
                        <h3>Überblick</h3>
                        <TimeframeTabs value={tf} onChange={setTf} />
                    </div>
                    <PortfolioValueChart data={data.timeline?.[tf] || []} />
                </div>

                <DonutDistribution items={data.balances || []} total={data.totalValue} />
            </div>

            {/* BALANCES + HOLDINGS */}
            <div className="pf-grid">
                <BalancesTable balances={data.balances || []} />
                <HoldingsTable holdings={data.holdings || []} />
            </div>

            {/* TRANSAKTIONEN */}
            <div className="pf-grid">
                <TransactionsTable txs={data.transactions || []} />
            </div>
        </motion.div>
    );
}
