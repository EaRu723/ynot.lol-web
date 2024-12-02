import React, { useState } from "react";
import "../styles/PostModal.css";
import { refreshToken } from "../utils/auth";

function PostModal({ onClose }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [urlFieldsCount, setUrlFieldsCount] = useState(1);
  const [urls, setUrls] = useState([""]);

  const handleAddUrlField = () => {
    if (urlFieldsCount >= 3) return;
    setUrls([...urls, ""]);
    setUrlFieldsCount(urlFieldsCount + 1);
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tokenRefreshed = await refreshToken();
    if (!tokenRefreshed) return;

    const title = e.target.title.value;
    const description = e.target.description.value;
    const tags = e.target.tags.value
      .split(/\s+/)
      .filter((tag) => tag.trim() !== "");

    const validUrls = urls.filter((url) => url.trim() !== "");
    for (const url of validUrls) {
      if (!isValidURL(url)) {
        alert("Invalid URL: " + url);
        return;
      }
    }

    const response = await fetch(`${API_URL}/api/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
      },
      body: JSON.stringify({
        title,
        description,
        urls: validUrls,
        tags,
        collection: "com.ynot.post",
      }),
    });

    if (response.ok) {
      alert("Post successful");
      e.target.reset();
      onClose();
    } else {
      alert("Post failed");
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
        <span className="close" onClick={onClose} style={{ cursor: "pointer" }}>
          &times;
        </span>
        <h2>Post</h2>
        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" required />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea id="description" name="description" rows="4"></textarea>
          </div>
          <div className="form-group" style={{ gap: "0.5rem" }}>
            <label htmlFor="urls">Link(s):</label>
            <div id="url-container">
              {urls.map((url, index) => (
                <input
                  key={index}
                  type="text"
                  name="urls"
                  placeholder="URL://"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddUrlField}
              id="addUrlFieldButton"
            >
              +
            </button>
          </div>
          <div className="form-group">
            <label htmlFor="tags">Tags:</label>
            <input
              type="text"
              id="tags"
              name="tags"
              placeholder="#art #tech #blog"
            />
          </div>
          <div className="form-group">
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostModal;
