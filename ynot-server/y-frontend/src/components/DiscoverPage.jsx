import PostModal from "./PostModal.jsx";
import ShowcaseGrid from "./ShowcaseGrid.jsx";
import { useEffect, useState } from "react";
import PostStream from "./PostStream.jsx";
import PropTypes from "prop-types";

function DiscoverPage({ API_URL, isLoggedIn }) {
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [sites, setSites] = useState([]);

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_URL}/sites`);
      const data = await response.json();
      setSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return (
    <div>
      <div style={{ padding: "10px", marginTop: "15px" }}>
        {isLoggedIn && (
          <button
            onClick={() => setPostModalOpen(true)}
            style={{ cursor: "pointer" }}
          >
            Post
          </button>
        )}
        {isPostModalOpen && (
          <PostModal onClose={() => setPostModalOpen(false)} />
        )}
      </div>
      <PostStream />
      <ShowcaseGrid sites={sites} />
    </div>
  );
}

DiscoverPage.propTypes = {
  API_URL: PropTypes.string,
  isLoggedIn: PropTypes.bool,
};

export default DiscoverPage;
