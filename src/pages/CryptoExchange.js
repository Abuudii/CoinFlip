import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../App.css";
import { getToken } from "../utils/auth";
import CurrencyGraph from "../components/CurrencyGraph";
import CurrencySelect from "../components/CurrencySelect";
import { API_URL } from "../utils/config";

export default function CryptoExchange() {
    const [searchParams] = useSearchParams();
    const [currencies, setCurrencies] = useState([]);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [amount, setAmount] = useState("");
    const [out, setOut] = useState("");
    const [rate, setRate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isFavorite, setIsFavorite] = useState(false);

    const authed = !!getToken();

    // Lade Crypto-Währungen vom Backend
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch(`${API_URL}/crypto/currencies`);
                const data = await res.json();
                if (data.success && data.currencies.length > 0) {
                    setCurrencies(data.currencies);
                    const urlFrom = searchParams.get("from");
                    const urlTo = searchParams.get("to");

                    setFrom(urlFrom && data.currencies.includes(urlFrom) ? urlFrom : data.currencies[0]);
                    setTo(urlTo && data.currencies.includes(urlTo) ? urlTo : data.currencies[1] || data.currencies[0]);
                } else {
                    const fallback = ["BTC", "ETH", "XRP", "DOGE", "SOL", "ADA"];
                    setCurrencies(fallback);
                    setFrom(fallback[0]);
                    setTo(fallback[1]);
                }
            } catch (err) {
                console.error("Fehler beim Laden der Crypto-Währungen:", err);
                const fallback = ["BTC", "ETH", "XRP", "DOGE", "SOL", "ADA"];
                setCurrencies(fallback);
                setFrom(fallback[0]);
                setTo(fallback[1]);
            }
        };
        fetchCurrencies();
    }, [searchParams]);

    // Umrechnung bei Änderungen
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

            const res = await fetch(`${API_URL}/crypto/convert?from=${from}&to=${to}&amount=${amount}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message || "Fehler bei Anfrage.");
            setOut(`${data.result.toFixed(8)} ${to}`);
            setRate(`1 ${from} = ${data.rate} ${to}`);
        } catch (err) {
            setError(err.message || String(err));
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
        if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
            setAmount(val.replace(",", "."));
        }
    };

    const filteredToCurrencies = currencies.filter((c) => c !== from);

    return (
        <div className="exchange-container">
            <div className="exchange-card business-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className="exchange-title-business">₿ Crypto Exchange</h2>
                </div>

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
                                    step="0.00000001"
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
