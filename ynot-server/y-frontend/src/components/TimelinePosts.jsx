import { useState, useRef, useEffect } from "react";
import PostModal from "./PostModal.jsx";
import PropTypes from "prop-types";
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

const PostCard = ({ post, apiUrl, isOwner }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
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
        body: JSON.stringify({ id: post.id }),
      });

      if (response.ok) {
        alert("Post deleted successfully.");
        window.location.reload();
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <div className="post-card" id={post.id}>
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
                  <button
                    onClick={handleDelete}
                    className="delete-button"
                    style={{ color: "#dc2626" }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="post-title">{post.title || "title.lol"}</div>

        <div className="post-text">
          <pre>{renderTextWithTagsAndLinks(post.note)}</pre>
        </div>

        <div className="post-timestamp">{formatTime(post.created_at)}</div>
      </div>

      {isEditModalOpen && (
        <PostModal post={post} onClose={() => setIsEditModalOpen(false)} />
      )}
    </>
  );
};

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    note: PropTypes.string,
    created_at: PropTypes.string,
    urls: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    file_keys: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  apiUrl: PropTypes.string,
  isOwner: PropTypes.bool,
};

const TimelinePosts = ({ posts, apiUrl, isLoggedIn, userHandle }) => {
  if (!Array.isArray(posts) || !posts.length)
    return <div>No posts to display</div>;

  // Remove date grouping, render posts directly
  return (
    <div className="timeline-container">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          apiUrl={apiUrl}
          isOwner={isLoggedIn && post.owner === userHandle}
        />
      ))}
    </div>
  );
};

TimelinePosts.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      note: PropTypes.string,
    }),
  ),
  setPosts: PropTypes.func,
  apiUrl: PropTypes.string,
  isLoggedIn: PropTypes.bool,
  userHandle: PropTypes.string,
};

export default TimelinePosts;
