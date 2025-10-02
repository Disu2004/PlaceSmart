import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";

const Login = () => {
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState(""); // show live speech
  const [started, setStarted] = useState(false); // overlay control
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
    };
    loadModels();
  }, []);

  // Initialize recognition + camera after first tap
  const initPermissions = () => {
    // ==== CAMERA START ====
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        webcamRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setStatus("❌ Camera not allowed");
      });

    // ==== SPEECH START ====
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
      let liveTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        liveTranscript += event.results[i][0].transcript + " ";
      }
      setTranscript(liveTranscript); // show live speech

      if (processedRef.current) return;

      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      finalTranscript = finalTranscript.toLowerCase().trim();
      if (!finalTranscript) return;

      console.log("Voice command:", finalTranscript);

      if (finalTranscript.includes("new user")) {
        processedRef.current = true;
        recognition.stop();
        navigate("/register");
        return;
      }

      const numberOnly = finalTranscript.replace(/\D/g, "");
      const spokenId = Number(numberOnly);
      if (!isNaN(spokenId) && spokenId !== 0) {
        processedRef.current = true;
        await handleFaceLogin(spokenId);
        recognition.stop();
        console.log("UserID detected:", spokenId);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted")
        console.error("Speech recognition error:", event.error);
      setStatus("❌ Error occurred");
    };

    recognition.onend = () => {
      if (!processedRef.current) recognition.start();
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

      if (!detectionsCloud || !detectionsWebcam) {
        setStatus("❌ Face not detected, please try again.");
        processedRef.current = false;
        return await handleFaceLogin(userId); // restart scanning
      }

      console.time("Face comparison");
      const distance = faceapi.euclideanDistance(
        detectionsCloud.descriptor,
        detectionsWebcam.descriptor
      );
      console.timeEnd("Face comparison");

      const threshold = 0.6;
      if (distance < threshold) {
        alert("Login successful!");
        localStorage.setItem("userId", userId);
        setStatus("✅ Login successful!");
        navigate("/home");
      } else setStatus("❌ Faces do not match");
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Error verifying face");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Fullscreen overlay (tap once) */}
      {!started && (
        <div
          onClick={() => {
            setStarted(true);
            initPermissions();
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            zIndex: 9999,
            cursor: "pointer",
          }}
        >
          👆 Tap to Start
        </div>
      )}

      <h2>🔐 Login with UserID</h2>
      <p>{status}</p>
      <p><b>🗣 You said:</b> {transcript}</p>
      <video
        ref={webcamRef}
        autoPlay
        muted
        width={320}
        height={240}
        style={{ border: "1px solid black", borderRadius: "8px" }}
      />
    </div>
  );
};

export default Login;
