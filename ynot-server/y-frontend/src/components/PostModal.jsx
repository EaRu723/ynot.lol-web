import React, { useState, useEffect } from "react";
import "../styles/PostModal.css";

function PostModal({ post, onClose = null, isLoggedIn, onLogin }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [urls, setUrls] = useState(post ? post.urls : []);
  const [note, setNote] = useState(post ? post.note : "");
  const [tags, setTags] = useState(post ? post.tags : []);
  const [submitType, setSubmitType] = useState(null); // null, 'post', or 'website'
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteDescription, setWebsiteDescription] = useState('');

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
      const newResp = await request();
      if (newResp.ok) {
        alert(`Post ${post ? "updated" : "created"} successfully`);
        e.target.reset();
        onClose();
      } else {
        alert(`Post ${post ? "update" : "creation"} failed`);
      }
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
      url = 'https://' + url;
    }
    
    return url;
  };

  const handleWebsiteSubmit = async (e) => {
    e.preventDefault();
    
    // Format the URL before submission
    const formattedUrl = formatUrl(websiteUrl);
    
    // TODO: Implement website submission logic with formatted URL
    console.log('Submitting website:', {
      url: formattedUrl,
      description: websiteDescription
    });
    
    alert('Website submission feature coming soon!');
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        {isLoggedIn ? (
          <>
            <div>
              <span
                className="close"
                onClick={onClose}
                style={{ cursor: "pointer" }}
              >
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
                  onChange={handleNoteChange}
                ></textarea>
              </div>
              <div className="form-group">
                <div className="tags-container">
                  {tags.map((tag, index) => (
                    <span key={index} className="tag">
                      #{tag}
                      <button
                        type="button"
                        className="remove-tag"
                        onClick={() => handleRemoveTag(index)}
                      >
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
          </>
        ) : (
          <>
            {!submitType ? (
              <div className="choice-prompt">
                <h2>Share Something Cool</h2>
                <p>Choose what you'd like to do:</p>
                <div className="choice-buttons">
                  <button onClick={onLogin} className="choice-button">
                    Log in to Post
                  </button>
                  <button onClick={() => setSubmitType('website')} className="choice-button">
                    Submit a Website/Project
                  </button>
                </div>
                <button onClick={onClose} className="cancel-button">
                  Cancel
                </button>
              </div>
            ) : submitType === 'website' && (
              <div className="website-submission">
                <h2>Submit a Website or Project</h2>
                <form onSubmit={handleWebsiteSubmit}>
                  <div className="form-group">
                    <label htmlFor="website-url">Website URL:</label>
                    <input
                      type="text"
                      id="website-url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="mendel.farm"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="website-description">Description:</label>
                    <textarea
                      id="website-description"
                      value={websiteDescription}
                      onChange={(e) => setWebsiteDescription(e.target.value)}
                      placeholder="Tell us about this website or project..."
                      rows="4"
                      required
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="submit-button">
                      Submit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSubmitType(null)} 
                      className="back-button"
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PostModal;
