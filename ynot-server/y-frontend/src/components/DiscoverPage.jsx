import ShowcaseGrid from "./ShowcaseGrid.jsx";
import { useEffect, useState } from "react";
import PostStream from "./PostStream.jsx";
import PropTypes from "prop-types";

function DiscoverPage({ API_URL }) {
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
      <ShowcaseGrid sites={sites} />
      <ShowcaseGrid sites={sites} />
      <h2 style={{ marginTop: "40px", textAlign: "left", paddingLeft: "20px" }}>
        People on Y
      </h2>
      <PostStream />
    </div>
  );
}

DiscoverPage.propTypes = {
  API_URL: PropTypes.string,
  isLoggedIn: PropTypes.bool,
};

export default DiscoverPage;
