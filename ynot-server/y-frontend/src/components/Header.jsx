import React, { useState, useEffect, useRef } from "react";
import "../styles/Header.css";
import YFavicon from '/Frame 1.png';

const Header = React.memo(
  ({ API_URL, user, setUser, isLoggedIn, setIsLoggedIn, onLogin, loading }) => {
    const [navModalOpen, setNavModalOpen] = useState(false);
    const navModalRef = useRef(null);

    // Close nav dropdown if clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        // Close nav dropdown
        if (!event.target.closest('.hamburger-menu') && !event.target.closest('.nav-dropdown')) {
          setNavModalOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleNavClick = (e) => {
      e.stopPropagation();
      setNavModalOpen(!navModalOpen);
    };

    const renderHeader = () => (
      <div className="header">
        <div className="header-left">
          <button 
            className="hamburger-menu"
            onClick={handleNavClick}
          >
            ☰
          </button>
          {navModalOpen && (
            <div className="nav-dropdown">
              <a href="/people" className="nav-dropdown-item">People</a>
              <a href="/projects" className="nav-dropdown-item">Projects</a>
              <a href="/discover" className="nav-dropdown-item">Discover</a>
              <a href="/about" className="nav-dropdown-item">About</a>
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
            <a href={`/${user.handle}/profile`}>
              <img
                alt="Profile"
                src={user.avatar}
                className="profile-image"
              />
            </a>
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

export default Header;
