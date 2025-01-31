import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import "../styles/EditProfile.css";

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

function EditProfile({ user, setUser }) {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");

  // We'll store *cropped* images as Blob/File for both avatar and banner
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  // Previews for the cropped images
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [bannerPreview, setBannerPreview] = useState(user?.banner || "");

  // Crop UI states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropAspect, setCropAspect] = useState(1); // Will be set to 1 or 3 below
  const [cropFor, setCropFor] = useState(null); // "avatar" or "banner"
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);

  // We need a ref to the image in the cropping modal to do the final crop
  const imgRef = useRef(null);

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

  // ---- File Handling + Crop Modal Logic ----

  const handleSelectFile = (e, type) => {
    // type is "avatar" or "banner"
    const file = e.target.files?.[0];
    if (!file) return;

    const aspect = type === "avatar" ? 1 : 3;

    // Convert file to data URL to show it in ReactCrop
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

  // Called when the user changes the crop on the UI
  const onCropChange = (c) => {
    setCrop(c);
  };

  // Called when the crop is completed (or user stops dragging)
  const onCropComplete = (c) => {
    setCompletedCrop(c);
  };

  // We store a ref to the underlying image in the modal
  // and set the initial centered crop once it is loaded
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

  // Utility function to crop the image into a new File/Blob
  const getCroppedImg = async (image, crop) => {
    if (!crop || !image) {
      return null;
    }

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Crop dimensions
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
        // Convert blob to a File
        const file = new File([blob], "croppedImage.jpg", { type: blob.type });
        resolve(file);
      }, "image/jpeg");
    });
  };

  // ---- Confirm/Cancel Crop ----

  const handleConfirmCrop = async () => {
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      if (!croppedFile) {
        setShowCropModal(false);
        return;
      }

      // Convert the file to object URL (or base64) for preview
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

  // ---- Upload Logic ----

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
    return file_urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Prepare files for batch upload
      const filesToUpload = [];
      if (avatarFile) filesToUpload.push(avatarFile);
      if (bannerFile) filesToUpload.push(bannerFile);

      let avatarUrl = avatarPreview;
      let bannerUrl = bannerPreview;

      if (filesToUpload.length > 0) {
        const uploadedUrls = await uploadFilesToS3(filesToUpload);
        if (uploadedUrls.length === 1) {
          // Only one file was uploaded
          if (avatarFile) avatarUrl = uploadedUrls[0];
          if (bannerFile) bannerUrl = uploadedUrls[0];
        } else if (uploadedUrls.length >= 2) {
          // Two files: [avatarUrl, bannerUrl]
          if (avatarFile) avatarUrl = uploadedUrls[0];
          if (bannerFile) bannerUrl = uploadedUrls[1];
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

      {/* --- Main Edit Profile --- */}
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
                  objectFit: "cover",
                }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleSelectFile(e, "avatar")}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label>Banner:</label>
            {bannerPreview && (
              <img
                src={bannerPreview}
                alt="Banner Preview"
                style={{
                  width: "100%",
                  height: "auto",
                  marginBottom: "10px",
                  objectFit: "cover",
                }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleSelectFile(e, "banner")}
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
    </>
  );
}

EditProfile.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    username: PropTypes.string,
    bio: PropTypes.string,
    avatar: PropTypes.string,
    banner: PropTypes.string,
  }),
  setUser: PropTypes.func,
};

export default EditProfile;
