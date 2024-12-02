import React, { useState } from "react";
import "../styles/PostPreview.css";

function PostPreview({ post, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.rkey}`);
    alert("Post link copied to clipboard!");
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-title">{post.title}</div>
        <div className="post-menu">
          <button className="menu-button" onClick={toggleMenu}>
            ⋮
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={handleShare}>Share</button>
              {onEdit && (
                <button onClick={() => onEdit(post.collection, post.rkey)}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(post.collection, post.rkey)}>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <pre className="post-description">{post.description}</pre>
      <div className="post-urls">
        {post.urls.map((url, index) => (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ))}
      </div>
      <div className="post-tags">
        {post.tags.map((tag, index) => (
          <span key={index}>#{tag} </span>
        ))}
      </div>
      <div className="post-timestamp">
        <small>Posted {post.time_elapsed} ago</small>
      </div>
    </div>
  );
}

export default PostPreview;