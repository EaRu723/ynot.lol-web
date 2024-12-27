import React, { useState } from "react";
import PostModal from "./PostModal";
import "../styles/PostPreview.css";

function PostPreview({ post, setPosts }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(
        `${window.location.origin}/post/${post.rkey}`
    );
    alert("Post link copied to clipboard!");
  };

  const handleDelete = async (collection, rkey) => {
    const shouldDelete = window.confirm(
        "Are you sure you want to delete this post?"
    );
    if (!shouldDelete) return;

    const payload = {
      collection: collection,
      rkey: rkey,
    };

    try {
      const response = await fetch(`${API_URL}/post`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Post deleted successfully.");
        setPosts((prevPosts) => prevPosts.filter((post) => post.rkey !== rkey));
      }
    } catch (error) {
      console.error("Delete Post Error:", error);
      alert(`An error occurred: ${error.message || "Unknown error"}`);
    }
  };

  const handleEdit = async (post) => {
    setSelectedPost(post);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPost(null);
    window.location.reload();
  };

  // Function to parse text and make URLs clickable
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g; // Regex to match URLs
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
            <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "underline" }}
            >
              {part}
            </a>
        );
      }
      return part;
    });
  };

  return (
      <div className="post">
        <div className="post-header">
          <div className="post-menu">
            <button className="menu-button" onClick={toggleMenu}>
              ⋮
            </button>
            {menuOpen && (
                <div className="menu-dropdown">
                  <button onClick={handleShare}>Share</button>
                  <button onClick={() => handleEdit(post)}>Edit</button>
                  {isEditModalOpen && (
                      <PostModal post={selectedPost} onClose={handleCloseEditModal} />
                  )}
                  <button onClick={() => handleDelete(post.collection, post.rkey)}>
                    Delete
                  </button>
                </div>
            )}
          </div>
        </div>
        <pre className="post-description">
        {renderTextWithLinks(post.note)}
      </pre>
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