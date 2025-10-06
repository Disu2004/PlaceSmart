import React, { useState, useEffect } from "react";
import "../CSS/Navbar.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // default black-gold
  const [lightMode, setLightMode] = useState(false);

  const toggleMenu = () => setOpen(!open);

  const toggleMode = () => {
    if (darkMode) {
      setDarkMode(false);
      setLightMode(true);
    } else {
      setDarkMode(true);
      setLightMode(false);
    }
  };

  // Apply theme to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
    } else if (lightMode) {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
    }
  }, [darkMode, lightMode]);

  const themeClass = darkMode ? "dark" : lightMode ? "light" : "";

  return (
    <div className={`navbar-container ${themeClass}`}>
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        <div />
        <div />
        <div />
      </button>

      {open && (
        <div className="sidebar">
          <button
            className="close-btn1"
            onClick={toggleMenu}
            aria-label="Close"
          >
            &times;
          </button>
          <a href="/home">Home</a>
          <a href="/interview-coach">Interview Coach</a>
          <a href="/resume-builder">Resume Builder</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/study-material">Study Material</a>
          <a href="/my-study-material">My Study Material</a>
          <a
            href="/"
            onClick={() => {
              localStorage.clear();
            }}
          >
            Logout
          </a>
          <button className="mode-btn" onClick={toggleMode}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
