import React from "react";
import CurrencyGraph from "../components/CurrencyGraph";
import "../App.css";

export default function GraphPage() {
    return (
        <div className="graph-box">
            <h2 className="exchange-title">📊 Currency Graph</h2>
            <CurrencyGraph fromCurrency="USD" toCurrency="EUR" />
        </div>
    );
}
