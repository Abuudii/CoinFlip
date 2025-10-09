import React, { useEffect, useState } from "react";
import "../App.css";
import { getToken } from "../utils/auth";
import CurrencyGraph from "../components/CurrencyGraph";

export default function FiatExchange() {
    const [currencies, setCurrencies] = useState([]);
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("EUR");
    const [amount, setAmount] = useState(1);
    const [out, setOut] = useState("");
    const [rate, setRate] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const authed = !!getToken();

    useEffect(() => {
        setCurrencies([
            "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY",
            "SEK", "NZD", "MXN", "SGD", "HKD", "NOK", "TRY", "ZAR", "BRL", "INR", "KRW", "PLN"
        ]);
    }, []);

    useEffect(() => {
        if (amount > 0 && from && to) {
            convertCurrency();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amount, from, to]);

    const convertCurrency = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                `http://localhost:5000/api/exchange?from=${from}&to=${to}&amount=${amount}`
            );
            const data = await res.json();

            if (!data.success) throw new Error(data.message || "Fehler bei Anfrage.");

            setOut(`${data.result.toFixed(2)} ${to}`);
            setRate(`1 ${from} = ${data.rate.toFixed(4)} ${to}`);
        } catch (err) {
            setError(err.message);
            setOut("Error");
            setRate("");
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
    };

    return (
        <div className="exchange-full">
            <div className="conversion-panel">
                <h2 className="exchange-title">💱 Fiat Exchange</h2>
                {!authed && (
                    <p className="helper">🔒 Login nötig für volle Funktionalität</p>
                )}

                <div className="row-flex fancy-row">
                    <label className="label">From</label>
                    <select
                        className="input neon-input"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    >
                        {currencies.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
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
                            <option key={c} value={c}>
                                {c}
                            </option>
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
            </div>

            <div className="graph-panel">
                <h2 className="exchange-title">📊 Kursverlauf</h2>
                <div className="graph-wrapper">
                    <CurrencyGraph fromCurrency={from} toCurrency={to} />
                </div>
            </div>
        </div>
    );
}
