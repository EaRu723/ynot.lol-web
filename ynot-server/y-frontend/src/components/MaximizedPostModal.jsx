import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "../styles/MaximizedPostModal.css";
import { renderTextWithTagsAndLinks } from "../utils/textUtils";

export const MaximizedPostModal = ({ post, onClose, apiUrl, isOwner }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedImageIndex, setExpandedImageIndex] = useState(null);

  // Disable scrolling on the main site body when the modal mounts
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/user/${post.owner}?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Post link copied to clipboard!");
    closeMenu();
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    closeMenu();
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

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleThumbnailClick = (index) => {
    // Toggle the expanded image: if the clicked thumbnail is already expanded, collapse it.
    setExpandedImageIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  // Handler for clicks on the thumbnails container
  const handleThumbnailsContainerClick = (e) => {
    if (e.target === e.currentTarget && expandedImageIndex !== null) {
      setExpandedImageIndex(null);
    }
  };

  // Handler for clicks on the expanded image container
  const handleExpandedImageContainerClick = (e) => {
    if (e.target === e.currentTarget) {
      setExpandedImageIndex(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="menu-container">
          <button onClick={toggleMenu} className="menu-button">
            ⋮
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={handleShare}>Share</button>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="delete-button"
                  style={{ color: "#dc2626" }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        <h1 className="modal-post-title">{post.title || " "}</h1>
        <p className="modal-post-owner">@{post.owner}</p>
        <div className="modal-post-body">
          <div className="modal-post-text">
            <pre>{renderTextWithTagsAndLinks(post.note)}</pre>
          </div>
        </div>

        {/* Thumbnails row: only render if there is more than one image 
            or if there is one image and it is not expanded */}
        {post.file_keys &&
          post.file_keys.length > 0 &&
          (post.file_keys.length > 1 || expandedImageIndex === null) && (
            <div
              className="modal-thumbnails"
              onClick={handleThumbnailsContainerClick}
            >
              {post.file_keys.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="modal-image-thumbnail"
                  onClick={() => handleThumbnailClick(index)}
                  style={{
                    display:
                      expandedImageIndex === index ? "none" : "inline-block",
                  }}
                />
              ))}
            </div>
          )}

        {/* Expanded image container: appears on a new line below the thumbnails */}
        {expandedImageIndex !== null && (
          <div
            className="modal-expanded-image"
            onClick={handleExpandedImageContainerClick}
          >
            <img
              src={post.file_keys[expandedImageIndex]}
              alt={`Expanded image`}
              onClick={() => handleThumbnailClick(expandedImageIndex)}
            />
          </div>
        )}

        <div className="modal-footer">
          <div className="modal-post-timestamp">
            {formatDate(post.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

MaximizedPostModal.propTypes = {
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
  onClose: PropTypes.func.isRequired,
  apiUrl: PropTypes.string.isRequired,
  isOwner: PropTypes.bool.isRequired,
};
