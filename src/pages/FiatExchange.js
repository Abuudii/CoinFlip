import React, { useEffect, useState } from "react";
import "../App.css";
import { getToken } from "../utils/auth";
import CurrencyGraph from "../components/CurrencyGraph";
import CurrencySelect from "../components/CurrencySelect";
import { API_URL } from "../utils/config";

export default function FiatExchange() {
    const [currencies, setCurrencies] = useState([]);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [amount, setAmount] = useState("");
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
                    setTo(data.currencies[1] || data.currencies[0]);
                } else {
                    setError("Keine Währungen in der Datenbank gefunden.");
                }
            } catch {
                setError("Fehler beim Laden der Währungen.");
            }
        };
        fetchCurrencies();
    }, []);

    // 🔹 Umrechnung bei Änderungen
    useEffect(() => {
        if (from && to && amount && parseFloat(amount) > 0 && from !== to) {
            fetchExchange();
        } else if (parseFloat(amount) === 0) {
            setOut(`0.00 ${to}`);
        }
        // eslint-disable-next-line
    }, [from, to, amount]);

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

    const handleAmountChange = (e) => {
        const val = e.target.value;
        // Nur Zahlen und Dezimalzeichen erlauben
        if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
            setAmount(val.replace(",", ".")); // Komma → Punkt
        }
    };

    const filteredToCurrencies = currencies.filter((c) => c !== from);

    return (
        <div className="exchange-container">
            <div className="exchange-card business-card">
                <h2 className="exchange-title-business">Fiat Exchange</h2>

                {!authed && (
                    <p className="auth-warning">🔒 Login nötig für volle Funktionalität</p>
                )}

                {error && <div className="error-banner-business">{error}</div>}

                {currencies.length > 0 && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            fetchExchange();
                        }}
                        className="exchange-form"
                    >
                        <div className="form-row">
                            <div className="input-group-business">
                                <CurrencySelect
                                    label="Von"
                                    value={from}
                                    options={currencies}
                                    onChange={(val) => {
                                        if (val === to) setTo(currencies.find((c) => c !== val));
                                        setFrom(val);
                                    }}
                                />
                            </div>

                            <div className="input-group-business">
                                <label>Betrag</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    placeholder="0.00"
                                    onChange={handleAmountChange}
                                    className="clean-input no-spinner"
                                />
                            </div>
                        </div>

                        <div className="swap-wrapper">
                            <button
                                type="button"
                                onClick={handleSwap}
                                className="swap-btn-business"
                                title="Tauschen"
                            >
                                ⇅
                            </button>
                        </div>

                        <div className="form-row">
                            <div className="input-group-business">
                                <CurrencySelect
                                    label="Nach"
                                    value={to}
                                    options={filteredToCurrencies}
                                    onChange={(val) => setTo(val)}
                                />
                            </div>

                            <div className="input-group-business">
                                <label>Ergebnis</label>
                                <input
                                    disabled
                                    value={loading ? "Berechne..." : out}
                                    placeholder="—"
                                    className="clean-input"
                                />
                            </div>
                        </div>

                        {rate && <div className="rate-display-business">{rate}</div>}
                    </form>
                )}
            </div>

            {currencies.length > 0 && (
                <div className="graph-card business-card">
                    <h2 className="exchange-title-business">Kursverlauf</h2>
                    <CurrencyGraph fromCurrency={from} toCurrency={to} />
                </div>
            )}
        </div>
    );
}
