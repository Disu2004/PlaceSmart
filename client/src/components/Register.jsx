// src/pages/Register.jsx
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
  const [status, setStatus] = useState("Please say your role (student, teacher, or admin)...");
  const [role, setRole] = useState("");
  const [captured, setCaptured] = useState(false);
  const [voiceActive, setVoiceActive] = useState(true);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;
  const SECRET_PASSWORD = "This is me";

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        console.log("Face API Models Loaded");
        initVoiceRecognition();
      } catch (err) {
        console.error("Error loading models:", err);
        setStatus("Failed to load face detection models");
      }
    };
    loadModels();
  }, []);

  // Voice Recognition
  const initVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setStatus("Speech Recognition not supported");
      setVoiceActive(false);
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => setStatus("Listening...");
      recognitionRef.current.onerror = () => {
        if (!captured) setTimeout(() => recognitionRef.current.start(), 1000);
      };

      recognitionRef.current.onresult = (event) => {
        if (captured) return;

        const spoken = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Detected role:", spoken);

        if (spoken.includes("student") || spoken.includes("teacher")) {
          const detectedRole = spoken.includes("student") ? "student" : "teacher";
          setRole(detectedRole);
          setStatus(`Role: ${detectedRole}. Starting camera...`);
          recognitionRef.current.stop();
          setTimeout(() => startFaceDetection(detectedRole), 200);
        } else if (spoken.includes("admin")) {
          recognitionRef.current.stop();
          setStatus("Admin detected. Say the secret password...");
          askAdminPassword();
        } else {
          setStatus("Role not recognized, try again...");
          setTimeout(() => recognitionRef.current.start(), 1000);
        }
      };
    }

    recognitionRef.current.start();
  };

  // Admin password
  const askAdminPassword = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const adminRec = new SpeechRecognition();
    adminRec.lang = "en-US";
    adminRec.interimResults = false;

    adminRec.onstart = () => setStatus("Listening for password...");
    adminRec.onresult = (event) => {
      let spokenPassword = event.results[0][0].transcript.toLowerCase().trim();
      spokenPassword = spokenPassword.replace(/\bu\b/g, "you").replace(/\s+/g, " ").trim();

      if (spokenPassword.includes(SECRET_PASSWORD.toLowerCase())) {
        setRole("admin");
        setStatus("Admin verified! Starting camera...");
        setTimeout(() => startFaceDetection("admin"), 200);
      } else {
        setStatus("Incorrect password, try again...");
        setTimeout(() => recognitionRef.current.start(), 1000);
      }
    };

    adminRec.onerror = () => {
      setStatus("Could not hear password, retrying...");
      setTimeout(() => recognitionRef.current.start(), 1000);
    };

    adminRec.start();
  };

  // Manual role fallback
  const handleManualRoleSelect = (selectedRole) => {
    recognitionRef.current?.stop();
    setVoiceActive(false);
    setRole(selectedRole);
    setStatus(`Role selected: ${selectedRole}. Starting camera...`);
    setTimeout(() => startFaceDetection(selectedRole), 300);
  };

  // Face Detection + Descriptor
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
        const desc = Array.from(detection.descriptor); // 128 numbers
        setFaceDescriptor(desc);
        setCaptured(true);
        setStatus("Face detected! Checking identity...");
        await checkExistingUser(desc, detectedRole);
      } else if (!captured) {
        requestAnimationFrame(detect);
      }
    };

    detect();
  };

  // Check if face already exists
  const checkExistingUser = async (descriptor, role) => {
    try {
      const res = await fetch(`${BACKEND_URL}/user/checkface`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Check failed");

      if (data.exists) {
        const user = data.user;
        setImageUrl(user.imageurl);
        setUserId(user.id);
        setStatus(`Welcome back, ${role}!`);
        alert(`Already registered!\nUser ID: ${user.id}`);
        localStorage.setItem("userId", user.id);
        redirectUser(user.id);
        return;
      }

      // New face → capture & upload
      const imageSrc = webcamRef.current.getScreenshot();
      setPreview(imageSrc);
      await uploadNewUser(imageSrc, role, descriptor);
    } catch (err) {
      console.error("Check error:", err);
      setStatus(`Error: ${err.message}`);
    }
  };

  // Upload new user
  const uploadNewUser = async (base64Image, role, descriptor) => {
    try {
      const res = await fetch(`${BACKEND_URL}/user/userdata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          userDesignation: role,
          descriptor,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setImageUrl(data.user.imageurl);
        setUserId(data.user.id);
        setStatus("Registration successful!");
        alert(`New user created!\nUser ID: ${data.user.id}`);
        localStorage.setItem("userId", data.user.id);
        redirectUser(data.user.id);
      } else {
        setStatus(`Upload failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("Network error");
    }
  };

  // Redirect based on ID
  const redirectUser = (id) => {
    const numId = parseInt(id);
    if (numId >= 3000) navigate("/admin-home");
    else if (numId >= 2100) navigate("/teacher-home");
    else navigate("/home");
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Voice + Face Auto Registration</h2>
      <p style={{ fontWeight: "bold", color: "#444", minHeight: "2em" }}>{status}</p>

      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={380}
        videoConstraints={{ facingMode: "user" }}
        style={{
          borderRadius: "16px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
          marginBottom: "1rem",
        }}
      />

      {/* Manual Role Buttons */}
      {!captured && !imageUrl && (
        <div style={{ margin: "1.5rem 0" }}>
          <p style={{ color: "#666" }}>Or select manually:</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {["student", "teacher", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => handleManualRoleSelect(r)}
                style={{
                  backgroundColor:
                    r === "student" ? "#2196f3" : r === "teacher" ? "#4caf50" : "#f44336",
                  color: "white",
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ marginTop: "1rem" }}>
          <p>Captured:</p>
          <img
            src={preview}
            alt="preview"
            width={280}
            style={{ borderRadius: "12px", border: "3px solid #d4af37" }}
          />
        </div>
      )}

      {/* Uploaded */}
      {imageUrl && (
        <div style={{ marginTop: "1rem" }}>
          <p>Stored:</p>
          <img
            src={imageUrl}
            alt="uploaded"
            width={280}
            style={{ borderRadius: "12px", border: "3px solid #d4af37" }}
          />
        </div>
      )}

      {/* User ID */}
      {userId && (
        <div style={{ marginTop: "1.5rem", color: "#2e7d32" }}>
          <h3>User ID: <strong>{userId}</strong></h3>
          <p style={{ fontWeight: "bold", color: "#d4af37" }}>
            Remember this ID for login!
          </p>
        </div>
      )}
    </div>
  );
};

export default Register;