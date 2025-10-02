import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";

const Login = () => {
  const [status, setStatus] = useState("⏳ Initializing...");
  const webcamRef = useRef(null);
  const processedRef = useRef(false);
  const navigate = useNavigate();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      console.log("✅ Models loaded");
      setStatus("✅ Models ready. Waiting for voice...");
    };
    loadModels();
  }, []);

  // Ask for camera + mic permission as soon as page loads
  useEffect(() => {
    const initPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
        startSpeechRecognition();
      } catch (err) {
        console.error("Permission error:", err);
        setStatus("❌ Camera/Mic permission denied.");
      }
    };

    initPermissions();
  }, []);

  // Initialize speech recognition
  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => setStatus("🎤 Listening...");

    recognition.onresult = async (event) => {
      if (processedRef.current) return;

      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
      }
      fullTranscript = fullTranscript.toLowerCase().trim();
      console.log("Voice command:", fullTranscript);

      // Navigate to register
      if (fullTranscript.includes("new user")) {
        processedRef.current = true;
        recognition.stop();
        navigate("/register");
        return;
      }

      // Detect numbers as userId
      const numberOnly = fullTranscript.replace(/\D/g, "");
      const spokenId = Number(numberOnly);
      if (!isNaN(spokenId) && spokenId !== 0) {
        processedRef.current = true;
        recognition.stop();
        await handleFaceLogin(spokenId);
        console.log("UserID detected:", spokenId);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted")
        console.error("Speech recognition error:", event.error);
      setStatus("❌ Error: " + event.error);
    };

    recognition.onend = () => {
      if (!processedRef.current) recognition.start(); // restart loop
    };

    recognition.start();
  };

  // Handle face login
  const handleFaceLogin = async (userId) => {
    setStatus("🔍 Fetching user image...");
    try {
      const res = await fetch("https://placesmart.onrender.com/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) return setStatus(data.error);

      const cloudImg = await faceapi.fetchImage(data.imageurl);
      const video = webcamRef.current;

      await new Promise((resolve) => {
        if (video.readyState >= 2) resolve();
        else video.onloadeddata = resolve;
      });

      const detectionsCloud = await faceapi
        .detectSingleFace(cloudImg)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const detectionsWebcam = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detectionsCloud || !detectionsWebcam)
        return setStatus("❌ Face not detected");

      const distance = faceapi.euclideanDistance(
        detectionsCloud.descriptor,
        detectionsWebcam.descriptor
      );

      const threshold = 0.6;
      if (distance < threshold) {
        alert("Login successful!");
        localStorage.setItem("userId", userId);
        setStatus("✅ Login successful!");
        navigate("/home");
      } else {
        setStatus("❌ Faces do not match");
      }
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Error verifying face");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔐 Login with Voice + Face</h2>
      <p>{status}</p>
      <video
        ref={webcamRef}
        autoPlay
        muted
        playsInline
        width={320}
        height={240}
        style={{ border: "1px solid black", borderRadius: "8px" }}
      />
    </div>
  );
};

export default Login;
