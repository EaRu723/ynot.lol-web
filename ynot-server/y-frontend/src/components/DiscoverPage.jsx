import ShowcaseGrid from "./ShowcaseGrid.jsx";
import { useEffect, useState } from "react";
import PostStream from "./PostStream.jsx";

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
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          textAlign: "left",
          padding: "0 20 0 20",
          margin: "16px",
          marginLeft: "8px",
        }}
      >
        Discover cool <i>people.</i>
      </h1>
      <ShowcaseGrid sites={sites} />
      <h2 style={{ marginTop: "40px", textAlign: "left", paddingLeft: "20px" }}>
        People on Y
      </h2>
      <PostStream />
    </div>
  );
}

export default DiscoverPage;
