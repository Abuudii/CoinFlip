import React, { useEffect, useState } from "react";
import "../App.css";
import { getToken } from "../utils/auth";
import CurrencyGraph from "../components/CurrencyGraph";
import { API_URL } from "../utils/config";

export default function FiatExchange() {
    const [currencies, setCurrencies] = useState([]);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [amount, setAmount] = useState(1);
    const [out, setOut] = useState("");
    const [rate, setRate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const authed = !!getToken();

    // 🔹 Währungen aus DB laden
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch(`${API_URL}/exchange/currencies`);
                const data = await res.json();

                if (data.success && data.currencies.length > 0) {
                    setCurrencies(data.currencies);
                    setFrom(data.currencies[0]);
                    setTo(data.currencies.length > 1 ? data.currencies[1] : data.currencies[0]);
                } else {
                    setError("Keine Währungen in der Datenbank gefunden.");
                    setCurrencies([]);
                }
            } catch (err) {
                setError("Fehler beim Laden der Währungen.");
                setCurrencies([]);
            }
        };

        fetchCurrencies();
    }, []);

    // 🔹 Umrechnen bei Änderungen
    useEffect(() => {
        if (currencies.length > 0 && from && to && amount > 0) {
            fetchExchange();
        }
        // eslint-disable-next-line
    }, [from, to, amount, currencies]);

    const fetchExchange = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await fetch(
                `${API_URL}/exchange?from=${from}&to=${to}&amount=${amount}`
            );
            const data = await res.json();

            if (!data.success) throw new Error(data.message || "Fehler bei Anfrage.");

            setOut(`${data.result.toFixed(2)} ${to}`);
            setRate(`1 ${from} = ${data.rate.toFixed(4)} ${to}`);
        } catch (err) {
            setOut("Error");
            setRate("");
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = () => {
        const prev = from;
        setFrom(to);
        setTo(prev);
    };

    return (
        <div className="exchange-full">
            <div className="conversion-panel">
                <h2 className="exchange-title">💱 Fiat Exchange</h2>
                {!authed && (
                    <p className="helper">🔒 Login nötig für volle Funktionalität</p>
                )}

                {currencies.length === 0 ? (
                    <p className="helper">⚠️ Keine Währungen in der Datenbank gefunden.</p>
                ) : (
                    <>
                        <div className="row-flex fancy-row">
                            <label className="label">From</label>
                            <select
                                className="input neon-input"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            >
                                {currencies.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <input
                                className="input neon-input"
                                type="number"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(+e.target.value || 0)}
                            />
                        </div>

                        <div className="row-flex fancy-row">
                            <label className="label">To</label>
                            <select
                                className="input neon-input"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            >
                                {currencies.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <input
                                className="input neon-input"
                                disabled
                                value={loading ? "Loading..." : out}
                            />
                        </div>

                        {rate && <div className="rate">{rate}</div>}
                        {error && <div className="error">{error}</div>}

                        <button
                            className="btn btn-gradient btn-toggle big-btn"
                            onClick={handleSwap}
                        >
                            Swap {from} ↔ {to}
                        </button>
                    </>
                )}
            </div>

            {currencies.length > 0 && (
                <div className="graph-panel">
                    <h2 className="exchange-title">📊 Kursverlauf</h2>
                    <div className="graph-wrapper">
                        <CurrencyGraph fromCurrency={from} toCurrency={to} />
                    </div>
                </div>
            )}
        </div>
    );
}
