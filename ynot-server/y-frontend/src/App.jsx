import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ShowcaseGrid from "./components/ShowcaseGrid";
import PostModal from "./components/PostModal";
import UserProfile from "./components/UserProfile";
import OAuthLogin from "./components/OAuthLogin";
import "./styles/styles.css";
import Header from "./components/Header.jsx";
import Whoami from "./components/Whoami.jsx";


function App() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  console.log("API URL: " + API_URL);
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [sites, setSites] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [filteredSites, setFilteredSites] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userHandle, setUserHandle] = useState("");
  const [userDid, setUserDid] = useState("");

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_URL}/sites`);
      const data = await response.json();
      setSites(data);
      setFilteredSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_URL}/tags`);
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

  const checkAuthentication = async () => {
    try {
      const response = await fetch(`${API_URL}/whoami`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserHandle(data.user.handle);
        setUserDid(data.user.did);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsLoggedIn(false);
    }
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
        setUserHandle("");
        sessionStorage.clear();
    }
  };

  return (
    <main>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <Header />
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
                      onClick={() => (window.location.href = `/oauth/login`)}
                      style={{ cursor: "pointer" }}
                    >
                      Log in
                    </button>
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
        <Route path="/oauth/login" element={<OAuthLogin />} />
        <Route path="/whoami" element={<Whoami />} />
      </Routes>
    </main>
  );
}

export default App;
