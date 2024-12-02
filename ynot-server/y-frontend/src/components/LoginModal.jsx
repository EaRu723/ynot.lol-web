import React from "react";
import "../styles/LoginModal.css";

function LoginModal({ onClose }) {
  const URL = process.env.REACT_APP_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const handle = e.target.handle.value;
    const password = e.target.password.value;

    const response = await fetch(`${URL}/api/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, password }),
    });

    if (response.ok) {
      const data = await response.json();
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("handle", data.handle);
      onClose();
    } else {
      alert("Login failed");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose} style={{ cursor: "pointer" }}>
          &times;
        </span>
        <h2>Log in</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Handle:
            <input type="text" name="handle" required />
          </label>
          <label>
            Password:
            <input type="password" name="password" required />
          </label>
          <button type="submit" style={{ cursor: "pointer" }}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
