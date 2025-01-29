import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/EditProfile.css";
import PropTypes from "prop-types";

function EditProfile({ user, setUser }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [bannerPreview, setBannerPreview] = useState(user?.banner || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setAvatarPreview(user.avatar || "");
      setBannerPreview(user.banner || "");
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFilesToS3 = async (files) => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_URL}/batch-upload-s3`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("File upload error:", error);
      throw new Error("Failed to upload files.");
    }

    const { file_urls } = await response.json();
    console.log("uploaded:", file_urls);
    return file_urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Prepare files for batch upload
      const filesToUpload = [];
      if (avatar) filesToUpload.push(avatar);
      if (banner) filesToUpload.push(banner);

      let avatarUrl = avatarPreview;
      let bannerUrl = bannerPreview;

      if (filesToUpload.length > 0) {
        const uploadedUrls = await uploadFilesToS3(filesToUpload);
        if (uploadedUrls.length == 1) {
          if (avatar) avatarUrl = uploadedUrls[0];
          if (banner) bannerUrl = uploadedUrls[0];
        } else if (uploadedUrls.length > 0) {
          if (avatar) avatarUrl = uploadedUrls[0];
          if (banner) bannerUrl = uploadedUrls[1];
        }
      }

      const payload = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
        bannerUrl,
      };

      const response = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Profile updated successfully!");
        const updatedUser = {
          ...user,
          displayName,
          bio,
          avatar: avatarUrl,
          banner: bannerUrl,
        };
        setUser(updatedUser);
        navigate(`/user/${user.username}`);
      } else {
        const error = await response.json();
        alert(`Failed to update profile: ${error.message || "unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <h1>Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="display_name">Display Name:</label>
          <textarea
            id="display_name"
            rows="1"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">Bio:</label>
          <textarea
            id="bio"
            rows="4"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          ></textarea>
        </div>
        <div className="form-group">
          <label>Avatar:</label>
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar Preview"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                marginBottom: "10px",
              }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, setAvatar, setAvatarPreview)}
            disabled={uploading}
          />
        </div>
        <div className="form-group">
          <label>Banner:</label>
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Banner Preview"
              style={{ width: "100%", height: "auto", marginBottom: "10px" }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, setBanner, setBannerPreview)}
            disabled={uploading}
          />
        </div>
        <div className="form-group">
          <button type="submit" className="button" disabled={uploading}>
            {uploading ? "Saving..." : "Save"}
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
