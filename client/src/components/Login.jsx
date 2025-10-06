import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import AOS from "aos";
import "aos/dist/aos.css";
import "../CSS/form.css";

const Login = () => {
  const [status, setStatus] = useState("⏳ Loading models...");
  const [transcript, setTranscript] = useState(""); // live speech
  const [started, setStarted] = useState(false); // overlay
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const webcamRef = useRef(null);
  const processedRef = useRef(false);
  const navigate = useNavigate();

  // Show voices in console
  useEffect(() => {
    speechSynthesis.onvoiceschanged = () => {
      console.log("Available voices:", speechSynthesis.getVoices());
    };
  }, []);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("✅ Models loaded");
        setStatus("✅ Models loaded. Tap to start.");
        setModelsLoaded(true);
      } catch (err) {
        console.error("❌ Error loading models:", err);
        setStatus("❌ Failed to load models");
      }
    };
    loadModels();
  }, []);

  // Init AOS animations
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const speakWelcome = () => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(
      "Hi, welcome to PlaceSmart. If you are a new user, please say 'new user'. Otherwise, speak your login ID."
    );
    const voices = synth.getVoices();
    const indianVoice = voices.find((voice) => voice.lang === "hi-IN");
    if (indianVoice) utterance.voice = indianVoice;
    utterance.rate = 1;
    utterance.pitch = 1;
    synth.speak(utterance);
  };

  const initPermissions = () => {
    if (!modelsLoaded) {
      alert("⚠️ Models are still loading. Please wait...");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        webcamRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setStatus("❌ Camera not allowed");
      });

    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      setTranscript(liveTranscript);

      if (processedRef.current) return;

      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
      }
      finalTranscript = finalTranscript.toLowerCase().trim();
      if (!finalTranscript) return;

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
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") console.error("Speech recognition error:", event.error);
      setStatus("❌ Error occurred");
    };

    recognition.onend = () => {
      if (!processedRef.current) recognition.start();
    };

    recognition.start();
  };

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
        return await handleFaceLogin(userId);
      }

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
      } else setStatus("❌ Faces do not match");
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Error verifying face");
    }
  };

  return (
    <div>
      {!modelsLoaded && (
        <div className="loader-wrapper">
          <span className="loader-letter">L</span>
          <span className="loader-letter">O</span>
          <span className="loader-letter">A</span>
          <span className="loader-letter">D</span>
          <span className="loader-letter">I</span>
          <span className="loader-letter">N</span>
          <span className="loader-letter">G</span>
          <div className="loader"></div>
        </div>
      )}

      {modelsLoaded && !started && (
        <div
          className="start-overlay"
          data-aos="fade-in"
        >
          <div className="instruction-box">
            <h2>👋 Welcome to PlaceSmart</h2>
            <p>
              Please follow the steps below to log in:
            </p>
            <ol>
              <li>Allow camera & microphone permissions.</li>
              <li>If you are a new user, say <b>"new user"</b>.</li>
              <li>If you already have an account, speak your login ID.</li>
              <li>Face verification will start automatically.</li>
            </ol>
            <button
              className="close-btn"
              onClick={() => {
                setStarted(true);
                speakWelcome();
                initPermissions();
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}


      {modelsLoaded && (
        <div className="login-container" data-aos="zoom-in">
          <h2>🔐 Login with UserID</h2>
          <p className="status-text">{status}</p>
          <p className="transcript-text"><b>🗣 You said:</b> {transcript}</p>
          <video
            ref={webcamRef}
            autoPlay
            muted
            width={320}
            height={240}
            className="webcam-video"
          />
        </div>
      )}
    </div>
  );
};

export default Login;
