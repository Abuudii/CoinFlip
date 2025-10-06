import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import ExchangeLayout from "./pages/ExchangeLayout";   // Layout für alle Exchange-Seiten
import FiatExchange from "./pages/FiatExchange";
import CryptoExchange from "./pages/CryptoExchange";
import GraphPage from "./pages/GraphPage";
import { getToken } from "./utils/auth";
import "./App.css";

export default function App() {
  const authed = !!getToken();

  return (
    <BrowserRouter>
      {/* Header nur wenn nicht eingeloggt */}
      {!authed && <Header />}

      <div style={{ display: "flex" }}>
        {/* Sidebar nur wenn eingeloggt */}
        {authed && <Sidebar />}

        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset" element={<ResetPassword />} />

            {/* Protected Exchange mit Nested Routes */}
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
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
