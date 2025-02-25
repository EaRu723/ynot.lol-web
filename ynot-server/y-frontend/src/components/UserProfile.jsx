import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import TimelinePosts from "./TimelinePosts.jsx";
import "../styles/UserProfile.css";
import Linkify from "react-linkify";

function UserProfile({ isLoggedIn, user }) {
  const { username } = useParams();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("activity");
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [query, setQuery] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  const fetchUserData = async () => {
    try {
      const profileResponse = await fetch(
        `${API_URL}/user/${username}/profile`,
      );
      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }
      const profileData = await profileResponse.json();
      setProfile(profileData);

      const postsResponse = await fetch(`${API_URL}/user/${username}/posts`);
      if (!postsResponse.ok) {
        throw new Error("Failed to fetch user posts");
      }
      const postsData = await postsResponse.json();
      setPosts(postsData);

      const bookmarksResponse = await fetch(
        `${API_URL}/user/${username}/bookmarks`,
      );
      if (!bookmarksResponse.ok) {
        throw new Error("Failed to fetch user bookmarks");
      }
      const bookmarksData = await bookmarksResponse.json();
      setBookmarks(bookmarksData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsFiltered(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      fetchUserData();
      return;
    }
    onSearch(query);
  };

  const onSearch = async (query) => {
    try {
      const response = await fetch(
        `${API_URL}/user/search?query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      setPosts(data.posts);
      setBookmarks(data.bookmarks);
      setIsFiltered(true);
    } catch (error) {
      console.error("Error during search:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [username, API_URL]);

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        navigate("/");
        window.location.reload();
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="main">
      <div
        className="profile-banner"
        style={{ backgroundImage: `url(${profile.banner})` }}
      >
        <div className="profile-avatar">
          <img src={profile.avatar} alt={`${username}'s avatar`} />
        </div>
      </div>
      <div className="profile-info">
        <div className="profile-header">
          <div className="profile-text">
            <h1>{profile.display_name || username}</h1>
            <p className="handle">@{username}</p>
            <p className="bio">
              <Linkify>{profile.bio}</Linkify>
            </p>
            <div className="social-links">
              <button className="social-button">
                <i className="fab fa-twitter"></i>
                Twitter
              </button>
              <button className="social-button">
                <i className="fab fa-youtube"></i>
                YouTube
              </button>
              <button className="social-button">
                <i className="fab fa-instagram"></i>
                Instagram
              </button>
              <button className="social-button">
                <i className="fab fa-github"></i>
                GitHub
              </button>
            </div>
          </div>

          {isLoggedIn && user.username === username && (
            <div className="profile-actions">
              <button
                onClick={() => navigate("/settings")}
                className="profile-action-btn"
                style={{ color: "grey" }}
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="profile-action-btn logout"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="view-toggle">
        <button
          className={`toggle-btn ${activeView === "activity" ? "active" : ""}`}
          onClick={() => handleViewChange("activity")}
        >
          Activity
        </button>
        <button
          className={`toggle-btn ${activeView === "likes" ? "active" : ""}`}
          onClick={() => handleViewChange("likes")}
        >
          Likes
        </button>
        <button
          className={`toggle-btn ${activeView === "favorites" ? "active" : ""}`}
          onClick={() => handleViewChange("favorites")}
        >
          Favorites
        </button>
        {isLoggedIn && user.username === username && (
          <button
            className={`toggle-btn ${activeView === "private" ? "active" : ""}`}
            onClick={() => handleViewChange("private")}
          >
            Private
          </button>
        )}
      </div>
      <div className="profile-search">
        <form onSubmit={handleSubmit} className="profile-search-form">
          <input
            type="text"
            placeholder="Search your web"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="profile-search-input"
          />
          <button type="submit" className="profile-search-button">
            Search
          </button>
          {isFiltered && (
            <button
              onClick={() => {
                fetchUserData();
                setQuery("");
              }}
              className="clear-search-button"
            >
              Clear search
            </button>
          )}
        </form>
      </div>
      <div className="posts-by-date">
        <TimelinePosts
          posts={posts}
          bookmarks={bookmarks}
          apiUrl={API_URL}
          isLoggedIn={isLoggedIn}
          userHandle={user.username}
          userAvatar={user.avatar}
        />
      </div>
    </div>
  );
}

UserProfile.propTypes = {
  isLoggedIn: PropTypes.func,
  user: PropTypes.shape({
    username: PropTypes.string,
    avatar: PropTypes.string,
  }),
};

export default UserProfile;
