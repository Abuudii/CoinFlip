import React, { useEffect, useState } from "react";
import "../App.css";
import { getToken } from "../utils/auth";
import CurrencyGraph from "../components/CurrencyGraph";

export default function Exchange() {
    const [rates, setRates] = useState({});
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("EUR");
    const [amount, setAmount] = useState(1);
    const [out, setOut] = useState("");
    const API_KEY = "8d1ef50b6a349477a48216738ea8eb57";

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(`http://api.exchangeratesapi.io/v1/latest?access_key=${API_KEY}&format=1`);
                const d = await r.json(); if (d.success) { setRates(d.rates); }
            } catch (e) { /* ignore */ }
        })();
    }, []);

    useEffect(() => {
        if (rates[from] && rates[to]) {
            const v = (amount / rates[from]) * rates[to];
            setOut(`${v.toFixed(2)} ${to}`);
        }
    }, [amount, from, to, rates]);

    const authed = !!getToken();

    // Add historical graph
    const showGraph = amount > 0 && from && to;

    return (
        <main className="container">
            <div className="exchange">
                <h2>Currency Exchange</h2>
                {!authed && <p className="helper">Du bist nicht eingeloggt – einige Funktionen sind deaktiviert.</p>}

                <div className="row-flex">
                    <label className="label" htmlFor="from">From</label>
                    <select id="from" className="input" value={from} onChange={e => setFrom(e.target.value)}>
                        {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="input" type="number" min="0" value={amount} onChange={e => setAmount(+e.target.value || 0)} />
                </div>

                <div className="row-flex">
                    <label className="label" htmlFor="to">To</label>
                    <select id="to" className="input" value={to} onChange={e => setTo(e.target.value)}>
                        {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="input" disabled value={out} />
                </div>

                <div className="rate">{out && `1 ${from} = ${(rates[to] / rates[from]).toFixed(4)} ${to}`}</div>

                {showGraph && (
                    <div className="graph-container">
                        <CurrencyGraph fromCurrency={from} toCurrency={to} />
                    </div>
                )}
            </div>
        </main>
    );
}
