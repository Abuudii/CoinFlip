import React, { useState, useEffect } from "react";
import { getToken } from "../utils/auth";
import { API_URL } from "../utils/config";

export default function BuyPage() {
    const [currencies, setCurrencies] = useState([]);
    const [selected, setSelected] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Verfügbare Währungen laden
        fetch(`${API_URL}/currencies`)
            .then((res) => res.json())
            .then((json) => setCurrencies(json.currencies || []));
    }, []);

    const handleBuy = async (e) => {
        e.preventDefault();
        if (!selected || !amount) return alert("Bitte Währung und Betrag wählen.");

        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`${API_URL}/buy`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currency: selected, amount: parseFloat(amount) }),
            });
            const json = await res.json();
            if (json.success) alert("✅ Kauf erfolgreich!");
            else alert("❌ " + json.message);
        } catch (e) {
            alert("Fehler: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h2>💵 Währung kaufen</h2>
            <form onSubmit={handleBuy} className="buy-form">
                <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                    <option value="">Währung wählen</option>
                    {currencies.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                </select>
                <input
                    type="number"
                    step="0.01"
                    placeholder="Betrag eingeben..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Wird gekauft..." : "Kaufen"}
                </button>
            </form>
        </div>
    );
}
