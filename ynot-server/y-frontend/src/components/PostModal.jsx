import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/PostModal.css";

function PostModal({ post, onClose = null }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [urls, setUrls] = useState(post ? post.urls : []);
  const [note, setNote] = useState(post ? post.note : "");
  const [tags, setTags] = useState(post ? post.tags : []);

  useEffect(() => {
    if (post) {
      setUrls(post.urls);
      setNote(post.note);
      setTags(post.tags);
    }
  }, [post]);

  const extractUrlsAndTags = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const extractedUrls = [...text.matchAll(urlRegex)].map((match) => match[0]);

    const tagRegex = /#(\w+)/g;
    const extractedTags = [...text.matchAll(tagRegex)].map((match) => match[1]);

    return { urls: extractedUrls, tags: extractedTags };
  };

  const handleNoteChange = (e) => {
    const newNote = e.target.value;
    setNote(newNote);

    const { urls: newUrls, tags: newTags } = extractUrlsAndTags(newNote);
    setUrls(newUrls);
    setTags(newTags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validUrls = urls.filter((url) => url.trim() !== "");
    for (const url of validUrls) {
      if (!isValidURL(url)) {
        alert("Invalid URL: " + url);
        return;
      }
    }

    const payload = {
      note,
      urls: validUrls,
      tags,
    };

    if (post && post.rkey) {
      payload.rkey = post.rkey;
    }

    const response = await fetch(`${API_URL}/post`, {
      method: post ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(`Post ${post ? "updated" : "created"} successfully`);
      e.target.reset();
      onClose();
    } else {
      alert(`Post ${post ? "update" : "creation"} failed`);
    }
  };

  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <button className="close" onClick={onClose}>
          &times;
        </button>
        <br />
        <br />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              id="note"
              name="note"
              rows="12"
              value={note}
              onChange={handleNoteChange}
            ></textarea>
          </div>
          <div className="form-group">
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <button type="submit" className="button">
              {post ? "Edit" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

PostModal.propTypes = {
  post: PropTypes.shape({
    rkey: PropTypes.string,
    note: PropTypes.string,
    urls: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
  onClose: PropTypes.func,
};

PostModal.DefaultProps = {
  post: null,
  onClose: () => {},
};

export default PostModal;
