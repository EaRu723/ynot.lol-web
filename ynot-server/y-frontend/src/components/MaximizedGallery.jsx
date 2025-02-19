import PropTypes from "prop-types";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import "../styles/MaximizedGallery.css";
import "../styles/MaximizedPostModal.css";
import { renderTextWithTagsAndLinks } from "../utils/textUtils";

const MaximizedGallery = ({
  post,
  avatar,
  handleShare,
  isOwner,
  handleDelete,
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div
      className="maximized-gallery-container"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="title-avatar-container">
        <img
          alt=""
          src={avatar}
          className="profile-image"
          onClick={() => (window.location.href = window.location.pathname)}
        />
        <h1 className="modal-post-title">{post.title || " "}</h1>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <a href={`${window.location.pathname}`} className="gallery-post-owner">
          @{post.owner}
        </a>

        <div className="gallery-menu-container">
          <button className="util-button" title="Share" onClick={handleShare}>
            <i className="fa-solid fa-share-from-square"></i>
          </button>
          {isOwner && (
            <button
              className="util-button"
              title="Delete"
              onClick={handleDelete}
            >
              <i
                className="fa-solid fa-trash-can"
                style={{ color: "#ff4d4d" }}
              ></i>
            </button>
          )}
        </div>
      </div>

      <div className="modal-post-text" style={{ maxWidth: 700 }}>
        <pre>{renderTextWithTagsAndLinks(post.note)}</pre>
      </div>
      <div className="masonry">
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}
          gutterBreakpoints={{ 350: "12px", 750: "16px", 900: "24px" }}
        >
          <Masonry>
            {post.file_keys.map((url, index) => (
              <div key={index} className="maximized-gallery-item">
                <img
                  src={url}
                  alt={`Gallery image ${index + 1}`}
                  className="maximized-gallery-image"
                />
              </div>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </div>
      <div className="modal-footer">
        <div className="modal-post-timestamp">
          {formatDate(post.created_at)}
        </div>
      </div>
    </div>
  );
};

MaximizedGallery.propTypes = {
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
  toggleMenu: PropTypes.func,
  menuOpen: PropTypes.func,
  handleShare: PropTypes.func,
  isOwner: PropTypes.bool,
  handleDelete: PropTypes.func,
};

export default MaximizedGallery;
