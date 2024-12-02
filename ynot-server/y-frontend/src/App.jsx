import React, { useState, useEffect } from "react";
import ShowcaseGrid from "./components/ShowcaseGrid";
import LoginModal from "./components/LoginModal";
import "./styles/styles.css";

function App() {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [sites, setSites] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [filteredSites, setFilteredSites] = useState([]);

  const fetchSites = async () => {
    try {
      const response = await fetch(`https://ynot.lol/api/sites`);
      const data = await response.json();
      setSites(data);
      setFilteredSites(data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`https://ynot.lol/api/tags`);
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  useEffect(() => {
    fetchSites();
    fetchTags();
  }, []);

  const toggleTag = (tag) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) newTags.delete(tag);
    else newTags.add(tag);
    setSelectedTags(newTags);
    filterSites(newTags);
  };

  const filterSites = (tags) => {
    setFilteredSites(
      sites.filter((site) =>
        tags.size === 0 ? true : site.tags.some((tag) => tags.has(tag.name))
      )
    );
  };

  return (
    <main>
      <h1>
        Discover cool <i>people</i>.
      </h1>
      <button onClick={() => setLoginModalOpen(true)}>Log In</button>
      {isLoginModalOpen && (
        <LoginModal onClose={() => setLoginModalOpen(false)} />
      )}
      <div>
        <input
          type="search"
          placeholder="Search..."
          onChange={(e) =>
            setFilteredSites(
              sites.filter((site) =>
                site.name.toLowerCase().includes(e.target.value.toLowerCase())
              )
            )
          }
        />
      </div>
      <div className="tag-buttons">
        {tags.map((tag) => (
          <button
            key={tag.name}
            className={`tagButton ${
              selectedTags.has(tag.name) ? "selected" : ""
            }`}
            onClick={() => toggleTag(tag.name)}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <ShowcaseGrid sites={filteredSites} />
    </main>
  );
}

export default App;
