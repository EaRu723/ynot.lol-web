import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import PostModal from "./PostModal.jsx";
import { MaximizedPostModal } from "./MaximizedPostModal.jsx";
import { renderTextWithTagsAndLinks } from "../utils/textUtils.jsx";
import BookmarkCard from "./BookmarkCard.jsx";
import "../styles/TimelinePosts.css";

export const PostCard = ({ post, avatar, apiUrl, isOwner, autoOpen }) => {
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
  }, [post.note]);

  // Immediately open the modal if autoOpen is true
  useEffect(() => {
    if (autoOpen) {
      setIsViewModalOpen(true);
    }
  }, [autoOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
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

  // Close menu if user clicks outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = (e) => {
    e.stopPropagation();
    closeMenu();
    setIsEditModalOpen(true);
  };

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
      <div className="post-card-wrapper">
        <div
          className="post-card"
          id={String(post.id)}
          onClick={handleOpenModal}
        >
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
          <div className="post-body">
            <div
              className={`post-text ${textOverflow ? "overflow" : ""}`}
              ref={textRef}
            >
              <pre>{renderTextWithTagsAndLinks(post.note)}</pre>
            </div>

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
      </div>

      {isViewModalOpen && (
        <MaximizedPostModal
          post={post}
          avatar={avatar}
          onClose={() => setIsViewModalOpen(false)}
          apiUrl={apiUrl}
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
    file_keys: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  avatar: PropTypes.string,
  apiUrl: PropTypes.string,
  isOwner: PropTypes.bool,
  autoOpen: PropTypes.bool,
};

const TimelinePosts = ({
  posts,
  bookmarks,
  apiUrl,
  isLoggedIn,
  userHandle,
  userAvatar,
}) => {
  const [searchParams] = useSearchParams();
  const sharePostId = searchParams.get("post");

  // Merge posts & bookmarks
  const timelineItems = [
    ...posts.map((p) => ({ ...p, type: "post" })),
    ...(Array.isArray(bookmarks)
      ? bookmarks.map((b) => ({ ...b, type: "bookmark" }))
      : []),
  ];

  // Sort by created_at descending
  timelineItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Group by local date (year, month, day)
  const groups = {};
  for (const item of timelineItems) {
    const localDate = new Date(item.created_at);
    const groupKey = `${localDate.getFullYear()}-${localDate.getMonth()}-${localDate.getDate()}`;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        displayDate: localDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        items: [],
      };
    }
    groups[groupKey].items.push(item);
  }

  // Sort group keys in descending order
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    const [ay, am, ad] = a.split("-").map(Number);
    const [by, bm, bd] = b.split("-").map(Number);
    return new Date(by, bm, bd) - new Date(ay, am, ad);
  });

  if (!timelineItems.length) {
    return <div>No posts to display</div>;
  }

  return (
    <div className="timeline-container">
      {sortedGroupKeys.map((groupKey) => {
        const { displayDate, items } = groups[groupKey];
        return (
          <div className="date-group" key={groupKey}>
            <h2 className="date-header">{displayDate}</h2>
            <div
              className="posts-scroll"
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "0.5rem",
                paddingBottom: "1rem",
              }}
            >
              {items.map((item) => {
                if (item.type === "post") {
                  return (
                    <PostCard
                      key={`post-${item.id}`}
                      post={item}
                      avatar={userAvatar}
                      apiUrl={apiUrl}
                      isOwner={isLoggedIn && item.owner === userHandle}
                      autoOpen={sharePostId && String(item.id) === sharePostId}
                    />
                  );
                } else {
                  return (
                    <BookmarkCard key={`bookmark-${item.id}`} bookmark={item} />
                  );
                }
              })}
            </div>
          </div>
        );
      })}
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
      file_keys: PropTypes.arrayOf(PropTypes.string),
    }),
  ).isRequired,
  bookmarks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      url: PropTypes.string,
      highlight: PropTypes.string,
      note: PropTypes.string,
      created_at: PropTypes.string,
    }),
  ),
  apiUrl: PropTypes.string.isRequired,
  isLoggedIn: PropTypes.bool,
  userHandle: PropTypes.string,
  userAvatar: PropTypes.string,
};

export default TimelinePosts;
