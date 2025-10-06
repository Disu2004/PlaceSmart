import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const Register = () => {
  const webcamRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState("⏳ Initializing...");
  const navigate = useNavigate();

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setStatus("✅ Models loaded. Please look into the camera...");
        startFaceDetection();
      } catch (err) {
        console.error("Error loading models:", err);
        setStatus("❌ Failed to load models");
      }
    };
    loadModels();
  }, []);

  // Detect face and capture automatically
  const startFaceDetection = () => {
    const interval = setInterval(async () => {
      if (!webcamRef.current) return;
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setStatus("😀 Face detected, capturing...");
        clearInterval(interval);
        capture();
      } else {
        setStatus("🔍 Looking for face...");
      }
    }, 1000);
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPreview(imageSrc);
    uploadImage(imageSrc);
  };

  const uploadImage = async (base64Image) => {
    try {
      const response = await fetch("https://placesmart.onrender.com/user/userdata", {
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
      setUserId(data.userId);

      alert("Registration successful ✅");
      alert("Please note down your User ID: " + data.user.id);

      navigate("/");
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      <h2>📸 Auto Face Capture</h2>
      <p>{status}</p>

      {!preview && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={350}
          videoConstraints={{ facingMode: "user" }}
          style={{ borderRadius: "10px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}
        />
      )}

      {preview && (
        <div style={{ textAlign: "center" }}>
          <p>Captured Preview:</p>
          <img src={preview} alt="preview" width="250" style={{ borderRadius: "10px" }} />
        </div>
      )}

      {imageUrl && (
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <p>Uploaded Image:</p>
          <img src={imageUrl} alt="uploaded" width="250" style={{ borderRadius: "10px" }} />
        </div>
      )}

      {userId && (
        <div style={{ marginTop: "20px", color: "green", textAlign: "center" }}>
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
