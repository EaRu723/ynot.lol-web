import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function PostStream() {
	const API_URL = import.meta.env.VITE_API_BASE_URL;
	const WS_URL = import.meta.env.VITE_WEBSOCKET_BASE_URL;
	const [posts, setPosts] = useState([]);
	const scrollAreaRef = useRef(null);
	const wsRef = useRef(null);

	const connectWebSocket = () => {
		wsRef.current = new WebSocket(WS_URL + "/api/ws/feed");

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
			<h2 style={{ margin: "0 0 15px 0" }}>
				<i>People</i> on Y
			</h2>
			{posts.map((post, index) => (
				<PostItem key={post.id || index} post={post} />
			))}
		</div>
	);
}

function PostItem({ post }) {
	const [expanded, setExpanded] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const [contentHeight, setContentHeight] = useState("auto");
	const textRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (textRef.current) {
			const maxHeight = 72; // Approximate height for three lines
			if (textRef.current.scrollHeight > maxHeight) {
				setIsOverflowing(true);
				setContentHeight(`${maxHeight}px`);
			} else {
				setIsOverflowing(false);
				setContentHeight("auto"); // Fit the content
			}
		}
	}, [post.note]);

	// Function to parse text and make URLs clickable
	const renderTextWithLinks = (text) => {
		const urlRegex = /(https?:\/\/[^\s]+)/g; // Regex to match URLs
		const parts = text.split(urlRegex);

		return parts.map((part, index) => {
			if (urlRegex.test(part)) {
				return (
					<a
						key={index}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: "#007bff", textDecoration: "underline" }}
						onClick={(e) => e.stopPropagation()}
					>
						{part}
					</a>
				);
			}
			return part;
		});
	};

	const handlePostClick = () => {
		navigate(`${post.handle}/profile/?rkey=${post.rkey}`);
	};

	return (
		<div
			onClick={handlePostClick}
			style={{
				padding: "10px",
				marginBottom: "8px",
				borderRadius: "4px",
				backgroundColor: "#fff",
				boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
				cursor: "pointer",
			}}
		>
			<small
				onClick={handlePostClick}
				style={{ margin: "0 0 8px 0", display: "block", color: "#555" }}
			>
				@{post.handle}
			</small>
			<pre
				ref={textRef}
				style={{
					margin: "0 0 5px 0",
					overflow: "hidden",
					whiteSpace: "pre-wrap",
					textOverflow: "ellipsis",
					height: expanded ? "auto" : contentHeight, // Dynamic height
					position: "relative",
					transition: "height 0.3s ease",
				}}
			>
				{renderTextWithLinks(post.note)}
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
					onClick={(e) => {
						setExpanded(!expanded);
						e.stopPropagation();
					}}
					style={{
						color: "#007bff",
						fontSize: "12px",
						cursor: "pointer",
						display: "block",
						marginBottom: "5px",
					}}
				>
					{expanded ? "Collapse" : "Expand"}
				</span>
			)}
			<small style={{ color: "#888" }}>
				{new Date(post.created_at).toLocaleString()}
			</small>
		</div>
	);
}

export default PostStream;
