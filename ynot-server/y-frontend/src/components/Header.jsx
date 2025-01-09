import React, { useState, useEffect, useRef } from "react";
import "../styles/Header.css";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import YFavicon from "/Frame 1.png";

const Header = React.memo(
  ({ API_URL, user, setUser, isLoggedIn, setIsLoggedIn, onLogin, loading }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [navModalOpen, setNavModalOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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
        navigate("/");
      }
    };

    // Close both dropdowns if clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        // Close profile dropdown
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setDropdownOpen(false);
        }
        // Close nav dropdown
        if (
          !event.target.closest(".hamburger-menu") &&
          !event.target.closest(".nav-dropdown")
        ) {
          setNavModalOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const handleNavClick = (e) => {
      e.stopPropagation(); // Prevent click from bubbling up
      setNavModalOpen(!navModalOpen);
    };

    const renderHeader = () => (
      <div className="header">
        <div className="header-left">
          <button className="hamburger-menu" onClick={handleNavClick}>
            ☰
          </button>
          {navModalOpen && (
            <div className="nav-dropdown">
              <a href="/people" className="nav-dropdown-item">
                People
              </a>
              <a href="/projects" className="nav-dropdown-item">
                Projects
              </a>
              <a href="/discover" className="nav-dropdown-item">
                Discover
              </a>
              <a href="/about" className="nav-dropdown-item">
                About
              </a>
            </div>
          )}
          <h1>
            <a href="/" className="header-link">
              <img src={YFavicon} alt="Y Logo" className="header-logo" />
              our web
            </a>
          </h1>
        </div>

        <div className="header-middle">
          <input
            type="text"
            className="search-bar"
            placeholder="Search cool people/projects..."
          />
        </div>

        <div className="header-right">
          {isLoggedIn ? (
            <>
              <img
                alt="Profile"
                src={user.avatar}
                className="profile-image"
                onClick={toggleDropdown}
                ref={dropdownRef}
              />
              {dropdownOpen && (
                <div className="dropdown" ref={dropdownRef}>
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
            </>
          ) : (
            <button onClick={onLogin} className="login-button">
              Log in
            </button>
          )}
        </div>
      </div>
    );

    return loading ? (
      <div className="header">
        <button className="hamburger-menu">☰</button>
        <h1>
          <a href="/" className="header-link">
            <img src={YFavicon} alt="Y Logo" className="header-logo" />
            by people, for people
          </a>
        </h1>
      </div>
    ) : (
      renderHeader()
    );
  },
);

Header.displayName = "Header";
Header.propTypes = {
  API_URL: PropTypes.string,
  user: PropTypes.object,
  setUser: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  setIsLoggedIn: PropTypes.func,
  onLogin: PropTypes.func,
  loading: PropTypes.bool,
};

export default Header;
