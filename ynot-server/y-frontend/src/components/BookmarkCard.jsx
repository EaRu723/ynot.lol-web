import PropTypes from "prop-types";
import { useState } from "react";
import MaximizedBookmark from "./MaximizedBookmark.jsx";
import "../styles/BookmarkCard.css";

const BookmarkCard = ({ bookmark }) => {
  const pastelColors = [
    "#FCE4EC", // light pink
    "#E8F5E9", // light green
    "#E3F2FD", // light blue
    "#FFF3E0", // light orange
    "#F3E5F5", // light purple
    "#E0F7FA", // light cyan
  ];

  // Choose a random pastel color only once when the component mounts
  const [highlightColor] = useState(() => {
    const randomIndex = Math.floor(Math.random() * pastelColors.length);
    return pastelColors[randomIndex];
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const openModal = () => {
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
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
      <div className="bookmark-card-wrapper" onClick={openModal}>
        <div className="bookmark-card" id={`bookmark-${bookmark.id}`}>
          <div className="bookmark-url">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              {bookmark.url}
            </a>
          </div>
          {bookmark.highlight && (
            <div
              className="bookmark-highlight"
              style={{
                backgroundColor: highlightColor,
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              {bookmark.highlight}
            </div>
          )}
          {bookmark.note && (
            <div className="bookmark-note">&gt; {bookmark.note}</div>
          )}
          <div className="bookmark-timestamp">
            {formatTime(bookmark.created_at)}
          </div>
        </div>
      </div>
      {isViewModalOpen && (
        <MaximizedBookmark
          bookmark={bookmark}
          highlightColor={highlightColor}
          onClose={closeModal}
        />
      )}
    </>
  );
};

BookmarkCard.propTypes = {
  bookmark: PropTypes.shape({
    id: PropTypes.number.isRequired,
    owner_id: PropTypes.number,
    url: PropTypes.string,
    highlight: PropTypes.string,
    note: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
};

export default BookmarkCard;
