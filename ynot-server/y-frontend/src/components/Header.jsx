import React, { useState, useEffect, useRef } from "react";
import "../styles/Header.css";

const Header = React.memo(
  ({ API_URL, user, setUser, isLoggedIn, setIsLoggedIn, onLogin, loading }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
      setDropdownOpen((prev) => !prev);
    };

    const handleLogout = async () => {
      try {
        await fetch(`${API_URL}/oauth/logout`, {
          method: "GET",
          credentials: "include",
        });
      } catch (error) {
        console.error("Error logging out:", error);
      } finally {
        setIsLoggedIn(false);
        setUser({});
        sessionStorage.clear();
      }
    };

    // Close dropdown if clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setDropdownOpen(false);
        }
      };

      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, []);

    if (loading) {
      return (
        <div className="header">
          <h1>
            <a href="/" className="header-link">
              Discover cool <i>people</i>.
            </a>
          </h1>
        </div>
      );
    }

    return (
      <div className="header">
        <h1>
          <a href="/" className="header-link">
            Discover cool <i>people</i>.
          </a>
        </h1>
        {isLoggedIn ? (
          <div className="profile-container" ref={dropdownRef}>
            <img
              alt="Profile"
              src={user.avatar}
              className="profile-image"
              onClick={toggleDropdown}
            />
            {dropdownOpen && (
              <div className="dropdown">
                <a href={`/${user.handle}/profile`} className="dropdown-item">
                  Profile
                </a>
                <a
                  href={`/${user.handle}/profile/edit`}
                  className="dropdown-item"
                >
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="dropdown-item"
                  style={{ color: "red" }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onLogin} className="login-button">
            Log in
          </button>
        )}
      </div>
    );
  },
);

Header.displayName = "Header";

export default Header;
