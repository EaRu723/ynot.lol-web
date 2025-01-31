import { useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import "../styles/ProfileCompletionModal.css";

// Helper to center the crop box with a given aspect ratio
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%", // Use percentage-based crop
        width: 50, // Adjust to control the initial size of the crop box
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const ProfileCompletionModal = ({ user, API_URL, onClose }) => {
  // Profile fields
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Cropped Files
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  // Previews for the cropped images
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Crop UI states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropAspect, setCropAspect] = useState(1); // 1 or 3 below
  const [cropFor, setCropFor] = useState(null); // "avatar" or "banner"
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);

  const imgRef = useRef(null);

  const [uploading, setUploading] = useState(false);

  // --- Profile Field Handlers ---
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleDisplayNameChange = (e) => {
    setDisplayName(e.target.value);
  };

  // --- Replicate "handleSelectFile" logic from EditProfile ---
  const handleSelectFile = (e, type) => {
    // type is "avatar" or "banner"
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine aspect ratio: 1:1 for avatar, 3:1 for banner (adjust as needed)
    const aspect = type === "avatar" ? 1 : 3;

    // Convert file to data URL for ReactCrop
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImageSrc(reader.result);
      setShowCropModal(true);
      setCropFor(type);
      setCropAspect(aspect);

      // Reset any existing crop so onImageLoaded can set a new centered one
      setCrop(null);
      setCompletedCrop(null);
    });
    reader.readAsDataURL(file);
  };

  // --- ReactCrop handlers ---
  const onCropChange = (c) => {
    setCrop(c);
  };

  const onCropComplete = (c) => {
    setCompletedCrop(c);
  };

  const onImageLoaded = useCallback(
    (img) => {
      imgRef.current = img;
      if (img && cropAspect) {
        const { width, height } = img;
        const newCrop = centerAspectCrop(width, height, cropAspect);
        setCrop(newCrop);
      }
    },
    [cropAspect],
  );

  // --- Utility to get a cropped File from the final crop box ---
  const getCroppedImg = async (image, crop) => {
    if (!crop || !image) {
      return null;
    }

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], "croppedImage.jpg", { type: blob.type });
        resolve(file);
      }, "image/jpeg");
    });
  };

  // --- Confirm/Cancel in Crop Modal ---
  const handleConfirmCrop = async () => {
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      if (!croppedFile) {
        setShowCropModal(false);
        return;
      }

      // Convert the file to an object URL for preview
      const previewUrl = URL.createObjectURL(croppedFile);

      if (cropFor === "avatar") {
        setAvatarFile(croppedFile);
        setAvatarPreview(previewUrl);
      } else {
        setBannerFile(croppedFile);
        setBannerPreview(previewUrl);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Could not crop image. Please try again.");
    } finally {
      setShowCropModal(false);
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
  };

  // --- Upload Logic (similar to EditProfile) ---
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
      alert("Failed to upload files.");
      const res = await response.json();
      console.error(res);
      return [];
    }

    return response.json(); // { file_urls: [...] }
  };

  // --- Final Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    if (!username) {
      alert("Please enter a username before proceeding");
      setUploading(false);
      return;
    }

    try {
      // Collect cropped files to upload
      const filesToUpload = [];
      if (avatarFile) filesToUpload.push(avatarFile);
      if (bannerFile) filesToUpload.push(bannerFile);

      let avatarUrl = null;
      let bannerUrl = null;

      // Upload files and map their URLs
      if (filesToUpload.length > 0) {
        const uploadedResponse = await uploadFilesToS3(filesToUpload);
        const uploadedUrls = uploadedResponse.file_urls; // from your backend JSON

        if (uploadedUrls && uploadedUrls.length > 0) {
          if (avatarFile) avatarUrl = uploadedUrls[0] || null;
          if (bannerFile) bannerUrl = uploadedUrls[1] || null;
        }
      }

      // Construct payload
      const payload = {
        username: username.trim(),
        displayName: displayName.trim(),
        avatar: avatarUrl,
        banner: bannerUrl,
      };

      // Complete the user’s profile
      const response = await fetch(`${API_URL}/user/complete-profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
    <>
      {/* --- Crop Modal --- */}
      {showCropModal && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-content">
            {cropImageSrc && (
              <ReactCrop
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropComplete}
                aspect={cropAspect}
              >
                <img
                  src={cropImageSrc}
                  alt="Crop"
                  onLoad={(e) => onImageLoaded(e.currentTarget)}
                  style={{ maxHeight: "60vh" }}
                />
              </ReactCrop>
            )}
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              <button
                onClick={handleCancelCrop}
                className="button"
                style={{
                  marginRight: "1rem",
                  color: "#ff4444",
                  backgroundColor: "#fcf7f7",
                  borderColor: "#ff4444",
                }}
              >
                Cancel
              </button>
              <button onClick={handleConfirmCrop} className="button">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Profile Completion Modal --- */}
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
                <textarea
                  name="displayname"
                  id="displayname"
                  placeholder="Display Name"
                  value={displayName}
                  rows={1}
                  onChange={handleDisplayNameChange}
                ></textarea>
              </div>

              {/* Avatar Field */}
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
                        objectFit: "cover",
                        marginBottom: "10px",
                      }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSelectFile(e, "avatar")}
                  disabled={uploading}
                />
              </div>

              {/* Banner Field */}
              <div className="form-group">
                <label>Banner:</label>
                {bannerPreview && (
                  <div>
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      style={{
                        width: "100%",
                        height: "auto",
                        marginBottom: "10px",
                      }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSelectFile(e, "banner")}
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-group">
              <button type="submit" disabled={uploading}>
                {uploading ? "Submitting..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
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
