import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { calculateTimeElapsed } from "../utils/timeUtils";
import "../styles/PostStream.css";
import { renderTextWithTagsAndLinks } from "../utils/textUtils";

function PostStream() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const WS_URL = import.meta.env.VITE_WEBSOCKET_BASE_URL;
  const [posts, setPosts] = useState([]);
  const scrollAreaRef = useRef(null);
  const wsRef = useRef(null);

  const connectWebSocket = () => {
    wsRef.current = new WebSocket(WS_URL + "/api/ws/feed");

    wsRef.current.onmessage = (event) => {
      const post = JSON.parse(event.data);
      setPosts((prevPosts) => [post, ...prevPosts].slice(0, 10));
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed. Reconnecting...");
      setTimeout(connectWebSocket, 1000);
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      wsRef.current.close();
    };
  };

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await fetch(`${API_URL}/recent-posts?limit=10`);
        const data = await response.json();
        setPosts(data);

        // Scroll to the top after fetching recent posts
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = 0;
        }
      } catch (error) {
        console.error("Error fetching recent posts:", error);
      }
    };

    fetchRecentPosts();
    connectWebSocket(); // Initialize WebSocket connection

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0; // Ensure scrolling starts from the top
    }
  }, [posts]);

  return (
    <div
      ref={scrollAreaRef}
      style={{
        overflowY: "auto",
        padding: "10px",
        borderRadius: "8px",
        margin: "2rem",
      }}
    >
      {posts.map((post, index) => (
        <PostItem key={post.id || index} post={post} />
      ))}
    </div>
  );
}

function PostItem({ post }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [contentHeight, setContentHeight] = useState("auto");
  const textRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (textRef.current) {
      const maxHeight = 72; // Approximate height for three lines
      if (textRef.current.scrollHeight > maxHeight) {
        setIsOverflowing(true);
        setContentHeight(`${maxHeight}px`);
      } else {
        setIsOverflowing(false);
        setContentHeight("auto"); // Fit the content
      }
    }
  }, [post.note]);

  const handlePostClick = () => {
    navigate(`/user/${post.owner}?post=${post.id}`);
  };

  return (
    <div onClick={handlePostClick} className="post-item-container">
      <small
        onClick={handlePostClick}
        style={{ marginBottom: "5px", display: "block", color: "#555" }}
      >
        @{post.owner}
      </small>
      {post.title && <h3 style={{ margin: "0.5rem 0" }}>{post.title}</h3>}
      <pre
        ref={textRef}
        style={{
          margin: "0 0 5px 0",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          textOverflow: "ellipsis",
          height: expanded ? "auto" : contentHeight, // Dynamic height
          position: "relative",
          transition: "height 0.3s ease",
        }}
      >
        {renderTextWithTagsAndLinks(post.note)}
        {!expanded && isOverflowing && (
          <span
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "100%",
              height: "3rem",
              background:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #fff 100%)",
            }}
          />
        )}
      </pre>
      <small style={{ color: "#888" }}>
        {calculateTimeElapsed(post.created_at)}
      </small>
    </div>
  );
}

PostItem.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number,
    owner: PropTypes.string,
    title: PropTypes.string,
    note: PropTypes.string,
    created_at: PropTypes.string,
    urls: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    file_keys: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default PostStream;
