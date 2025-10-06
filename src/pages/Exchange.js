import React, { useEffect, useState } from "react";
import "../App.css";
import { getToken } from "../utils/auth";
import CurrencyGraph from "../components/CurrencyGraph";

export default function Exchange() {
    const [currencies, setCurrencies] = useState({ fiat: [], crypto: [] });
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("EUR");
    const [amount, setAmount] = useState(1);
    const [out, setOut] = useState("");
    const [rate, setRate] = useState("");
    const [loading, setLoading] = useState(false);

    // Load available currencies on component mount
    useEffect(() => {
        const fiatCurrencies = [
            "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
            "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD",
            "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CUC", "CUP", "CVE", "CZK",
            "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP",
            "GBP", "GEL", "GGP", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF",
            "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP", "JMD", "JOD", "JPY",
            "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT",
            "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN",
            "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG",
            "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS", "SRD", "STD", "SVC", "SYP", "SZL",
            "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TTV", "TVD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UYW", "UZS",
            "VED", "VES", "VND", "VUV", "WST", "XAF", "XAG", "XAU", "XCD", "XDR", "XOF", "XPD", "XPF", "XPT", "YER", "ZAR", "ZMW", "ZWL"
        ].sort();

        const cryptoCurrencies = [
            "BTC", "ETH", "USDT", "BNB", "SOL", "USDC", "XRP", "STETH", "TON", "DOGE",
            "ADA", "TRX", "AVAX", "SHIB", "WBTC", "LINK", "BCH", "DOT", "NEAR", "MATIC",
            "LTC", "UNI", "ICP", "LEO", "DAI", "ETC", "APT", "CRO", "XLM", "OKB",
            "ATOM", "MNT", "XMR", "HBAR", "FIL", "TAO", "IMX", "VET", "ARB", "OP"
        ].sort();

        setCurrencies({ fiat: fiatCurrencies, crypto: cryptoCurrencies });
    }, []);

    // Convert currency when parameters change
    useEffect(() => {
        if (amount > 0 && from && to && from !== to) {
            convertCurrency();
        } else if (from === to) {
            setOut(`${amount.toFixed(2)} ${to}`);
            setRate(`1 ${from} = 1 ${to}`);
        } else {
            setOut("");
            setRate("");
        }
    }, [amount, from, to, currencies]);

    const convertCurrency = async () => {
        // Wait for currencies to be loaded
        if (!currencies.fiat.length && !currencies.crypto.length) {
            return;
        }

        setLoading(true);
        try {
            // Check if we're dealing with crypto currencies
            const cryptoList = currencies.crypto || [];
            const isCrypto = cryptoList.includes(from) || cryptoList.includes(to);

            console.log('Conversion attempt:', { from, to, amount, isCrypto });

            if (isCrypto) {
                await handleCryptoConversion();
            } else {
                await handleFiatConversion();
            }
        } catch (e) {
            console.error('Conversion error:', e);
            setOut(`Fehler: ${e.message}`);
            setRate("");
        } finally {
            setLoading(false);
        }
    };

    const handleCryptoConversion = async () => {
        try {
            // Use our backend proxy for crypto conversions too
            const response = await fetch(`http://10.110.49.48:5000/api/crypto/${from}/${to}/${amount}`);
            const data = await response.json();

            if (data.success && data.result) {
                const cryptoList = currencies.crypto || [];
                const isCryptoResult = cryptoList.includes(to);
                const decimals = isCryptoResult ? 8 : 2;

                setOut(`${data.result.toFixed(decimals)} ${to}`);
                setRate(`1 ${from} = ${data.rate.toFixed(decimals)} ${to}`);
                return;
            } else {
                throw new Error(data.error || 'Crypto conversion failed');
            }
        } catch (error) {
            console.error('Crypto conversion error:', error);
            throw new Error('Crypto-Backend-API nicht verfügbar');
        }
    };

    const handleFiatConversion = async () => {
        try {
            // Use our backend proxy to avoid CORS issues
            const response = await fetch(`http://10.110.49.48:5000/api/exchange/${from}/${to}/${amount}`);
            const data = await response.json();

            if (data.success && data.result) {
                setOut(`${data.result.toFixed(2)} ${to}`);
                setRate(`1 ${from} = ${data.rate.toFixed(4)} ${to}`);
                return;
            } else {
                throw new Error(data.error || 'Fiat conversion failed');
            }
        } catch (error) {
            console.error('Fiat conversion error:', error);
            throw new Error('Backend-API nicht verfügbar');
        }
    };

    const authed = !!getToken();
    const showGraph = amount > 0 && from && to;

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
    }; return (
        <main className="container">
            <div className="exchange-graph-layout">
                <div className="exchange-box">
                    <h2>Currency Exchange</h2>
                    {!authed && <p className="helper">Du bist nicht eingeloggt – einige Funktionen sind deaktiviert.</p>}

                    <div className="row-flex">
                        <label className="label" htmlFor="from">From</label>
                        <select id="from" className="input" value={from} onChange={e => setFrom(e.target.value)}>
                            <optgroup label="💰 Fiat Currencies">
                                {currencies.fiat && currencies.fiat.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="₿ Crypto Currencies">
                                {currencies.crypto && currencies.crypto.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                        </select>
                        <input className="input" type="number" min="0" value={amount} onChange={e => setAmount(+e.target.value || 0)} />
                    </div>

                    <div className="row-flex">
                        <label className="label" htmlFor="to">To</label>
                        <select id="to" className="input" value={to} onChange={e => setTo(e.target.value)}>
                            <optgroup label="💰 Fiat Currencies">
                                {currencies.fiat && currencies.fiat.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="₿ Crypto Currencies">
                                {currencies.crypto && currencies.crypto.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                        </select>
                        <input className="input" disabled value={loading ? "Loading..." : out} />
                    </div>

                    <div className="rate">{loading ? "Berechnung..." : rate}</div>
                    <button className="btn btn-gradient btn-toggle" style={{ marginTop: '1rem' }} onClick={handleSwap}>
                        Swap {from} ↔ {to}
                    </button>
                </div>
                {showGraph && (
                    <div className="graph-box">
                        <CurrencyGraph fromCurrency={from} toCurrency={to} />
                    </div>
                )}
            </div>
        </main>
    );
}
