import Header from "./Header.jsx";
import PostModal from "./PostModal.jsx";
import ShowcaseGrid from "./ShowcaseGrid.jsx";
import {useEffect, useState} from "react";
import PostStream from "./PostStream.jsx";

function DiscoverPage({API_URL, isLoggedIn, setIsLoggedIn, userHandle, setUserHandle}) {
    const [isPostModalOpen, setPostModalOpen] = useState(false);
    const [sites, setSites] = useState([]);
    const [tags, setTags] = useState([]);
    const [filteredSites, setFilteredSites] = useState([]);
    const [selectedTags, setSelectedTags] = useState(new Set());

    const filterSites = (tags) => {
        setFilteredSites(
            sites.filter((site) =>
                tags.size === 0 ? true : site.tags.some((tag) => tags.has(tag.name))
            )
        );
    };

    const toggleTag = (tag) => {
        const newTags = new Set(selectedTags);
        if (newTags.has(tag)) newTags.delete(tag);
        else newTags.add(tag);
        setSelectedTags(newTags);
        filterSites(newTags);
    };

    const fetchSites = async () => {
        try {
            const response = await fetch(`${API_URL}/sites`);
            const data = await response.json();
            setSites(data);
            setFilteredSites(data);
        } catch (error) {
            console.error("Error fetching sites:", error);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await fetch(`${API_URL}/tags`);
            const data = await response.json();
            setTags(data);
        } catch (error) {
            console.error("Error fetching tags:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/oauth/logout`, {
                method: "GET",
                credentials: "include",
            });
        } catch (error) {
            console.error("Error logging out:", error);
        } finally {
            setIsLoggedIn(false);
            setUserHandle("");
            sessionStorage.clear();
        }
    };

    useEffect(() => {
        fetchSites();
        fetchTags();
    }, [])

    return (
        <div>
            <Header/>
            <div className="search-and-register">
                <div>
                    {isLoggedIn ? (
                        <div>
                            <a href={`/${userHandle}/profile`}>{userHandle}</a>
                            <button
                                onClick={() => setPostModalOpen(true)}
                                style={{cursor: "pointer"}}
                            >
                                Post
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{cursor: "pointer"}}
                            >
                                Log out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => (window.location.href = `/oauth/login`)}
                            style={{cursor: "pointer"}}
                        >
                            Log in
                        </button>
                    )}
                    {isPostModalOpen && (
                        <PostModal onClose={() => setPostModalOpen(false)}/>
                    )}
                </div>
                <div>
                    <input
                        type="search"
                        placeholder="Search..."
                        onChange={(e) =>
                            setFilteredSites(
                                sites.filter((site) =>
                                    site.name
                                        .toLowerCase()
                                        .includes(e.target.value.toLowerCase())
                                )
                            )
                        }
                    />
                </div>
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
            <div style={{padding: "10px"}}>
                <div>
                    <PostStream />
                </div>
            </div>
            <ShowcaseGrid sites={filteredSites}/>
        </div>
    )
}

export default DiscoverPage;