import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./components/Home";
import ResumeBuilder from "./components/ResumeBuilder";
import About from "./components/About";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Login from "./components/Login";
import Register from "./components/Register";
function App() {
  const navigate = useNavigate();

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

      if (command.includes("resume builder")) navigate("/resume-builder");
      else if (command.includes("about")) navigate("/about");
      else if (command.includes("services")) navigate("/services");
      else if (command.includes("contact")) navigate("/contact");
      else if (command.includes("home")) navigate("/");
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
        <Route path="/register" element={<Register/>}/>
      </Routes>

  );
}

export default App;
