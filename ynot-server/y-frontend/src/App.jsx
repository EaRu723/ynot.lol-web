import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import UserProfile from "./components/UserProfile";
import OAuthLogin from "./components/OAuthLogin";
import DiscoverPage from "./components/DiscoverPage.jsx";
import Header from "./components/Header.jsx";
import FloatingActionButton from "./components/FloatingActionButton";
import PostModal from "./components/PostModal";
import EditProfile from "./components/EditProfile.jsx";
import "./styles/styles.css";
import ProfileCompletionModal from "./components/ProfileCompletionModal.jsx";

const App = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const checkAuthentication = useCallback(async () => {
    //if (isLoggedIn) return;

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUser({
          avatar: data.avatar,
          email: data.email,
          name: data.name,
          profile_complete: data.profile_complete,
        });

        // Show profile completion modal if the profile is not yet complete
        if (!data.profile_complete) {
          console.log("profile incomplete");
          setShowProfileModal(true);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, [API_URL, isLoggedIn]);

  useEffect(() => {
    console.log("API URL: " + API_URL);
    checkAuthentication();
  }, [checkAuthentication, API_URL]);

  const hideHeader = ["/login"];

  return (
    <main>
      {!hideHeader.includes(location.pathname) && (
        <Header
          API_URL={API_URL}
          user={user}
          setUser={setUser}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          onLogin={() => navigate("/login")}
          loading={loading}
        />
      )}
      <Routes>
        <Route path="/" element={<DiscoverPage API_URL={API_URL} />} />
        <Route
          path="/:handle/profile"
          element={
            <UserProfile isLoggedIn={isLoggedIn} userHandle={user.handle} />
          }
        />
        <Route
          path="/:handle/settings"
          element={
            <EditProfile API_URL={API_URL} user={user} setUser={setUser} />
          }
        />
        <Route
          path="/login"
          element={
            <OAuthLogin setUser={setUser} setIsLoggedIn={setIsLoggedIn} />
          }
        />
      </Routes>
      <>
        <FloatingActionButton onClick={() => setIsPostModalOpen(true)} />
        {isPostModalOpen && (
          <PostModal
            onClose={() => setIsPostModalOpen(false)}
            isLoggedIn={isLoggedIn}
            onLogin={() => navigate("/oauth/login")}
          />
        )}
      </>
      {showProfileModal && (
        <ProfileCompletionModal
          API_URL={API_URL}
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </main>
  );
};

export default App;
