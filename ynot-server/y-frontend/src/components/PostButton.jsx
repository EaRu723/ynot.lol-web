import { useState } from "react";
import PostModal from "./PostModal";
import PropTypes from "prop-types";
import "../styles/PostButton.css";
import { useNavigate } from "react-router-dom";

function PostButton({ isLoggedIn }) {
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (isLoggedIn) {
      setPostModalOpen(true);
    } else {
      navigate("/oauth/login");
    }
  };

  return (
    <div>
      <button onClick={handleButtonClick} className="post-button">
        +
      </button>
      {isPostModalOpen && <PostModal onClose={() => setPostModalOpen(false)} />}
    </div>
  );
}

PostButton.propTypes = {
  isLoggedIn: PropTypes.bool,
};

export default PostButton;
