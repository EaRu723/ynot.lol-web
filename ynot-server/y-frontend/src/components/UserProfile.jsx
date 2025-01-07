import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import TimelinePosts from "./TimelinePosts.jsx";
import "../styles/UserProfile.css";
import Linkify from "react-linkify";

function UserProfile({ isLoggedIn, userHandle }) {
  const { handle } = useParams();
  const [searchParams] = useSearchParams();
  const rkey = searchParams.get("rkey");

  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileResponse = await fetch(
          `${API_URL}/user/${handle}/profile`,
        );
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);

        const postsResponse = await fetch(`${API_URL}/user/${handle}/posts`);
        if (!postsResponse.ok) {
          throw new Error("Failed to fetch user posts");
        }
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [handle, API_URL]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="main">
      <div
        className="profile-banner"
        style={{ backgroundImage: `url(${profile.banner})` }}
      >
        <div className="profile-avatar">
          <img src={profile.avatar} alt={`${handle}'s avatar`} />
        </div>
      </div>
      <div className="profile-info">
        <h1>{profile.display_name || handle}</h1>
        <p className="handle">@{handle}</p>
        <p className="bio">
          <Linkify>{profile.bio}</Linkify>
        </p>
      </div>
      <div className="posts-header">Activity</div>
      <div className="posts-container">
        <TimelinePosts
          posts={posts}
          setPosts={setPosts}
          apiUrl={API_URL}
          isLoggedIn={isLoggedIn}
          userHandle={userHandle}
          rkey={rkey}
        />
      </div>
    </div>
  );
}

export default UserProfile;
