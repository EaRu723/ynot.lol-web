import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./Header.jsx";
import TimelinePosts from "./TimelinePosts.jsx";
import "../styles/UserProfile.css";

function UserProfile() {
	const { handle } = useParams();
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const API_URL = import.meta.env.VITE_API_BASE_URL;

	useEffect(() => {
		const fetchUserPosts = async () => {
			try {
				const response = await fetch(`${API_URL}/user/${handle}/posts`);
				if (!response.ok) {
					throw new Error("Failed to fetch user posts");
				}
				const data = await response.json();
				setPosts(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchUserPosts();
	}, [handle]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div className="main">
			<Header />
			<div className="profile-info">
				<h1>{handle}'s activity</h1>
				<p className="handle">@{handle}</p>
			</div>
			<div className="posts-header">Posts</div>
			<div className="posts-container">
				<TimelinePosts posts={posts} setPosts={setPosts} apiUrl={API_URL} />
			</div>
		</div>
	);
}

export default UserProfile;
