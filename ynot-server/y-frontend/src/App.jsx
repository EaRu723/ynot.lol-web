import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ShowcaseGrid from "./components/ShowcaseGrid";
import LoginModal from "./components/LoginModal";
import PostModal from "./components/PostModal";
import UserProfile from "./components/UserProfile";
import "./styles/styles.css";

function App() {
  const URL = import.meta.env.VITE_API_BASE_URL;
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [sites, setSites] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [filteredSites, setFilteredSites] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userHandle, setUserHandle] = useState("");

  const fetchSites = async () => {
    try {
      const response = await fetch(`${URL}/api/sites`);
      const data = await response.json();
      setSites(data);
      setFilteredSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${URL}/api/tags`);
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  useEffect(() => {
    fetchSites();
    fetchTags();
    checkAuthentication();
  }, []);

  const toggleTag = (tag) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) newTags.delete(tag);
    else newTags.add(tag);
    setSelectedTags(newTags);
    filterSites(newTags);
  };

  const filterSites = (tags) => {
    setFilteredSites(
      sites.filter((site) =>
        tags.size === 0 ? true : site.tags.some((tag) => tags.has(tag.name))
      )
    );
  };

  const checkAuthentication = () => {
    const token = sessionStorage.getItem("access_token");
    const handle = sessionStorage.getItem("handle");
    if (token && handle) {
      setIsLoggedIn(true);
      setUserHandle(handle);
    }
  };

  const handleLogin = (handle) => {
    setIsLoggedIn(true);
    setUserHandle(handle);
    setLoginModalOpen(false);
    window.location.reload(); // Refresh the page on successful login
  };

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("handle");
    setIsLoggedIn(false);
    setUserHandle("");
  };

  const refreshToken = async () => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (!refreshToken) return;

    try {
      const response = await fetch("/api/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem("access_token", data.access_token);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      handleLogout();
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshToken, 15 * 60 * 1000); // Refresh token every 15 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      <h1>
        <a href="/" style={{ textDecoration: "none" }}>
          Discover cool <i>people</i>.
        </a>
      </h1>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <div className="search-and-register">
                <div>
                  {isLoggedIn ? (
                    <div>
                      <a href={`/${userHandle}/profile`}>{userHandle}</a>
                      <button
                        onClick={() => setPostModalOpen(true)}
                        style={{ cursor: "pointer" }}
                      >
                        Post
                      </button>
                      <button
                        onClick={handleLogout}
                        style={{ cursor: "pointer" }}
                      >
                        Log out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLoginModalOpen(true)}
                      style={{ cursor: "pointer" }}
                    >
                      Log in
                    </button>
                  )}
                  {isLoginModalOpen && (
                    <LoginModal
                      onClose={() => setLoginModalOpen(false)}
                      onLogin={handleLogin}
                    />
                  )}
                  {isPostModalOpen && (
                    <PostModal onClose={() => setPostModalOpen(false)} />
                  )}
                </div>
                <div>
                  <input
                    type="search"
                    placeholder="Search..."
                    onChange={(e) =>
                      setFilteredSites(
                        sites.filter((site) =>
                          site.name
                            .toLowerCase()
                            .includes(e.target.value.toLowerCase())
                        )
                      )
                    }
                  />
                </div>
              </div>
              <div className="tag-buttons">
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    className={`tagButton ${
                      selectedTags.has(tag.name) ? "selected" : ""
                    }`}
                    onClick={() => toggleTag(tag.name)}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              <ShowcaseGrid sites={filteredSites} />
            </div>
          }
        />
        <Route path="/:handle/profile" element={<UserProfile />} />
      </Routes>
    </main>
  );
}

export default App;
