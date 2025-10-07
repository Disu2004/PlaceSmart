import React, { useState, useEffect } from "react";
import "../CSS/Navbar.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [lightMode, setLightMode] = useState(false);

  const toggleMenu = () => setOpen(!open);
  const toggleMode = () => {
    setDarkMode(!darkMode);
    setLightMode(darkMode);
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
    }
  }, [darkMode, lightMode]);

  const themeClass = darkMode ? "dark" : "light";

  return (
    <div className={`navbar-container navbar-${themeClass}`}>
      <button
        className="navbar-hamburger"
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <div />
        <div />
        <div />
      </button>

      {open && (
        <div className="navbar-sidebar">
          <button
            className="navbar-close-btn"
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
          <button className="navbar-mode-btn" onClick={toggleMode}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
