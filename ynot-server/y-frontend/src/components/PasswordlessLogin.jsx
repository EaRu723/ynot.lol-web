import { useRef } from "react";
import { OwnID } from "@ownid/react";
import PropTypes from "prop-types";
import "../styles/PasswordlessLogin.css";

const PasswordlessLogin = ({ API_URL, setIsLoggedIn, setUser }) => {
  const phoneNumber = useRef(null);

  async function onSubmit(data) {
    setIsLoggedIn(true);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownIdData: data.ownid_data,
        token: data.token,
        userAgent: navigator.userAgent,
      }),
    });

    const loginResponse = await response.json();

    if (!response.ok) {
      alert(`Error logging in: ${loginResponse.error}`);
    }

    setUser({
      id: loginResponse.user.id,
      username: loginResponse.user.username,
      email: loginResponse.user.email,
      avatar: loginResponse.user.avatar,
      banner: loginResponse.user.banner,
      profile_complete: loginResponse.user.profile_complete,
    });

    window.location.href = "/";
  }

  return (
    <div className="login-container">
      <h1>Welcome back to Y!</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Please ensure you are signing in using biometric auth.");
        }}
        className="login-form"
      >
        <div className="form-group-inline">
          <input
            ref={phoneNumber}
            type="tel"
            name="phoneNumber"
            placeholder="Enter phone number"
            required
          />
          <OwnID
            type="login"
            loginIdField={phoneNumber}
            onError={(error) => console.error(error)}
            onLogin={(data) => onSubmit(data)}
          />
        </div>
        <button type="submit" className="button">
          Log In
        </button>
      </form>
    </div>
  );
};

PasswordlessLogin.propTypes = {
  API_URL: PropTypes.string,
  setIsLoggedIn: PropTypes.func,
  setUser: PropTypes.func,
};

export default PasswordlessLogin;
