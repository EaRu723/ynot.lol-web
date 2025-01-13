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

  const uploadFileToS3 = async (file) => {
    if (!file) return null;

    // Get a pre-signed URL from the backend
    const response = await fetch(`${API_URL}/generate-presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_name: file.name,
        file_type: file.type,
      }),
    });

    if (!response.ok) {
      alert(`Failed to get pre-signed URL for file: ${file.name}`);
      return null;
    }

    const { url, key } = await response.json();

    // Upload file to S3
    const uploadResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      alert(`Failed to upload file: ${file.name}`);
      return null;
    }

    return key;
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
      // Upload avatar and banner if they exist
      const avatarKey = avatar ? await uploadFileToS3(avatar) : null;
      const bannerKey = banner ? await uploadFileToS3(banner) : null;

      // Send the profile completion data to the backend
      const payload = {
        username,
        avatar: avatarKey,
        banner: bannerKey,
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
