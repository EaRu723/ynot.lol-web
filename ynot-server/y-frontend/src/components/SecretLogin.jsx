import { useState } from "react";
import PropTypes from "prop-types";

const SecretLogin = ({ API_URL, setUser, setIsLoggedIn }) => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const loginEndpoint = "/auth/secretlogin";
    const registerEndpoint = "/auth/secretregister";

    try {
      let response;
      let data;

      if (mode === "login") {
        response = await fetch(`${API_URL}${loginEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
      } else {
        response = await fetch(`${API_URL}${registerEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            username: formData.username,
          }),
        });
      }

      data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (mode === "login") {
        setUser(data.user);
        setIsLoggedIn(true);
        window.location.href = "/";
      } else {
        setMode("login");
        setFormData({ email: formData.email, password: "", username: "" });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-form">
      <h2>{mode === "login" ? "Login" : "Register"}</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        {mode === "register" && (
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />

        <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
      </form>

      <button
        className="mode-switch"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "Need an account? Register"
          : "Have an account? Login"}
      </button>
    </div>
  );
};

SecretLogin.propTypes = {
  API_URL: PropTypes.string.isRequired,
  setUser: PropTypes.func.isRequired,
  setIsLoggedIn: PropTypes.func.isRequired,
};

export default SecretLogin;
