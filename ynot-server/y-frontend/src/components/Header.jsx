import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import YFavicon from "/Frame 1.png";

const Header = React.memo(({ user, isLoggedIn, loading }) => {
  const [navModalOpen, setNavModalOpen] = useState(false);
  const navigate = useNavigate();

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
            onClick={() => navigate(`/user/${user.username}`)}
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
      </div>
    </div>
  );

  return loading ? <div className="header"></div> : renderHeader();
});

Header.displayName = "Header";

export default Header;
