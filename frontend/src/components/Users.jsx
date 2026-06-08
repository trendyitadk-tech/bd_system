// src/components/Users.jsx
import React, { useState } from "react";
import axios from "axios";
import "../App.css"; // Assuming common styles are defined here

const Users = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState("dashboard");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const payload = {
        username,
        email,
        role,
        password,
        permissions,
      };
      const response = await axios.post("/api/users", payload);
      setMessage("User created successfully!");
      // Reset form
      setUsername("");
      setEmail("");
      setRole("user");
      setPassword("");
      setPermissions("dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create user");
    }
  };

  return (
    <div className="users-page container" style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2 className="gradient-text" style={{ textAlign: "center" }}>
        Create New User
      </h2>
      <form onSubmit={handleSubmit} className="card" style={{ padding: "1.5rem", borderRadius: "12px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="input"
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="email">Email (optional)</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="permissions">Permissions (comma‑separated)</label>
          <input
            id="permissions"
            type="text"
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
            placeholder="dashboard,employees,users"
            className="input"
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>
        <button
          type="submit"
          className="btn primary"
          style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "linear-gradient(45deg, #6a11cb, #2575fc)", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Create User
        </button>
        {message && <p className="success" style={{ color: "#4caf50", marginTop: "1rem" }}>{message}</p>}
        {error && <p className="error" style={{ color: "#f44336", marginTop: "1rem" }}>{error}</p>}
      </form>
    </div>
  );
};

export default Users;
