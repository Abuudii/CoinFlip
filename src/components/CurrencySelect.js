import React, { useState, useEffect, useRef } from "react";
import "../App.css";

export default function CurrencySelect({ label, value, options = [], onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);
    const inputRef = useRef(null);

    const filtered = options.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    // Schließt das Dropdown beim Klick außerhalb
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fokussiert das Suchfeld nur beim Öffnen (nicht sofort bei Render)
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleSelect = (c) => {
        onChange(c);
        setSearch("");
        // Kleine Verzögerung, damit die Animation smooth schließen kann
        setTimeout(() => setOpen(false), 120);
    };

    return (
        <div className="currency-select" ref={ref}>
            <label className="currency-label">{label}</label>

            <div
                className={`currency-input ${open ? "active" : ""}`}
                onClick={() => setOpen(!open)}
            >
                <span>{value || "Währung wählen"}</span>
                <span className={`arrow ${open ? "rotated" : ""}`}>▾</span>
            </div>

            <div className={`currency-dropdown-wrapper ${open ? "open" : ""}`}>
                <div className="currency-dropdown">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="🔍 Suche..."
                        className="currency-search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="currency-list">
                        {filtered.length > 0 ? (
                            filtered.map((c) => (
                                <div
                                    key={c}
                                    className={`currency-option ${c === value ? "selected" : ""
                                        }`}
                                    onClick={() => handleSelect(c)}
                                >
                                    <span className="flag">{currencyFlag(c)}</span>
                                    <span>{c}</span>
                                </div>
                            ))
                        ) : (
                            <div className="currency-empty">Keine Treffer</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Flaggen für bekannte Währungen
function currencyFlag(code) {
    const flags = {
        USD: "🇺🇸",
        EUR: "🇪🇺",
        GBP: "🇬🇧",
        CHF: "🇨🇭",
        CAD: "🇨🇦",
        JPY: "🇯🇵",
        AUD: "🇦🇺",
        BTC: "₿",
        ETH: "Ξ",
    };
    return flags[code] || "💱";
}
