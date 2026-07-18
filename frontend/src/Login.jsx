import { useState } from "react";
import API from "./services/api";

// Helper to extract a readable message from FastAPI/Pydantic error responses
function parseApiError(err, fallback) {
  const detail = err.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => e.msg || JSON.stringify(e)).join("\n");
  }
  return fallback;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("role", res.data.role || "customer");
      localStorage.setItem("email", res.data.email || email);

      onLogin();
    } catch (err) {
      const msg = parseApiError(err, "Login Failed. Please check your credentials.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      <header style={{ textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.5rem", color: "var(--text-primary)" }}>
          Welcome Back
        </h3>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Sign in to your customer support account
        </p>
      </header>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            color: "#fca5a5",
            fontSize: "0.85rem",
            whiteSpace: "pre-line",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.35rem",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.35rem",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: "100%", marginTop: "0.5rem", height: "42px" }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default Login;