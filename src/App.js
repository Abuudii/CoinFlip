import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 🔹 Komponenten
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

// 🔹 Seiten
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ExchangeLayout from "./pages/ExchangeLayout";
import FiatExchange from "./pages/FiatExchange";
import CryptoExchange from "./pages/CryptoExchange";
import GraphPage from "./pages/GraphPage";
import AdminPanel from "./pages/AdminPanel";
import Portfolio from "./pages/Portfolio";
import TransferFlow from "./pages/TransferFlow"; // ✅ neue Geld-senden-Seite

// 🔹 Utils
import { getToken } from "./utils/auth";
import "./App.css";

export default function App() {
  const authed = !!getToken(); // prüft, ob der Nutzer eingeloggt ist

  return (
    <BrowserRouter>
      {/* Header nur sichtbar, wenn man nicht eingeloggt ist */}
      {!authed && <Header />}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar nur für eingeloggte Nutzer */}
        {authed && <Sidebar />}

        <div style={{ flex: 1 }}>
          <Routes>
            {/* ===================== PUBLIC ROUTES ===================== */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />

            {/* ===================== PROTECTED ROUTES ===================== */}
            {/* 💱 Exchange mit Unterrouten */}
            <Route
              path="/exchange"
              element={
                <ProtectedRoute>
                  <ExchangeLayout />
                </ProtectedRoute>
              }
            >
              <Route path="fiat" element={<FiatExchange />} />
              <Route path="crypto" element={<CryptoExchange />} />
              <Route path="graph" element={<GraphPage />} />
            </Route>

            {/* 💼 Portfolio-Seite */}
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />

            {/* 💸 Transfer Flow – neue Geld-senden-Seite */}
            <Route
              path="/transfer"
              element={
                <ProtectedRoute>
                  <TransferFlow />
                </ProtectedRoute>
              }
            />

            {/* 👑 Admin Panel (nur für Admins) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* Optional: 404-Fallback */}
            <Route
              path="*"
              element={
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  <h2>404 – Seite nicht gefunden</h2>
                  <p>Die angeforderte Seite existiert nicht.</p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
