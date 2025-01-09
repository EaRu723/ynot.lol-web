import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import UserProfile from "./components/UserProfile";
import OAuthLogin from "./components/OAuthLogin";
import "./styles/styles.css";
import Whoami from "./components/Whoami.jsx";
import DiscoverPage from "./components/DiscoverPage.jsx";
import Header from "./components/Header.jsx";
import EditProfile from "./components/EditProfile.jsx";
import FloatingActionButton from "./components/FloatingActionButton";
import PostModal from "./components/PostModal";

const App = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const checkAuthentication = useCallback(async () => {
    if (isLoggedIn) return;

    try {
      const response = await fetch(`${API_URL}/whoami`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUser({
          handle: data.user.handle,
          bio: data.user.bio,
          did: data.user.did,
          displayName: data.user.displayName,
          avatar: data.user.avatar,
          banner: data.user.banner,
        });
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

  const hideHeader = ["/oauth/login"];

  return (
    <main>
      {!hideHeader.includes(location.pathname) && (
        <Header
          API_URL={API_URL}
          user={user}
          setUser={setUser}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          onLogin={() => navigate("/oauth/login")}
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
          path="/:handle/profile/edit"
          element={
            <EditProfile API_URL={API_URL} user={user} setUser={setUser} />
          }
        />
        <Route path="/oauth/login" element={<OAuthLogin />} />
        <Route path="/whoami" element={<Whoami />} />
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
    </main>
  );
};

export default App;
