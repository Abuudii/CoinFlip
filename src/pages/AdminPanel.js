import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/config";

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ username: "", email: "", role: "" });
    const navigate = useNavigate();

    // 🔹 Benutzer laden
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data);
        } catch (err) {
            console.error("Fehler beim Laden:", err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                // token invalid or not authorized
                navigate('/login');
            }
        }
    };

    // 🔹 Benutzer löschen
    const handleDelete = async (id) => {
        if (!window.confirm("Benutzer wirklich löschen?")) return;
        try {
            const token = getToken();
            await axios.delete(`${API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchUsers();
        } catch (err) {
            console.error(err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) navigate('/login');
        }
    };

    // 🔹 Benutzer bearbeiten
    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData(user);
    };

    const handleSave = async () => {
        try {
            const token = getToken();
            await axios.put(`${API_URL}/users/${editingUser.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            console.error(err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) navigate('/login');
        }
    };

    return (
        <div className="admin-container">
            <h1 className="exchange-title">👑 Admin Panel</h1>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Benutzername</th>
                            <th>Email</th>
                            <th>Rolle</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.username}</td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`badge ${u.role === "admin" ? "badge-admin" : ""}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-gradient" onClick={() => handleEdit(u)}>
                                        Bearbeiten
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(u.id)}>
                                        Löschen
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <div className="modal-overlay">
                    <div className="admin-modal">
                        <h2>Benutzer bearbeiten</h2>
                        <div className="field">
                            <label>Benutzername</label>
                            <input
                                className="input"
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label>Email</label>
                            <input
                                className="input"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label>Rolle</label>
                            <select
                                className="input"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="modal-buttons">
                            <button className="btn btn-gradient" onClick={handleSave}>
                                Speichern
                            </button>
                            <button className="btn btn-danger" onClick={() => setEditingUser(null)}>
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
