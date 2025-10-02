import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

const Register = () => {
  const webcamRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [userId, setUserId] = useState(null);

  // Auto capture after 2s
  useEffect(() => {
    localStorage.removeItem("userId"); // Clear any existing userId
    const timer = setTimeout(() => {
      capture();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPreview(imageSrc);
    uploadImage(imageSrc);
  };

  const uploadImage = async (base64Image) => {
    try {
      const response = await fetch("http://localhost:8000/user/userdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Upload failed:", text);
        return;
      }
      const data = await response.json();
      console.log("Upload success:", data);

      setImageUrl(data.url);
      setUserId(data.userId); // ✅ Save userId from backend response
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Auto Capture & Upload</h2>

      {!preview && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={300}
          videoConstraints={{ facingMode: "user" }}
        />
      )}

      {preview && (
        <div>
          <p>Captured Preview:</p>
          <img src={preview} alt="preview" width="200" />
        </div>
      )}

      {imageUrl && (
        <div style={{ marginTop: "10px" }}>
          <p>Uploaded to Cloudinary:</p>
          <img src={imageUrl} alt="uploaded" width="200" />
        </div>
      )}

      {userId && (
        <div style={{ marginTop: "20px", color: "green" }}>
          <h3>Your User ID: {userId}</h3>
          <p style={{ fontWeight: "bold" }}>
            ⚠️ Please remember this User ID for login!
          </p>
        </div>
      )}
    </div>
  );
};

export default Register;
