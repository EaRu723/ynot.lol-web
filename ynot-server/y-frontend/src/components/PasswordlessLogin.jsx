import { useEffect, useRef, useState } from "react";
import { OwnID } from "@ownid/react";
import PropTypes from "prop-types";
import "../styles/PasswordlessLogin.css";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";

const PasswordlessLogin = ({ API_URL, setIsLoggedIn, setUser }) => {
  const phoneNumberRef = useRef(null);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (phoneNumberRef.current) {
      phoneNumberRef.current.value = phone;
    }
  }, [phone]);

  function onError(data) {
    alert(`Error logging in: ${data}`);
  }

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
      alert(`Error logging in: ${loginResponse.detail}`);
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
          <PhoneInput
            placeholder="Enter phone number"
            defaultCountry="US"
            value={phone}
            onChange={setPhone}
            required
          />
          <input
            type="hidden"
            ref={phoneNumberRef}
            name="phoneNumber"
            value={phone}
            readOnly
          />
          <OwnID
            type="login"
            loginIdField={phoneNumberRef}
            onError={(error) => onError(error)}
            onLogin={(data) => onSubmit(data)}
          />
        </div>
        <button type="submit" className="button">
          Log In
        </button>
        <div value={phoneNumberRef}></div>
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
