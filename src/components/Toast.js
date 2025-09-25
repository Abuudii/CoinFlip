import React, { useEffect, useState } from "react";
import "../App.css";

export default function Toast({ message, type = "info", duration = 3000, onClose }) {
    const [show, setShow] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => { setShow(false); onClose && onClose(); }, duration);
        return () => clearTimeout(t);
    }, [duration, onClose]);

    if (!show) return null;
    return (
        <div className="toast">
            <div className="toast-item" role="status" aria-live="polite">
                <strong style={{ textTransform: "capitalize" }}>{type}</strong><br />{message}
            </div>
        </div>
    );
}
