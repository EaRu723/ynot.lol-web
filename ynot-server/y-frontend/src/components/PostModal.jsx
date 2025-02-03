import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/PostModal.css";

function PostModal({ post, onClose = null, isLoggedIn, onLogin }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [urls, setUrls] = useState(post ? post.urls : []);
  const [title, setTitle] = useState(post ? post.title : "");
  const [note, setNote] = useState(post ? post.note : "");
  const [tags, setTags] = useState(post ? post.tags : []);
  const [files, setFiles] = useState([]); // Array of File objects
  const [previews, setPreviews] = useState([]); // Array of preview URLs
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (post) {
      setUrls(post.urls);
      setNote(post.note);
      setTags(post.tags);
    }
  }, [post]);

  // When files state changes, create preview URLs and clean up previous ones
  useEffect(() => {
    // Create preview URLs for all files
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup function to revoke object URLs when files change/unmount
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const extractUrlsAndTags = (text) => {
    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const extractedUrls = [...text.matchAll(urlRegex)].map((match) => match[0]);
    const uniqueUrls = [...new Set(extractedUrls)];

    // Extract Tags
    const tagRegex = /#(\w+)/g;
    const extractedTags = [...text.matchAll(tagRegex)].map((match) => match[1]);
    const uniqueTags = [...new Set(extractedTags)];

    return { urls: uniqueUrls, tags: uniqueTags };
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

  const uploadFilesToS3 = async () => {
    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_URL}/batch-upload-s3`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      alert("File upload failed");
      setUploading(false);
      return [];
    }

    const { file_urls } = await response.json();
    return file_urls; // array of public S3 URLs
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onClose();
      onLogin();
      return;
    }

    setUploading(true);

    const validUrls = urls.filter((url) => url.trim() !== "");
    for (const url of validUrls) {
      if (!isValidURL(url)) {
        alert("Invalid URL: " + url);
        setUploading(false);
        return;
      }
    }

    try {
      const fileUrls = files.length > 0 ? await uploadFilesToS3() : [];

      const payload = {
        title,
        note,
        urls: validUrls,
        tags,
        file_keys: fileUrls,
      };

      const response = await fetch(`${API_URL}/post`, {
        method: post ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(`Post ${post ? "updated" : "created"} successfully`);
        e.target.reset();
        onClose();
        window.location.reload();
      } else {
        alert(
          `Post ${post ? "update" : "creation"} failed: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error(error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleClickOutside = (e) => {
    // Close if clicked outside modal content
    if (e.target.className === "modal-container") {
      onClose();
    }
  };

  // Updated handler for file input change event to append new files
  const handleFileChange = (e) => {
    // Convert FileList to Array
    const selectedFiles = Array.from(e.target.files);
    // Append new files to the existing files state
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    // Optionally, you can clear the input value here if needed:
    e.target.value = "";
  };

  return (
    <div className="modal-container" onClick={handleClickOutside}>
      <div className="modal-view">
        <div>
          <span
            className="close"
            onClick={onClose}
            style={{ cursor: "pointer" }}
          >
            &times;
          </span>
        </div>
        <form id="post-form" onSubmit={handleSubmit}>
          <div className="form-area">
            <textarea
              id="title"
              name="title"
              rows="1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight - 15}px`;
              }}
              placeholder="Title (optional)"
            ></textarea>
          </div>
          <div className="form-area">
            <textarea
              id="note"
              name="note"
              rows="14"
              value={note}
              onChange={handleNoteChange}
              placeholder="Share an article, a video, a website, or whatever's on your mind"
            ></textarea>
          </div>
          <div className="form-area">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          {/* Preview area for selected images */}
          {previews.length > 0 && (
            <div className="previews-container">
              {previews.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`preview-${index}`}
                  className="preview-image"
                />
              ))}
            </div>
          )}
          <div className="form-area">
            {!uploading ? (
              <button type="submit" className="submit-button">
                Submit
              </button>
            ) : (
              <button type="submit" className="submit-button" disabled>
                Uploading...
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

PostModal.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    note: PropTypes.string,
    created_at: PropTypes.string,
    urls: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    file_keys: PropTypes.arrayOf(PropTypes.string),
  }),
  onClose: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  onLogin: PropTypes.func,
};

export default PostModal;
