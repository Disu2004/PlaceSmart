import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./components/Home";
import ResumeBuilder from "./components/ResumeBuilder";
import About from "./components/About";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Login from "./components/Login";
import Register from "./components/Register";
import Study_Material from "./components/Study_Material";
import MyStudyMaterial from "./components/MyStudyMaterial";
function App() {

  const navigate = useNavigate();
  useEffect(() => {
    const excludedPaths = ["/", "/register"];
    if (localStorage.getItem("userId") === null) {
      if (!excludedPaths.includes(window.location.pathname)) {
        navigate("/");
      }
    } else {
      // If logged in and on excluded paths, redirect to home
      if (excludedPaths.includes(window.location.pathname)) {
        navigate("/home");
      }
    }
  }, [navigate]);
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase();
      console.log("Voice command:", command);

      if (command.includes("resume builder") || command.includes("resume") || command.includes("builder")) navigate("/resume-builder");
      else if (command.includes("about")) navigate("/about");
      else if (command.includes("services")) navigate("/services");
      else if (command.includes("contact")) navigate("/contact");
      else if (command.includes("home")) navigate("/home");
      else if (command.includes("my study material")) navigate("/my-study-material");
      else if (command.includes("study material")) navigate("/study-material");
      else if (command.includes("go back")) navigate(-1);
      else if (command.includes("logout") || command.includes("log out")) {
        localStorage.removeItem("userId");
        alert("Logged out successfully");
        navigate("/");
      }
    };

    recognition.start();

    return () => recognition.stop();
  }, [navigate]);

  return (

    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
      <Route path="/resume-builder" element={<ResumeBuilder />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/register" element={<Register />} />
      <Route path="/study-material" element={<Study_Material />} />
      <Route path="/my-study-material" element={<MyStudyMaterial />} />
    </Routes>

  );
}

export default App;
