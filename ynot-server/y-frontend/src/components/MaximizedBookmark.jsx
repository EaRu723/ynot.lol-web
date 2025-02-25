import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import "../styles/MaximizedBookmark.css";

const MaximizedBookmark = ({ bookmark, highlightColor, onClose }) => {
  const contentRef = useRef(null);

  // Pre-process the markdown so that all occurrences of the highlight are wrapped in <mark>
  const getProcessedMarkdown = () => {
    if (bookmark.markdown && bookmark.highlight) {
      return bookmark.markdown
        .split(bookmark.highlight)
        .join(
          `<mark style="background-color: ${highlightColor};">${bookmark.highlight}</mark>`,
        );
    }
    return bookmark.markdown;
  };

  // Scroll to the first highlighted element after rendering
  useEffect(() => {
    if (contentRef.current && bookmark.highlight) {
      const firstMark = contentRef.current.querySelector("mark");
      if (firstMark) {
        firstMark.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [bookmark.highlight, bookmark.markdown]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bookmark-modal-overlay" onClick={onClose}>
      <div
        className="maximized-bookmark-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bookmark-details scrollable-content" ref={contentRef}>
          <div className="bookmark-url">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              {bookmark.url}
            </a>
          </div>
          {bookmark.note && (
            <div className="bookmark-note">
              <strong>Note:</strong> {bookmark.note}
            </div>
          )}
          <div className="bookmark-timestamp">
            <strong>Bookmarked on</strong> {formatTime(bookmark.created_at)}
          </div>
          {bookmark.markdown && (
            <div className="bookmark-markdown">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {getProcessedMarkdown()}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

MaximizedBookmark.propTypes = {
  bookmark: PropTypes.shape({
    id: PropTypes.number,
    owner_id: PropTypes.number,
    url: PropTypes.string,
    markdown: PropTypes.string,
    highlight: PropTypes.string,
    note: PropTypes.string,
    created_at: PropTypes.string,
  }),
  highlightColor: PropTypes.string,
  onClose: PropTypes.func,
};

export default MaximizedBookmark;
