import React, { useState, useEffect } from "react";
import "../styles/PostModal.css";
import { refreshToken } from "../utils/auth";

function PostModal({ onClose, post = null }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [urlFieldsCount, setUrlFieldsCount] = useState(post ? post.urls.length : 1);
  const [urls, setUrls] = useState(post ? post.urls : [""]);
  const [note, setNote] = useState(post ? post.note : "");
  const [tags, setTags] = useState(post ? post.tags : []);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (post) {
      setUrls(post.urls);
      setNote(post.note);
      setTags(post.tags);
    }
  }, [post]);

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

  const handleTagChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === " ") && tagInput.trim() !== "") {
      e.preventDefault();
      const newTag = tagInput.trim().startsWith("#") ? tagInput.trim().slice(1) : tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      const newTags = [...tags];
      newTags.pop();
      setTags(newTags);
    }
  };

  const handleRemoveTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
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

    const response = await fetch(`${API_URL}/post`, {
      method: post ? "PUT" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
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
        <div>
          <span className="close" onClick={onClose} style={{cursor: "pointer"}}>
            &times;
          </span>
        </div>
        <h2>{post ? "Edit" : "Post"}</h2>
        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="note">Note:</label>
            <textarea
              id="note"
              name="note"
              rows="4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
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
            <button type="button" onClick={handleAddUrlField} id="addUrlFieldButton">
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
              value={tagInput}
              onChange={handleTagChange}
              onKeyDown={handleTagKeyDown}
            />
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button type="button" className="remove-tag" onClick={() => handleRemoveTag(index)}>
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <button type="submit">{post ? "Update" : "Submit"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostModal;
