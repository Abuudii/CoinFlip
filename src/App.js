import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

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
import TransferFlow from "./pages/TransferFlow";

// 🔹 Utils
import { getToken, clearToken } from "./utils/auth";
import "./App.css";

function AppContent() {
  const [authed, setAuthed] = useState(!!getToken());
  const navigate = useNavigate();

  // 🔁 Wenn sich Token ändert (z. B. durch Logout in anderem Tab)
  useEffect(() => {
    const onStorageChange = () => setAuthed(!!getToken());
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  // 🔹 Logout-Funktion für Sidebar
  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    navigate("/login");
  };

  return (
    <>
      {!authed && <Header />}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {authed && <Sidebar onLogout={handleLogout} />}

        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login onLogin={() => setAuthed(true)} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />

            {/* Protected */}
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

            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transfer"
              element={
                <ProtectedRoute>
                  <TransferFlow />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
