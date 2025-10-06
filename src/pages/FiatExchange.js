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
    const API_KEY = "TGM2s8IYNKsAOxWphZd4yC5VUkd8zXzN";

    useEffect(() => {
        const commonCurrencies = [
            "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD",
            "MXN", "SGD", "HKD", "NOK", "TRY", "ZAR", "BRL", "INR", "KRW", "PLN"
        ];
        setCurrencies(commonCurrencies);
    }, []);

    useEffect(() => {
        if (amount > 0 && from && to && from !== to) {
            (async () => {
                try {
                    const response = await fetch(
                        `https://api.apilayer.com/exchangerates_data/convert?to=${to}&from=${from}&amount=${amount}`,
                        { headers: { "apikey": API_KEY } }
                    );
                    const data = await response.json();
                    if (data.success && data.result) {
                        setOut(`${data.result.toFixed(2)} ${to}`);
                        setRate(`1 ${from} = ${(data.result / amount).toFixed(4)} ${to}`);
                    } else {
                        setOut("Error");
                        setRate("");
                    }
                } catch {
                    setOut("Error");
                    setRate("");
                }
            })();
        } else if (from === to) {
            setOut(`${amount.toFixed(2)} ${to}`);
            setRate(`1 ${from} = 1 ${to}`);
        } else {
            setOut("");
            setRate("");
        }
    }, [amount, from, to, API_KEY]);

    const authed = !!getToken();

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
    };

    return (
        <div className="exchange-full">
            {/* Conversion */}
            <div className="conversion-panel">
                <h2 className="exchange-title">💱 Fiat Exchange</h2>
                {!authed && <p className="helper">🔒 Login nötig für volle Funktionalität</p>}

                <div className="row-flex fancy-row">
                    <label className="label">From</label>
                    <select className="input neon-input" value={from} onChange={e => setFrom(e.target.value)}>
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                        className="input neon-input"
                        type="number"
                        min="0"
                        value={amount}
                        onChange={e => setAmount(+e.target.value || 0)}
                    />
                </div>

                <div className="row-flex fancy-row">
                    <label className="label">To</label>
                    <select className="input neon-input" value={to} onChange={e => setTo(e.target.value)}>
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="input neon-input" disabled value={out} />
                </div>

                <div className="rate">{rate}</div>
                <button className="btn btn-gradient btn-toggle big-btn" onClick={handleSwap}>
                    Swap {from} ↔ {to}
                </button>
            </div>

            {/* Graph */}
            <div className="graph-panel">
                <h2 className="exchange-title">📊 Kursverlauf</h2>
                <div className="graph-wrapper">
                    <CurrencyGraph fromCurrency={from} toCurrency={to} />
                </div>
            </div>
        </div>
    );
}
