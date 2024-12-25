import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import UserProfile from "./components/UserProfile";
import OAuthLogin from "./components/OAuthLogin";
import "./styles/styles.css";
import Whoami from "./components/Whoami.jsx";
import DiscoverPage from "./components/DiscoverPage.jsx"
import PostStream from "./components/PostStream.jsx";


function App() {
  console.log("rendered");
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userHandle, setUserHandle] = useState("");

  useEffect( () => {
    console.log("API URL: " + API_URL);
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    if (isLoggedIn) return;

    try {
      const response = await fetch(`${API_URL}/whoami`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUserHandle(data.user.handle);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setIsLoggedIn(false);
    }
  };

  return (
    <main>
      <Routes>
        <Route
            path="/"
            element={
              <DiscoverPage
                  API_URL={API_URL}
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                  userHandle={userHandle}
                  setUserHandle={setUserHandle}
              />
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
