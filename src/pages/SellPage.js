import React, { useState, useEffect } from "react";
import { getToken } from "../utils/auth";
import { API_URL } from "../utils/config";

export default function SellPage() {
    const [balances, setBalances] = useState([]);
    const [selected, setSelected] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        const loadBalances = async () => {
            const token = getToken();
            const res = await fetch(`${API_URL}/portfolio`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) setBalances(json.balances);
        };
        loadBalances();
    }, []);

    const handleSell = async (e) => {
        e.preventDefault();
        if (!selected || !amount) return alert("Bitte Felder ausfüllen.");

        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/sell`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currency: selected, amount: parseFloat(amount) }),
            });
            const json = await res.json();
            if (json.success) alert("✅ Verkauf erfolgreich!");
            else alert("❌ " + json.message);
        } catch (e) {
            alert("Fehler: " + e.message);
        }
    };

    return (
        <div className="page-container">
            <h2>💸 Währung verkaufen</h2>
            <form onSubmit={handleSell} className="sell-form">
                <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                    <option value="">Währung wählen</option>
                    {balances.map((b) => (
                        <option key={b.currency} value={b.currency}>
                            {b.currency} (Balance: {b.balance})
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    step="0.01"
                    placeholder="Betrag eingeben..."
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button type="submit">Verkaufen</button>
            </form>
        </div>
    );
}
