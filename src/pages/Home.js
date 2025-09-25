import React from "react";
import "../App.css";

export default function Home() {
    return (
        <main className="main container">
            <section className="hero">
                <h1>Exchange made simple</h1>
                <img className="coin" alt="coin"
                    src="https://cdn-icons-png.flaticon.com/512/2769/2769230.png" />
                <p>Convert currencies instantly. Secure accounts, modern UI, fast results.</p>
                <div style={{ marginTop: 14 }}>
                    <a className="btn btn-primary" href="/exchange">START EXCHANGE</a>
                </div>
                <div className="cards">
                    <article className="card">
                        <h3>Understand Emissions</h3>
                        <p>Estimate your footprint with data-driven calculations.</p>
                    </article>
                    <article className="card">
                        <h3>Fund Initiatives</h3>
                        <p>Support high-impact projects with transparent reporting.</p>
                    </article>
                </div>
            </section>
        </main>
    );
}
