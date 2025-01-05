import React, { useState } from "react";

const Header = React.memo(
  ({ user, isLoggedIn, onLogin, onLogout, loading }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
      setDropdownOpen((prev) => !prev);
    };

    if (loading) {
      return (
        <div style={styles.header}>
          <h1>
            <a href="/" style={styles.link}>
              Discover cool <i>people</i>.
            </a>
          </h1>
        </div>
      );
    }

    return (
      <div style={styles.header}>
        <h1>
          <a href="/" style={styles.link}>
            Discover cool <i>people</i>.
          </a>
        </h1>
        {isLoggedIn ? (
          <div style={styles.profileContainer}>
            <img
              alt="Profile"
              src={user.avatar}
              style={styles.profileImage}
              onClick={toggleDropdown}
            />
            {dropdownOpen && (
              <div style={styles.dropdown}>
                <a href={`/${user.handle}/profile`} style={styles.dropdownItem}>
                  Profile
                </a>
                <a href="#" style={styles.dropdownItem}>
                  Settings
                </a>
                <button
                  onClick={onLogout}
                  style={{
                    ...styles.dropdownItem,
                    ...styles.buttonStyle,
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onLogin} style={styles.loginButton}>
            Log in
          </button>
        )}
      </div>
    );
  },
);

Header.displayName = "Header";

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #E9E9ED",
  },
  link: {
    textDecoration: "none",
    color: "inherit",
  },
  profileContainer: {
    position: "relative",
  },
  profileImage: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
  },
  dropdown: {
    position: "absolute",
    top: "50px",
    right: "0",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "5px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  },
  dropdownItem: {
    display: "block",
    padding: "10px 15px",
    color: "#333",
    textDecoration: "none",
    fontSize: "14px",
    textAlign: "left",
  },
  buttonStyle: {
    border: "none",
    background: "none",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
  loginButton: {
    cursor: "pointer",
    padding: "10px 15px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "#fff",
  },
};

export default Header;
