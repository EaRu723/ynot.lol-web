import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import UserProfile from "./components/UserProfile";
import DiscoverPage from "./components/DiscoverPage.jsx";
import Header from "./components/Header.jsx";
import FloatingActionButton from "./components/FloatingActionButton";
import PostModal from "./components/PostModal";
import EditProfile from "./components/EditProfile.jsx";
import "./styles/styles.css";
import ProfileCompletionModal from "./components/ProfileCompletionModal.jsx";
import PasswordlessRegistration from "./components/PasswordlessRegistration.jsx";
import PasswordlessLogin from "./components/PasswordlessLogin.jsx";
import PrivacyPolicy from "./components/PrivacyPolicy.jsx";
import TermsOfService from "./components/TermsOfService.jsx";
import PostStream from "./components/PostStream.jsx";

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
          email: data.email,
          username: data.username,
          displayName: data.display_name,
          bio: data.bio,
          avatar: data.avatar,
          banner: data.banner,
          profile_complete: data.profile_complete,
        });

        // Show profile completion modal if the profile is not yet complete
        if (!data.profile_complete) {
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
  }, [API_URL]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication, API_URL]);

  return (
    <main>
      <Header
        API_URL={API_URL}
        user={user}
        setUser={setUser}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        loading={loading}
      />

      <Routes>
        <Route path="/" element={<DiscoverPage API_URL={API_URL} />} />

        <Route
          path="/user/:username"
          element={
            <UserProfile
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              user={user}
              setUser={setUser}
            />
          }
        />

        <Route path="stream" element={<PostStream />} />

        <Route
          path="/settings"
          element={
            <EditProfile API_URL={API_URL} user={user} setUser={setUser} />
          }
        />

        <Route
          path="/register"
          element={<PasswordlessRegistration API_URL={API_URL} />}
        />

        <Route
          path="/login"
          element={
            <PasswordlessLogin
              API_URL={API_URL}
              setIsLoggedIn={setIsLoggedIn}
              setUser={setUser}
            />
          }
        />

        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms-of-service" element={<TermsOfService />} />
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
