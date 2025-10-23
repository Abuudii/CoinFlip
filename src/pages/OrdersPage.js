import React, { useState, useEffect } from "react";
import { getToken } from "../utils/auth";
import { API_URL } from "../utils/config";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const loadOrders = async () => {
            const token = getToken();
            const res = await fetch(`${API_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) setOrders(json.orders);
        };
        loadOrders();
    }, []);

    return (
        <div className="page-container">
            <h2>📑 Bestellungen</h2>
            <div className="pf-table">
                <div className="pf-thead">
                    <div>Datum</div>
                    <div>Typ</div>
                    <div>Währung</div>
                    <div>Betrag</div>
                    <div>Status</div>
                </div>
                {orders.map((o, i) => (
                    <div key={i} className="pf-row pf-trow">
                        <div>{new Date(o.created_at).toLocaleString()}</div>
                        <div>{o.type}</div>
                        <div>{o.currency}</div>
                        <div>{o.amount}</div>
                        <div>{o.status}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
