import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostPreview from "./PostPreview";
import "../styles/UserProfile.css";

function UserProfile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await fetch(`${URL}/user/${handle}/posts`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user posts");
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [handle]);

  const deletePost = async (collection, rkey) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!shouldDelete) return;

    try {
      const response = await fetch(`${URL}/api/post`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ collection, rkey }),
      });

      if (response.ok) {
        alert("Post deleted successfully.");
        setPosts((prevPosts) => prevPosts.filter((post) => post.rkey !== rkey));
      } else {
        throw new Error("Failed to delete post");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (collection, rkey) => {
    navigate(`/edit?collection=${collection}&rkey=${rkey}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="main">
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
            onEdit={handleEdit}
            onDelete={deletePost}
          />
        ))}
      </div>
    </div>
  );
}

export default UserProfile;