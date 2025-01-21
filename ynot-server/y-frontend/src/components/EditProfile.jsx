import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/EditProfile.css";
import PropTypes from "prop-types";

function EditProfile({ user, setUser }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  // Initialize state with user data
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");

  // State to store the original user data for comparison
  const [originalData, setOriginalData] = useState({});

  // Sync component state with user prop
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setAvatar(user.avatar || "");
      setBanner(user.banner || "");
      setOriginalData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        banner: user.banner || "",
      });
    } else {
      navigate("/login"); // Redirect to login if user is not authenticated
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if at least one field is different before submitting
    if (
      displayName === originalData.displayName &&
      bio === originalData.bio &&
      avatar === originalData.avatar &&
      banner === originalData.banner
    ) {
      alert("No changes detected. Please update at least one field.");
      return;
    }

    const payload = {
      display_name: displayName || null, // Send null if the field is empty
      bio: bio || null,
      avatar: avatar || null,
      banner: banner || null,
    };

    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Profile updated successfully!");

        // Update the user object globally using setUser
        const updatedUser = {
          ...user,
          displayName: displayName || user.displayName,
          bio: bio || user.bio,
          avatar: avatar || user.avatar,
          banner: banner || user.banner,
        };
        setUser(updatedUser);

        // Update original data to match the new state
        setOriginalData({ displayName, bio, avatar, banner });
      } else {
        const errorData = await response.json();
        alert(
          `Failed to update profile: ${errorData.detail || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Settings</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="display_name">Display Name:</label>
          <input
            type="text"
            id="display_name"
            name="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">Bio:</label>
          <textarea
            id="bio"
            name="bio"
            rows="4"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="avatar">Avatar URL:</label>
          <input
            type="text"
            id="avatar"
            name="avatar"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="banner">Banner URL:</label>
          <input
            type="text"
            id="banner"
            name="banner"
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
          />
        </div>
        <div className="form-group">
          <button type="submit" className="button">
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
}

EditProfile.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    bio: PropTypes.string,
    avatar: PropTypes.string,
    banner: PropTypes.string,
  }),
  setUser: PropTypes.func,
};

export default EditProfile;
