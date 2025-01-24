import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/PostModal.css";

function PostModal({ post, onClose = null, isLoggedIn, onLogin }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const [urls, setUrls] = useState(post ? post.urls : []);
  const [title, setTitle] = useState(post ? post.title : "");
  const [note, setNote] = useState(post ? post.note : "");
  const [tags, setTags] = useState(post ? post.tags : []);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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
    const uploadedKeys = [];

    for (const file of files) {
      // Get a pre-signed URL from the backend
      const response = await fetch(`${API_URL}/generate-presigned-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: file.name,
          file_type: file.type,
        }),
      });

      if (!response.ok) {
        alert(`Failed to get pre-signed URL for file: ${file.name}`);
        setUploading(false);
        return;
      }

      const { url, key } = await response.json();

      // Upload file to S3
      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        alert(`Failed to upload file: ${file.name}`);
        setUploading(false);
        return;
      }

      uploadedKeys.push(key);
    }

    return uploadedKeys;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onClose();
      onLogin();
    }

    setUploading(true);

    const validUrls = urls.filter((url) => url.trim() !== "");
    for (const url of validUrls) {
      if (!isValidURL(url)) {
        alert("Invalid URL: " + url);
        return;
      }
    }

    try {
      const fileKeys = files.length > 0 ? await uploadFilesToS3(files) : [];

      const payload = {
        title,
        note,
        urls: validUrls,
        tags,
        file_keys: fileKeys,
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
              onChange={(e) => setFiles(e.target.files)}
              disabled={uploading}
            />
          </div>
          <div className="form-area">
            <button type="submit" className="submit-button">
              Submit
            </button>
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
