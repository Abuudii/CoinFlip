import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, isExpired } from "../utils/auth";

export default function ProtectedRoute({ children }) {
    const token = getToken();
    if (!token || isExpired(token)) return <Navigate to="/login" replace />;
    return children;
}
