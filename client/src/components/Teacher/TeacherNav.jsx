import React, { useState, useEffect } from "react";
import "../../CSS/Navbar.css"; // Use your same CSS file

const TeacherNav = () => {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const toggleMenu = () => setOpen(!open);
  const toggleMode = () => setDarkMode(!darkMode);



  const themeClass = darkMode ? "dark" : "light";

  return (
    <div className={`navbar-container navbar-${themeClass}`}>
      {/* Hamburger Button */}
      <button
        className="navbar-hamburger"
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <div />
        <div />
        <div />
      </button>

      {/* Sidebar */}
      {open && (
        <div className="navbar-sidebar" data-aos="fade-right">
          {/* Close Button */}
          <button
            className="navbar-close-btn"
            onClick={toggleMenu}
            aria-label="Close"
          >
            &times;
          </button>

          {/* Teacher Navigation Links */}
          <a href="/teacher-home">  Home</a>
          <a href="/upload-video">Upload Video Lecture</a>
          <a href="/see-doubts">See Doubts</a>
          <a href="/upload-questions">Upload Questions</a>
          <a href="/assignments">Manage Assignments</a>
          <a href="/discussion-forum">Discussion Forum</a>
          <a href="/view-questions">View Questions</a>
          <a
            href="/"
            onClick={() => {
              localStorage.clear();
            }}
          >
            Logout
          </a>
        </div>
      )}
    </div>
  );
};

export default TeacherNav;
