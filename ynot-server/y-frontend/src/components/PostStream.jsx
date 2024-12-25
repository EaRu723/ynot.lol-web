import React, { useEffect, useRef, useState } from "react";

function PostStream() {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const [posts, setPosts] = useState([]);
    const scrollAreaRef = useRef(null);
    const wsRef = useRef(null);

    const connectWebSocket = () => {
        wsRef.current = new WebSocket("ws://127.0.0.1:8000/api/ws/feed");

        wsRef.current.onmessage = (event) => {
            const post = JSON.parse(event.data);
            if (post.type === "com.y.post") {
                setPosts((prevPosts) => [post.data, ...prevPosts].slice(0, 10));
            }
        };

        wsRef.current.onclose = () => {
            console.log("WebSocket connection closed. Reconnecting...");
            setTimeout(connectWebSocket, 1000);
        };

        wsRef.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            wsRef.current.close();
        };
    };

    useEffect(() => {
        const fetchRecentPosts = async () => {
            try {
                const response = await fetch(`${API_URL}/recent-posts?limit=10`);
                const data = await response.json();
                setPosts(data);

                // Scroll to the top after fetching recent posts
                if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollTop = 0;
                }
            } catch (error) {
                console.error("Error fetching recent posts:", error);
            }
        };

        fetchRecentPosts();
        connectWebSocket(); // Initialize WebSocket connection

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = 0; // Ensure scrolling starts from the top
        }
    }, [posts]);

    return (
        <div
            ref={scrollAreaRef}
            style={{
                height: "500px",
                overflowY: "auto",
                border: "1px solid #ddd",
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
            }}
        >
            <h2 style={{margin: "0 0 15px 0"}}><i>People</i> on Y</h2>
            {posts.map((post, index) => (
                <PostItem key={post.id || index} post={post}/>
            ))}
        </div>
    );
}

function PostItem({post}) {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef(null);

    // Check if content overflows the two-line limit
    useEffect(() => {
        if (textRef.current) {
            const maxHeight = 48; // Approximate max height for two lines (adjust as needed)
            setIsOverflowing(textRef.current.scrollHeight > maxHeight);
        }
    }, [post.note]);

    return (
        <div
            style={{
                padding: "10px",
                marginBottom: "8px",
                borderRadius: "4px",
                backgroundColor: "#fff",
                boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
            }}
        >
            <small style={{margin: "0 0 8px 0", display: "block", color: "#555"}}>@{post.handle}</small>
            <pre
                ref={textRef}
                style={{
                    margin: "0 0 5px 0",
                    overflow: "hidden",
                    whiteSpace: "pre-wrap",
                    textOverflow: "ellipsis",
                    height: expanded ? "auto" : "48px", // Adjust height for two lines
                    position: "relative",
                    transition: "height 0.3s ease",
                }}
            >
                {post.note}
                {!expanded && isOverflowing && (
                    <span
                        style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: "100%",
                            height: "20px",
                            background:
                                "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #fff 100%)",
                        }}
                    />
                )}
            </pre>
            {isOverflowing && (
                <span
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        color: "#007bff",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "block",
                        marginBottom: "5px",
                    }}
                >
                    {expanded ? "Close" : "..."}
                </span>
            )}
            <small style={{color: "#888"}}>
                {new Date(post.created_at).toLocaleString()}
            </small>
        </div>
    );
}

export default PostStream;