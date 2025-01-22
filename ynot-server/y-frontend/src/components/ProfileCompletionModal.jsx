import { useState } from "react";
import PropTypes from "prop-types";
import "../styles/ProfileCompletionModal.css";

const ProfileCompletionModal = ({ user, API_URL, onClose }) => {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);

      // Generate preview
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
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    // Upload files
    const response = await fetch(`${API_URL}/batch-upload-s3`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      alert("Failed to upload files.");
      const res = await response.json();
      console.error(res);
      return [];
    }

    const urls = await response.json();
    console.log(urls);
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    if (!username) {
      alert("Please enter a username before proceeding");
      setUploading(false);
      return;
    }

    try {
      // Collect files to upload
      const filesToUpload = [];
      if (avatar) filesToUpload.push(avatar);
      if (banner) filesToUpload.push(banner);

      let avatarUrl = null;
      let bannerUrl = null;

      // Upload files and map their URLs
      if (filesToUpload.length > 0) {
        const uploadedResponse = await uploadFilesToS3(filesToUpload);
        const uploadedUrls = uploadedResponse.file_urls;

        // Map URLs to avatar and banner
        if (uploadedUrls && uploadedUrls.length > 0) {
          if (avatar) avatarUrl = uploadedUrls[0] || null;
          if (banner) bannerUrl = uploadedUrls[1] || null;
        }
      }

      const payload = {
        username: username.trim(),
        avatar: avatarUrl,
        banner: bannerUrl,
      };

      const response = await fetch(`${API_URL}/user/complete-profile`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Welcome to Y!");
        onClose();
        window.location.href = "/";
      } else {
        alert(`Profile completion failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error(error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Complete your profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group-container">
            <div className="form-group">
              <textarea
                name="username"
                id="username"
                placeholder="Username"
                value={username}
                rows={1}
                onChange={handleUsernameChange}
              ></textarea>
            </div>
            <div className="form-group">
              <label>Avatar:</label>
              {avatarPreview && (
                <div>
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(e, setAvatar, setAvatarPreview)
                }
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label>Banner:</label>
              {bannerPreview && (
                <div>
                  <img
                    src={bannerPreview}
                    alt="Banner Preview"
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(e, setBanner, setBannerPreview)
                }
                disabled={uploading}
              />
            </div>
          </div>
          <div className="form-group">
            <button type="submit" disabled={uploading}>
              {uploading ? "Submitting..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ProfileCompletionModal.propTypes = {
  user: PropTypes.shape({
    avatar: PropTypes.string,
  }),
  API_URL: PropTypes.string,
  onClose: PropTypes.func,
};

export default ProfileCompletionModal;
