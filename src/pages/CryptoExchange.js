import React from "react";
import "../App.css";

export default function CryptoExchange() {
    return (
        <div className="exchange-box">
            <h2 className="exchange-title">₿ Crypto Exchange</h2>
            <p className="helper">🚧 Bald verfügbar: BTC ↔ ETH Umtausch</p>

            <div className="row-flex">
                <input className="input" placeholder="BTC" />
                <span style={{ fontWeight: "bold", fontSize: "18px" }}>↔</span>
                <input className="input" placeholder="ETH" />
            </div>

            <button className="btn btn-gradient" style={{ marginTop: "1rem" }}>
                Convert
            </button>
        </div>
    );
}
