import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import TimelinePosts from "./TimelinePosts.jsx";
import "../styles/UserProfile.css";
import Linkify from "react-linkify";

function UserProfile({ isLoggedIn, userHandle }) {
  const { handle } = useParams();
  const [searchParams] = useSearchParams();
  const rkey = searchParams.get("rkey");
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('activity');
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileResponse = await fetch(
          `${API_URL}/user/${handle}/profile`,
        );
        if (!profileResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);

        const postsResponse = await fetch(`${API_URL}/user/${handle}/posts`);
        if (!postsResponse.ok) {
          throw new Error("Failed to fetch user posts");
        }
        const postsData = await postsResponse.json();
        setPosts(postsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [handle, API_URL]);

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  // Add this function to group posts by date
  const groupPostsByDate = (posts) => {
    return posts.reduce((groups, post) => {
      const date = new Date(post.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(post);
      return groups;
    }, {});
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/oauth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Redirect to home page after logout
        navigate('/');
        window.location.reload(); // Refresh to update auth state
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const groupedPosts = groupPostsByDate(posts);

  return (
    <div className="main">
      <div
        className="profile-banner"
        style={{ backgroundImage: `url(${profile.banner})` }}
      >
        <div className="profile-avatar">
          <img src={profile.avatar} alt={`${handle}'s avatar`} />
        </div>
      </div>
      <div className="profile-info">
        <h1>{profile.display_name || handle}</h1>
        <p className="handle">@{handle}</p>
        <p className="bio">
          <Linkify>{profile.bio}</Linkify>
        </p>
        
        {/* Add profile actions for logged-in user viewing their own profile */}
        {isLoggedIn && userHandle === handle && (
          <div className="profile-actions">
            <button 
              onClick={() => navigate('/settings')} 
              className="profile-action-btn"
            >
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="profile-action-btn logout"
            >
              Log out
            </button>
          </div>
        )}
      </div>
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${activeView === 'activity' ? 'active' : ''}`}
          onClick={() => handleViewChange('activity')}
        >
          Activity
        </button>
        <button 
          className={`toggle-btn ${activeView === 'likes' ? 'active' : ''}`}
          onClick={() => handleViewChange('likes')}
        >
          Likes
        </button>
        <button 
          className={`toggle-btn ${activeView === 'favorites' ? 'active' : ''}`}
          onClick={() => handleViewChange('favorites')}
        >
          Favorites
        </button>
        {isLoggedIn && userHandle === handle && (
          <button 
            className={`toggle-btn ${activeView === 'private' ? 'active' : ''}`}
            onClick={() => handleViewChange('private')}
          >
            Private
          </button>
        )}
      </div>
      <div className="posts-by-date">
        {Object.entries(groupedPosts).map(([date, datePosts]) => (
          <div key={date} className="date-group">
            <h2 className="date-header">{date}</h2>
            <div className="posts-grid">
              <TimelinePosts
                posts={datePosts}
                setPosts={setPosts}
                apiUrl={API_URL}
                isLoggedIn={isLoggedIn}
                userHandle={userHandle}
                rkey={rkey}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserProfile;
