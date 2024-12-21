import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostPreview from "./PostPreview";
import "../styles/UserProfile.css";
import Header from "./Header.jsx";

function UserProfile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL =
    import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await fetch(`${API_URL}/user/${handle}/posts`);
        if (!response.ok) {
          throw new Error("Failed to fetch user posts");
        }
        const data = await response.json();
        setPosts(data);
        console.log(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [handle]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="main">
      <Header />
      <div className="profile-info">
        <h1>{handle}'s activity</h1>
        <p className="handle">@{handle}</p>
      </div>
      <div className="posts-header">Posts</div>
      <div className="posts-container">
        {posts.map((post) => (
          <PostPreview
            key={post.rkey}
            post={post}
            setPosts={setPosts}
          />
        ))}
      </div>
    </div>
  );
}

export default UserProfile;
