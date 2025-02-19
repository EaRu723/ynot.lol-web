import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "../styles/MaximizedPostModal.css";
import { renderTextWithTagsAndLinks } from "../utils/textUtils";
import MaximizedGallery from "./MaximizedGallery";

export const MaximizedPostModal = ({
  post,
  avatar,
  onClose,
  apiUrl,
  isOwner,
}) => {
  const [expandedImageIndex, setExpandedImageIndex] = useState(null);

  // Disable scrolling on the main body when the modal mounts
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/user/${post.owner}?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const isMinimalText = !post.note || post.note.length <= 1000;
  const hasImages = post.file_keys && post.file_keys.length > 0;
  const shouldShowMaximizedGallery = hasImages && isMinimalText;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {shouldShowMaximizedGallery ? (
        <MaximizedGallery
          post={post}
          avatar={avatar}
          handleShare={handleShare}
          isOwner={isOwner}
          handleDelete={handleDelete}
        />
      ) : (
        <>
          <div className="maximized-post-container">
            <div className="center-column" onClick={(e) => e.stopPropagation()}>
              <div className="menu-container">
                <button className="util-button" onClick={handleShare}>
                  <i className="fa-solid fa-share-from-square"></i>
                </button>
                {isOwner && (
                  <button className="util-button" onClick={handleDelete}>
                    <i
                      className="fa-solid fa-trash-can"
                      style={{ color: "#ff4d4d" }}
                    ></i>
                  </button>
                )}
              </div>
              <div className="title-avatar-container">
                <img
                  alt=""
                  src={avatar}
                  className="profile-image"
                  onClick={() =>
                    (window.location.href = window.location.pathname)
                  }
                />
                <h1 className="modal-post-title">{post.title || " "}</h1>
              </div>
              <a
                href={`${window.location.pathname}`}
                className="modal-post-owner"
              >
                @{post.owner}
              </a>
              <div className="modal-post-body">
                <div className="modal-post-text">
                  <pre>{renderTextWithTagsAndLinks(post.note)}</pre>
                </div>
              </div>
              <div className="modal-footer">
                <div className="modal-post-timestamp">
                  {formatDate(post.created_at)}
                </div>
              </div>
            </div>

            <div className="right-column">
              {hasImages && (
                <div
                  className={`gallery-modal ${expandedImageIndex !== null ? "expanded" : ""
                    }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {expandedImageIndex !== null ? (
                    <div
                      className="gallery-expanded-image"
                      onClick={() => setExpandedImageIndex(null)}
                    >
                      <img
                        src={post.file_keys[expandedImageIndex]}
                        alt="Expanded gallery"
                      />
                    </div>
                  ) : (
                    <div className="gallery-thumbnails">
                      {post.file_keys.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Gallery image ${index + 1}`}
                          className="gallery-thumbnail"
                          onClick={() => setExpandedImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div
                className="comments-box"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ marginTop: 0 }}>Comments</h2>
                <p>
                  This is a dummy comments section. It dynamically resizes based
                  on the gallery box above.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
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
  avatar: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  apiUrl: PropTypes.string.isRequired,
  isOwner: PropTypes.bool.isRequired,
};
