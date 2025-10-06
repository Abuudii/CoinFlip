import React from "react";
import { Outlet } from "react-router-dom";
import "../App.css";

export default function ExchangeLayout() {
    return (
        <main className="container">
            <Outlet /> {/* zeigt die Unterseiten: Fiat, Crypto, Graph */}
        </main>
    );
}
