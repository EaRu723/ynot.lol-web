import React, { useState } from "react";
import "../styles/PostPreview.css";
import { refreshToken, handleLogout } from "../utils/auth";

function PostPreview({ post, onEdit, setPosts }) {
  const URL = import.meta.env.VITE_API_BASE_URL;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/post/${post.rkey}`
    );
    alert("Post link copied to clipboard!");
  };

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

  const handleDelete = async (collection, rkey) => {
    const tokenRefreshed = await refreshToken();
    if (!tokenRefreshed) {
        alert("Session expired, please log in");
        handleLogout();
        return;
    }
    deletePost(collection, rkey);
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-title">{post.title}</div>
        <div className="post-menu">
          <button className="menu-button" onClick={toggleMenu}>
            ⋮
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={handleShare}>Share</button>
              {onEdit && (
                <button onClick={() => onEdit(post.collection, post.rkey)}>
                  Edit
                </button>
              )}
              <button onClick={() => handleDelete(post.collection, post.rkey)}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <pre className="post-description">{post.description}</pre>
      <div className="post-urls">
        {post.urls.map((url, index) => (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ))}
      </div>
      <div className="post-tags">
        {post.tags.map((tag, index) => (
          <span key={index}>#{tag} </span>
        ))}
      </div>
      <div className="post-timestamp">
        <small>{post.time_elapsed}</small>
      </div>
    </div>
  );
}

export default PostPreview;
