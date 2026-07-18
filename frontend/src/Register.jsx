import { useState } from "react";
import API from "./services/api";

function parseApiError(err, fallback) {
  const detail = err.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
  return fallback;
}

function Register({ onRegisterSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const register = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });
      alert("Account created! Please log in.");
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      setError(parseApiError(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      <header style={{ textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-primary)" }}>Create Account</h3>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Join MultiSupport AI in seconds
        </p>
      </header>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: "8px", padding: "0.75rem 1rem", color: "#fca5a5", fontSize: "0.85rem"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={register} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Full Name
          </label>
          <input type="text" placeholder="John Doe" value={name}
            onChange={(e) => setName(e.target.value)} required style={{ width: "100%" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Email Address
          </label>
          <input type="email" placeholder="name@company.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Password
          </label>
          <input type="password" placeholder="Choose any password" value={password}
            onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%" }} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}
          style={{ width: "100%", marginTop: "0.5rem", height: "42px" }}>
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}

export default Register;