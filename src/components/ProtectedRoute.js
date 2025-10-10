import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, isExpired, decodeJwt } from "../utils/auth";

// role (optional) - if provided, user must have that role (e.g. 'admin')
export default function ProtectedRoute({ children, role }) {
    const token = getToken();
    if (!token || isExpired(token)) return <Navigate to="/login" replace />;

    if (role) {
        const payload = decodeJwt(token);
        if (!payload || payload.role !== role) return <Navigate to="/" replace />;
    }

    return children;
}
