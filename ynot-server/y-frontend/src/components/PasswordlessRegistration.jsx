import { OwnID } from "@ownid/react";
import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/PasswordlessRegistration.css";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";

const PasswordlessRegistration = ({ API_URL }) => {
  const [ownIDData, setOwnIDData] = useState("");
  const emailField = useRef(null);
  const phoneNumberRef = useRef(null);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (phoneNumberRef.current) {
      phoneNumberRef.current.value = phone;
    }
  }, [phone]);

  // Called when OwnID successfully registers the user
  function onRegister(event) {
    setOwnIDData(event.data);
    console.log(event.data);
  }

  async function onSubmit(event) {
    event.preventDefault();
    const email = emailField.current.value;
    const phoneNum = phoneNumberRef.current.value;

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: phoneNum,
          ownIdData: ownIDData,
          email: email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Registration failed:", errorData);
        alert(`Failed to register: ${errorData.detail || "Unknown error"}`);
        return;
      }

      const successData = await response.json();
      console.log("Registration successful:", successData);
      alert("Registered successfully");
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
      alert("Registration failed:", error.message);
    }
  }

  return (
    <div className="registration-container">
      <h1>Join Y</h1>
      <form onSubmit={onSubmit} className="registration-form">
        <div className="form-group-inline">
          <input
            ref={emailField}
            type="email"
            id="email"
            name="email"
            placeholder="Enter email"
            required
          />
        </div>
        <div className="form-group-inline">
          <PhoneInput
            placeholder="Enter phone number"
            defaultCountry="US"
            value={phone}
            onChange={setPhone}
            required
          />
          <input
            ref={phoneNumberRef}
            value={phone}
            type="hidden"
            id="phoneNumber"
            name="phoneNumber"
            placeholder="Enter phone number"
            readOnly
          />
          <div className="ownid-container">
            <OwnID
              type="register"
              loginIdField={phoneNumberRef}
              onError={(error) => console.error("OwnID error:", error)}
              onRegister={onRegister}
            />
          </div>
        </div>
        <button type="submit" className="button">
          Register
        </button>
      </form>
      <small>
        By creating an account on Y, you consent to receive one-time passcodes
        via SMS. Consent is not a condition of purchase. Message & data rates
        may apply. Unsubscribe at any time by unlinking your phone number with
        your account in account settings.{" "}
        <a href="/privacy-policy">Privacy Policy</a> &{" "}
        <a href="/terms-of-service">Terms</a>.
      </small>
    </div>
  );
};

PasswordlessRegistration.propTypes = {
  API_URL: PropTypes.string,
};

export default PasswordlessRegistration;
