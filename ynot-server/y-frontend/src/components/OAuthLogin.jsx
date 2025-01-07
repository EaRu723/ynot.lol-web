import { useState } from "react";

function OAuthLogin() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const identifier = formData.get("identifier").trim();

    if (!identifier) {
      setError("Identifier cannot be empty.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/oauth/login`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          setError("No redirect URL provided by the server.");
        }
      } else {
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setError("An unexpected server error occurred.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "20px",
          borderBottom: "1px solid #E9E9ED",
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
          Discover cool <i>people.</i>
        </a>
      </h1>
      <div>
        <h2>Log in with atproto</h2>
        <p>Provide your handle or DID to authorize an existing account.</p>
        <p>
          You can also supply a PDS/entryway URL (eg. https://pds.example.com).
        </p>
      </div>
      <div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input type={"text"} name={"identifier"} />
            <button
              type={"submit"}
              style={{ cursor: "pointer" }}
              id={"submitButton"}
            >
              Login
            </button>
          </form>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}

export default OAuthLogin;
