import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../App.css";
import { getToken } from "../utils/auth";
import CurrencyGraph from "../components/CurrencyGraph";
import CurrencySelect from "../components/CurrencySelect";
import { API_URL } from "../utils/config";



export default function FiatExchange() {
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

    // 🔹 Währungen aus DB laden
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await fetch(`${API_URL}/exchange/currencies`);
                const data = await res.json();
                if (data.success && data.currencies.length > 0) {
                    setCurrencies(data.currencies);

                    // URL-Parameter auslesen (für Favoriten)
                    const urlFrom = searchParams.get("from");
                    const urlTo = searchParams.get("to");

                    if (urlFrom && data.currencies.includes(urlFrom)) {
                        setFrom(urlFrom);
                    } else {
                        setFrom(data.currencies[0]);
                    }

                    if (urlTo && data.currencies.includes(urlTo)) {
                        setTo(urlTo);
                    } else {
                        setTo(data.currencies[1] || data.currencies[0]);
                    }
                } else {
                    setError("Keine Währungen in der Datenbank gefunden.");
                }
            } catch {
                setError("Fehler beim Laden der Währungen.");
            }
        };
        fetchCurrencies();
    }, [searchParams]);

    // 🔹 Umrechnung bei Änderungen
    useEffect(() => {
        if (from && to && amount && parseFloat(amount) > 0 && from !== to) {
            fetchExchange();
        } else if (parseFloat(amount) === 0) {
            setOut(`0.00 ${to}`);
        }
        // eslint-disable-next-line
    }, [from, to, amount]);

    // 🔹 Prüfe, ob aktuelles Paar ein Favorit ist
    useEffect(() => {
        const checkFavorite = async () => {
            try {
                const token = getToken();
                if (!token || !from || !to) return;

                const res = await fetch(`${API_URL}/favorites`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    const currencypair = `${from}/${to}`;
                    setIsFavorite(data.favorites.includes(currencypair));
                }
            } catch (err) {
                console.error("Fehler beim Prüfen der Favoriten:", err);
            }
        };
        checkFavorite();
    }, [from, to]);

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

    // ⭐ Favorit hinzufügen / entfernen
    const toggleFavorite = async () => {
        try {
            const token = getToken();
            if (!token) return alert("Bitte zuerst einloggen!");
            const currencypair = `${from}/${to}`;

            const response = await fetch(`${API_URL}/favorites/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currencypair }),
            });

            const data = await response.json();
            if (data.success) {
                if (data.added) setIsFavorite(true);
                else if (data.removed) setIsFavorite(false);

                // Event auslösen, damit Sidebar sich aktualisiert
                window.dispatchEvent(new Event("favorites:updated"));
            }
        } catch (err) {
            console.error("Fehler beim Favoriten:", err);
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className="exchange-title-business">Fiat Exchange</h2>
                    {authed && (
                        <button
                            onClick={toggleFavorite}
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: "1.5rem",
                                cursor: "pointer",
                                color: isFavorite ? "#3ee96f" : "#ccc",
                            }}
                        >
                            {isFavorite ? "★" : "☆"}
                        </button>
                    )}
                </div>


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
