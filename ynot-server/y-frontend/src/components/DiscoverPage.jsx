import ShowcaseGrid from "./ShowcaseGrid.jsx";
import { useEffect, useState } from "react";
import PostStream from "./PostStream.jsx";
import PropTypes from "prop-types";
import PostButton from "./PostButton.jsx";

function DiscoverPage({ API_URL, isLoggedIn }) {
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
      <PostStream />
      <ShowcaseGrid sites={sites} />
      <div>
        <PostButton isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}

DiscoverPage.propTypes = {
  API_URL: PropTypes.string,
  isLoggedIn: PropTypes.bool,
};

export default DiscoverPage;
