import { useState, useRef, useEffect } from "react";
import PostModal from "./PostModal.jsx";
import PropTypes from "prop-types";
import { MaximizedPostModal } from "./MaximizedPostModal.jsx";
import "../styles/TimelinePosts.css";
import { useSearchParams } from "react-router-dom";
import { renderTextWithTagsAndLinks } from "../utils/textUtils.jsx";

const PostCard = ({ post, apiUrl, isOwner, autoOpen }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [textOverflow, setTextOverflow] = useState(false);
  const menuRef = useRef(null);
  const textRef = useRef(null);

  // Check if the text content is overflowing
  useEffect(() => {
    if (textRef.current) {
      const hasOverflow =
        textRef.current.scrollHeight > textRef.current.clientHeight;
      setTextOverflow(hasOverflow);
    }
  }, [post.note]); // run whenever the note changes

  // Automatically maximize if autoOpen prop is tru
  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => {
        setIsViewModalOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

  // Toggle the dropdown menu
  const toggleMenu = (e) => {
    e.stopPropagation(); // prevent triggering the post click
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => setMenuOpen(false);

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      `${window.location.origin}/user/${post.owner}?post=${post.id}`,
    );
    alert("Post link copied to clipboard!");
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
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

  const handleEdit = (e) => {
    e.stopPropagation();
    closeMenu(); // Close the menu when the modal opens
    setIsEditModalOpen(true);
  };

  // When the card is clicked, open the view modal
  const handleOpenModal = () => {
    setIsViewModalOpen(true);
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
      <div className="post-card" id={post.id} onClick={handleOpenModal}>
        <div className="menu-container" ref={menuRef}>
          <button onClick={toggleMenu} className="menu-button">
            ⋮
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={handleShare}>Share</button>
              {isOwner && (
                <>
                  <button
                    onClick={handleDelete}
                    className="delete-button"
                    style={{ color: "#dc2626" }}
                  >
                    Delete
                  </button>
                  {/*
                  <button onClick={handleEdit}>
                    Edit
                  </button>
                  */}
                </>
              )}
            </div>
          )}
        </div>

        <div className="post-title">{post.title || " "}</div>

        {/* Wrap text and (optional) images in a container */}
        <div className="post-body">
          <div
            className={`post-text ${textOverflow ? "overflow" : ""}`}
            ref={textRef}
          >
            <pre>{renderTextWithTagsAndLinks(post.note)}</pre>
          </div>

          {/* If there are images, show them in a container anchored to the bottom */}
          {post.file_keys && post.file_keys.length > 0 && (
            <div className="post-images">
              {post.file_keys.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="post-image-thumbnail"
                />
              ))}
            </div>
          )}
        </div>

        <div className="post-timestamp">{formatTime(post.created_at)}</div>
      </div>

      {isViewModalOpen && (
        <MaximizedPostModal
          post={post}
          onClose={() => setIsViewModalOpen(false)}
          isOwner={isOwner}
        />
      )}

      {isEditModalOpen && (
        <PostModal post={post} onClose={() => setIsEditModalOpen(false)} />
      )}
    </>
  );
};

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number,
    owner: PropTypes.string,
    title: PropTypes.string,
    note: PropTypes.string,
    created_at: PropTypes.string,
    urls: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    file_keys: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  apiUrl: PropTypes.string,
  isOwner: PropTypes.bool,
  autoOpen: PropTypes.bool,
};

const TimelinePosts = ({ posts, apiUrl, isLoggedIn, userHandle }) => {
  const [searchParams] = useSearchParams();
  const sharePostId = searchParams.get("post");

  useEffect(() => {
    if (sharePostId) {
      const postElement = document.getElementById(sharePostId);
      if (postElement) {
        postElement.classList.add("highlighted-post");
        postElement.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
          postElement.classList.remove("highlighted-post");
        }, 500);
      }
    }
  }, [searchParams, sharePostId]);

  if (!Array.isArray(posts) || !posts.length)
    return <div>No posts to display</div>;

  return (
    <div className="timeline-container">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          apiUrl={apiUrl}
          isOwner={isLoggedIn && post.owner === userHandle}
          autoOpen={Number(sharePostId) === post.id}
        />
      ))}
    </div>
  );
};

TimelinePosts.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      owner: PropTypes.string,
      title: PropTypes.string,
      note: PropTypes.string,
      created_at: PropTypes.string,
      urls: PropTypes.arrayOf(PropTypes.string),
      tags: PropTypes.arrayOf(PropTypes.string),
      file_keys: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  setPosts: PropTypes.func,
  apiUrl: PropTypes.string,
  isLoggedIn: PropTypes.bool,
  userHandle: PropTypes.string,
};

export default TimelinePosts;
