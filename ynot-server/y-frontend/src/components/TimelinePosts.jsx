import React, { useState, useRef, useEffect } from "react";
import PostModal from "./PostModal.jsx";
import "../styles/TimelinePosts.css";
import { calculateTimeElapsed } from "../utils/timeUtils.js";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const groupPostsByDate = (posts) => {
  return posts.reduce((acc, post) => {
    const dateKey = new Date(post.created_at).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(post);
    return acc;
  }, {});
};

const renderTextWithTagsAndLinks = (text) => {
  if (!text) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const tagRegex = /#[^\s#]+/g;

  // Split text by both URLs and hashtags
  const parts = text.split(/(https?:\/\/[^\s]+|#[^\s#]+)/g);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Render links
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="link"
        >
          {part}
        </a>
      );
    } else if (tagRegex.test(part)) {
      // Render hashtags
      return (
        <span key={index} className="hashtag">
          {part}
        </span>
      );
    }
    // Render normal text
    return part;
  });
};

const PostCard = ({ id, post, setPosts, apiUrl, isOwner }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleShare = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/post/${post.rkey}`,
    );
    alert("Post link copied to clipboard!");
  };

  const handleDelete = async () => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this post?",
    );
    if (!shouldDelete) return;

    try {
      const response = await fetch(`${apiUrl}/post`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: post.collection, rkey: post.rkey }),
      });

      if (response.ok) {
        alert("Post deleted successfully.");
        setPosts((prevPosts) => prevPosts.filter((p) => p.rkey !== post.rkey));
      }
    } catch (error) {
      console.error("Delete Post Error:", error);
      alert("An error occurred while deleting the post.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = () => {
    closeMenu(); // Close the menu when the modal opens
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div className="post-card" id={id}>
        <div className="menu-container" ref={menuRef}>
          <button onClick={toggleMenu} className="menu-button">
            ⋮
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={handleShare}>Share</button>
              {isOwner && (
                <>
                  <button onClick={handleEdit}>Edit</button>
                  <button onClick={handleDelete} className="delete-button">
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="post-text">
          <pre>{renderTextWithTagsAndLinks(post.note)}</pre>
        </div>

        <div className="post-timestamp">
          {calculateTimeElapsed(post.created_at)}
        </div>
      </div>

      {isEditModalOpen && (
        <PostModal post={post} onClose={() => setIsEditModalOpen(false)} />
      )}
    </>
  );
};

const TimelinePosts = ({
  posts,
  setPosts,
  apiUrl,
  isLoggedIn,
  userHandle,
  rkey,
}) => {
  if (!Array.isArray(posts) || !posts.length)
    return <div>No posts to display</div>;

  // Remove date grouping, render posts directly
  return (
    <div className="timeline-container">
      {posts.map((post) => (
        <PostCard
          key={post.rkey}
          id={post.rkey}
          post={post}
          setPosts={setPosts}
          apiUrl={apiUrl}
          isOwner={isLoggedIn && post.handle === userHandle}
        />
      ))}
    </div>
  );
};

export default TimelinePosts;
