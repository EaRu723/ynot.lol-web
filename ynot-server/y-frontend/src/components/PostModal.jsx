import React, { useState, useEffect } from "react";
import "../styles/PostModal.css";

function PostModal({ post, onClose = null, isLoggedIn, onLogin }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [urls, setUrls] = useState(post ? post.urls : []);
  const [note, setNote] = useState(post ? post.note : "");
  const [tags, setTags] = useState(post ? post.tags : []);
  const [submitType, setSubmitType] = useState(null); // null, 'post', or 'website'
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteDescription, setWebsiteDescription] = useState("");

  useEffect(() => {
    if (post) {
      setUrls(post.urls);
      setNote(post.note);
      setTags(post.tags);
    }
  }, [post]);

  const extractUrlsAndTags = (text) => {
    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const extractedUrls = [...text.matchAll(urlRegex)].map((match) => match[0]);

    // Extract Tags
    const tagRegex = /#(\w+)/g;
    const extractedTags = [...text.matchAll(tagRegex)].map((match) => match[1]);

    return { urls: extractedUrls, tags: extractedTags };
  };

  const handleNoteChange = (e) => {
    const newNote = e.target.value;
    setNote(newNote);

    // Extract URLs and Tags from the note
    const { urls: newUrls, tags: newTags } = extractUrlsAndTags(newNote);

    // Update URLs and Tags
    setUrls(newUrls);
    setTags(newTags);
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

    if (post && post.rkey) {
      payload.rkey = post.rkey;
    }

    const request = async () => {
      return await fetch(`${API_URL}/post`, {
        method: post ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    };

    const response = await request();
    if (response.ok) {
      alert(`Post ${post ? "updated" : "created"} successfully`);
      e.target.reset();
      onClose();
    } else {
      alert(
        `Post ${post ? "update" : "creation"} failed: ${response.statusText}`,
      );
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

  const formatUrl = (url) => {
    // Remove any whitespace
    url = url.trim();

    // Check if the URL starts with http:// or https://
    if (!url.match(/^https?:\/\//i)) {
      // If not, add https://
      url = "https://" + url;
    }

    return url;
  };

  const handleWebsiteSubmit = async (e) => {
    e.preventDefault();

    // Format the URL before submission
    const formattedUrl = formatUrl(websiteUrl);

    // TODO: Implement website submission logic with formatted URL
    console.log("Submitting website:", {
      url: formattedUrl,
      description: websiteDescription,
    });

    alert("Website submission feature coming soon!");
    onClose();
  };

  const handleClickOutside = (e) => {
    // Check if the click was outside the modal-content
    if (e.target.className === "modal") {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleClickOutside}>
      <div className="modal-content">
        <div>
          <span
            className="close"
            onClick={onClose}
            style={{ cursor: "pointer" }}
          >
            &times;
          </span>
        </div>
        <h2>Share Something Cool</h2>
        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              id="note"
              name="note"
              rows="14"
              value={note}
              onChange={handleNoteChange}
              placeholder="Share an article, a video, a website, or whatever's on your mind"
            ></textarea>
          </div>
          <div className="form-group">
            <button type="submit" className="submit-button">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostModal;
