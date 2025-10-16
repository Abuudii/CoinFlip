import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "../App.css";
import { API_URL } from "../utils/config";
import { getToken, decodeJwt } from "../utils/auth";

export default function TransferFlow() {
    const user = decodeJwt(getToken());
    const navigate = useNavigate();
    const location = useLocation();
    const initial = location.state || { toUserId: "", currency: "", amount: "" };

    const [step, setStep] = useState(1);
    const [transfer, setTransfer] = useState(initial);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/transfer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fromUserId: user?.id || 1,
                    toUserId: Number(transfer.toUserId),
                    currency: transfer.currency,
                    amount: Number(transfer.amount),
                }),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) setStep(3);
        } catch (err) {
            setResult({ success: false, message: "Serverfehler." });
        } finally {
            setLoading(false);
        }
    };

    const restart = () => {
        setStep(1);
        setTransfer(initial);
        setResult(null);
    };

    return (
        <motion.div
            className="transfer-flow-screen"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="transfer-flow-card">
                {step === 1 && (
                    <>
                        <h2 className="transfer-flow-title">💸 Geld senden</h2>
                        <p className="transfer-flow-sub">Fülle die Angaben unten aus:</p>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                setStep(2);
                            }}
                            className="transfer-flow-form"
                        >
                            <div className="transfer-field">
                                <label>Empfänger-ID</label>
                                <input
                                    type="number"
                                    placeholder="z. B. 2"
                                    value={transfer.toUserId}
                                    onChange={(e) => setTransfer({ ...transfer, toUserId: e.target.value })}
                                />
                            </div>

                            <div className="transfer-field">
                                <label>Währung</label>
                                <select
                                    value={transfer.currency}
                                    onChange={(e) => setTransfer({ ...transfer, currency: e.target.value })}
                                >
                                    <option value="">– auswählen –</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="BTC">BTC</option>
                                    <option value="ETH">ETH</option>
                                </select>
                            </div>

                            <div className="transfer-field">
                                <label>Betrag</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={transfer.amount}
                                    onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-gradient wide"
                                disabled={!transfer.amount || !transfer.toUserId || !transfer.currency}
                            >
                                Weiter →
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 className="transfer-flow-title">📄 Überprüfung</h2>
                        <p className="transfer-flow-sub">Bitte überprüfe deine Angaben.</p>

                        <div className="transfer-summary">
                            <div><strong>Von:</strong> {user?.username || "Du"}</div>
                            <div><strong>An:</strong> Benutzer #{transfer.toUserId}</div>
                            <div><strong>Betrag:</strong> {transfer.amount} {transfer.currency}</div>
                        </div>

                        <div className="transfer-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Zurück</button>
                            <button
                                className="btn btn-gradient"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? "Wird gesendet..." : "Bestätigen & Senden"}
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <>
                        {result?.success ? (
                            <>
                                <h2 className="transfer-flow-title success">✅ Erfolgreich gesendet!</h2>
                                <div className="transfer-result">
                                    <div><strong>Empfänger:</strong> Benutzer #{transfer.toUserId}</div>
                                    <div><strong>Betrag:</strong> {transfer.amount} {transfer.currency}</div>
                                    <div><strong>Zeit:</strong> {new Date().toLocaleString()}</div>
                                </div>
                                <button className="btn btn-gradient wide" onClick={() => navigate("/portfolio")}>
                                    Zurück zum Portfolio
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="transfer-flow-title error">❌ Fehler</h2>
                                <p>{result?.message || "Der Transfer ist fehlgeschlagen."}</p>
                                <button className="btn btn-secondary" onClick={restart}>Erneut versuchen</button>
                            </>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}
