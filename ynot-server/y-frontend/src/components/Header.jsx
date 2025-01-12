import React, { useState, useEffect, useRef } from "react";
import "../styles/Header.css";
import YFavicon from "/Frame 1.png";
import { useNavigate } from "react-router-dom";

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

    // Close both dropdowns if clicking outside
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
            <img
              alt="Profile"
              src={user.avatar}
              className="profile-image"
              onClick={toggleDropdown}
            />
          ) : (
            <button onClick={onLogin} className="login-button">
              Log in
            </button>
          )}
          {dropdownOpen && (
            <div className="dropdown" ref={dropdownRef}>
              <a href={`/${user.handle}/profile`} className="dropdown-item">
                Profile
              </a>
              <a href={`/${user.handle}/settings`} className="dropdown-item">
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
