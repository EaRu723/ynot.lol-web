import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import YFavicon from "/Frame 1.png";

const Header = React.memo(
  ({ API_URL, user, setUser, isLoggedIn, setIsLoggedIn, loading }) => {
    const [navModalOpen, setNavModalOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const toggleDropdown = () => {
      setDropdownOpen((prev) => !prev);
    };

    const handleLogout = async () => {
      try {
        await fetch(`${API_URL}/auth/logout`, {
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
        setDropdownOpen(false);
      }
    };

    // Close nav dropdown if clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setDropdownOpen(false);
        }
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
      e.stopPropagation();
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
            <img
              alt=""
              src={user.avatar}
              className="profile-image"
              onClick={toggleDropdown}
            />
          ) : (
            <div>
              {location.pathname === "/register" ? (
                <button
                  onClick={() => navigate("/login")}
                  className="login-button"
                >
                  Log in
                </button>
              ) : location.pathname === "/login" ? (
                <button
                  onClick={() => navigate("/register")}
                  className="login-button"
                >
                  Register
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/register")}
                    className="login-button"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="login-button"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          )}
          {dropdownOpen && (
            <div className="dropdown" ref={dropdownRef}>
              <a href={`/${user.username}/profile`} className="dropdown-item">
                Profile
              </a>
              <a href={`/${user.username}/settings`} className="dropdown-item">
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
      </div>
    );

    return loading ? <div className="header"></div> : renderHeader();
  },
);

Header.displayName = "Header";

export default Header;
