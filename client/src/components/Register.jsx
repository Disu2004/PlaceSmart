import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const Register = () => {
  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("🎤 Please say your role (student, teacher, or admin)...");
  const [role, setRole] = useState("");
  const [captured, setCaptured] = useState(false);
  const navigate = useNavigate();

  // ✅ Single constant for backend URL
  const BACKEND_URL = process.env.BACKEND_URL;
  const SECRET_PASSWORD = "abcd";

  // -------------------------
  // Load Face API models
  // -------------------------
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        console.log("✅ Face API Models Loaded");
        initVoiceRecognition();
      } catch (err) {
        console.error("Error loading models:", err);
        setStatus("❌ Failed to load face detection models");
      }
    };
    loadModels();
  }, []);

  // -------------------------
  // Initialize voice recognition
  // -------------------------
  const initVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setStatus("❌ Speech Recognition not supported in this browser");
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => setStatus("🎤 Listening...");
      recognitionRef.current.onerror = (event) => {
        console.warn("⚠️ Voice error:", event.error);
        if (!captured) setTimeout(() => recognitionRef.current.start(), 1000);
      };

      recognitionRef.current.onresult = (event) => {
        if (captured) return;

        const spoken = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Detected role:", spoken);

        if (spoken.includes("student") || spoken.includes("teacher")) {
          const detectedRole = spoken.includes("student") ? "student" : "teacher";
          setRole(detectedRole);
          setStatus(`✅ Role detected: ${detectedRole}. Starting camera...`);
          recognitionRef.current.stop();
          setTimeout(() => startFaceDetection(detectedRole), 200);
        } else if (spoken.includes("admin")) {
          recognitionRef.current.stop();
          setStatus("🔐 Admin detected. Say the secret password...");
          askAdminPassword();
        } else {
          setStatus("❌ Role not recognized, try again...");
          setTimeout(() => recognitionRef.current.start(), 1000);
        }
      };
    }

    recognitionRef.current.start();
  };

  // -------------------------
  // Admin password check
  // -------------------------
  const askAdminPassword = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const adminRec = new SpeechRecognition();
    adminRec.lang = "en-US";
    adminRec.interimResults = false;
    adminRec.maxAlternatives = 1;

    adminRec.onstart = () => setStatus("🎤 Listening for admin password...");
    adminRec.onresult = (event) => {
      let spokenPassword = event.results[0][0].transcript.toLowerCase().trim();
      spokenPassword = spokenPassword.replace(/\bu\b/g, "you").replace(/\s+/g, " ").trim();

      if (spokenPassword.includes(SECRET_PASSWORD.toLowerCase())) {
        setRole("admin");
        setStatus("✅ Admin verified! Starting camera...");
        setTimeout(() => startFaceDetection("admin"), 200);
      } else {
        setStatus("❌ Incorrect password, try again...");
        setTimeout(() => recognitionRef.current.start(), 1000);
      }
    };

    adminRec.onerror = () => {
      setStatus("⚠️ Could not hear password, retrying...");
      setTimeout(() => recognitionRef.current.start(), 1000);
    };

    adminRec.start();
  };

  // -------------------------
  // Face detection (single capture)
  // -------------------------
  const startFaceDetection = (detectedRole) => {
    const detect = async () => {
      if (!webcamRef.current || captured) return;

      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) {
        requestAnimationFrame(detect);
        return;
      }

      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection && !captured) {
        setCaptured(true);
        setStatus("😀 Face detected! Capturing...");
        capture(detectedRole);
      } else if (!captured) {
        requestAnimationFrame(detect);
      }
    };

    detect();
  };

  // -------------------------
  // Capture image
  // -------------------------
  const capture = (detectedRole) => {
    if (!detectedRole) return setStatus("❌ Role missing, cannot capture");

    const imageSrc = webcamRef.current.getScreenshot();
    setPreview(imageSrc);
    uploadImage(imageSrc, detectedRole);
  };

  // -------------------------
  // Upload image + role
  // -------------------------
  const uploadImage = async (base64Image, detectedRole) => {
    try {
      const res = await fetch(`${BACKEND_URL}/user/userdata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          userDesignation: detectedRole,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setImageUrl(data.user.imageurl);
        setUserId(data.user.id);
        setStatus("✅ Registration successful!");
        alert(`Registration complete ✅\nYour User ID: ${data.user.id}`);
        localStorage.setItem("userId", data.user.id);
        navigate("/home");
      } else {
        setStatus(`❌ Upload failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("⚠️ Network error while uploading");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      <h2>🎤 Voice-Based Auto Registration</h2>
      <p style={{ fontWeight: "bold", color: "#444" }}>{status}</p>

      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={350}
        videoConstraints={{ facingMode: "user" }}
        style={{ borderRadius: "10px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" }}
      />

      {preview && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
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
          <p style={{ fontWeight: "bold" }}>⚠️ Please remember this User ID for login!</p>
        </div>
      )}
    </div>
  );
};

export default Register;
