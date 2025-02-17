import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function OAuthLogin({ setUser, setIsLoggedIn }) {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn, // This function is triggered after selecting an account
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
          },
        );
      } else {
        console.error("Google API failed to load.");
      }
    };

    // Append the script to the document
    document.body.appendChild(script);

    // Cleanup on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, [GOOGLE_CLIENT_ID]);

  // Function to handle Google Sign-In
  async function handleGoogleSignIn(response) {
    const idToken = response.credential;
    console.log("Google ID Token:", idToken);
    setLoading(true);
    setError(null);

    try {
      // Send the ID token to your backend for verification
      const res = await fetch(`${API_URL}/auth/google/callback`, {
        method: "POST",
        credentials: "include", // Include cookies for session management
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: idToken }), // Pass the ID token to the backend
      });

      if (res.ok) {
        console.log("Login successful!");
        // Make the request to /me endpoint to fetch user data
        const meResponse = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (meResponse.ok) {
          const userData = await meResponse.json();
          console.log("User data:", userData);
          setUser(userData);
          setIsLoggedIn(true);
          navigate("/");
        } else {
          console.error("Failed to fetch user data");
          setError("Failed to fetch user data");
        }
      } else {
        const data = await res.json();
        setError(data.error || "An error occurred while logging in.");
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <a href="/">Back</a>
      <div>
        <div id="google-signin-button"></div>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </>
  );
}

export default OAuthLogin;
