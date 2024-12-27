import React, { useState, useRef, useEffect } from 'react';
import PostModal from "./PostModal.jsx";
import '../styles/TimelinePosts.css';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
};

const PostPreview = ({ post, setPosts, isFirstInGroup, apiUrl }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const menuRef = useRef(null); // Ref for the menu dropdown

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    const closeMenu = () => setMenuOpen(false);

    const handleShare = () => {
        if (window?.location?.origin && post?.rkey) {
            navigator.clipboard.writeText(`${window.location.origin}/post/${post.rkey}`);
            alert("Post link copied to clipboard!");
        }
    };

    const handleDelete = async (collection, rkey) => {
        if (!collection || !rkey) return;

        const shouldDelete = window.confirm("Are you sure you want to delete this post?");
        if (!shouldDelete) return;

        try {
            const response = await fetch(`${apiUrl}/post`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ collection, rkey }),
            });

            if (response.ok) {
                alert("Post deleted successfully.");
                setPosts((prevPosts) => prevPosts.filter((p) => p.rkey !== rkey));
            }
        } catch (error) {
            console.error("Delete Post Error:", error);
            alert(`An error occurred: ${error.message || "Unknown error"}`);
        }
    };

    const handleEdit = (post) => {
        if (!post) return;
        setSelectedPost(post);
        setIsEditModalOpen(true);
        closeMenu();
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedPost(null);
    };

    const renderTextWithLinks = (text) => {
        if (!text) return "";
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // Close the menu if the user clicks outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                closeMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <div className="timeline-item">
                <div className="timeline-marker">
                    {isFirstInGroup && (
                        <>
                            <div className="timeline-date">{new Date(post.created_at).toLocaleDateString()}</div>
                            <div className="timeline-dot" />
                        </>
                    )}
                    <div className="timeline-line" />
                </div>

                <div className="post-content">
                    <div className="post-card">
                        <div className="menu-container" ref={menuRef}>
                            {!isEditModalOpen && ( // Conditionally render the menu
                                <>
                                    <button onClick={toggleMenu} className="menu-button">
                                        ⋮
                                    </button>
                                    {menuOpen && (
                                        <div className="menu-dropdown">
                                            <button onClick={handleShare}>Share</button>
                                            <button onClick={() => handleEdit(post)}>Edit</button>
                                            <button
                                                onClick={() => handleDelete(post.collection, post.rkey)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="post-text">
                            <pre>{renderTextWithLinks(post.note)}</pre>
                        </div>

                        <div className="post-tags">
                            {post.tags?.map((tag, index) => (
                                <span key={index} className="tag">
                  #{tag}
                </span>
                            ))}
                        </div>

                        <div className="post-timestamp">{post.time_elapsed}</div>
                    </div>
                </div>
            </div>

            {isEditModalOpen && (
                <PostModal post={selectedPost} onClose={handleCloseEditModal} />
            )}
        </>
    );
};

const TimelinePosts = ({ posts = [], setPosts, apiUrl }) => {
    if (!Array.isArray(posts) || !setPosts || !apiUrl) {
        console.error('Missing required props in TimelinePosts');
        return null;
    }

    const groupPosts = () => {
        if (posts.length === 0) return [];

        const groups = [];
        let currentGroup = [];

        posts.forEach((post, index) => {
            if (!post) return;

            if (index === 0) {
                currentGroup.push(post);
            } else {
                const prevPost = posts[index - 1];
                if (prevPost && post.time_elapsed === prevPost.time_elapsed) {
                    currentGroup.push(post);
                } else {
                    if (currentGroup.length > 0) {
                        groups.push([...currentGroup]);
                    }
                    currentGroup = [post];
                }
            }
        });

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    };

    const postGroups = groupPosts();

    if (postGroups.length === 0) {
        return (
            <div className="no-posts">No posts to display</div>
        );
    }

    return (
        <div className="timeline-container">
            {postGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="post-group">
                    {group.map((post, postIndex) => (
                        <PostPreview
                            key={post?.rkey || `${groupIndex}-${postIndex}`}
                            post={post}
                            setPosts={setPosts}
                            isFirstInGroup={postIndex === 0}
                            apiUrl={apiUrl}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TimelinePosts;