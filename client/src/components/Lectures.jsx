import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import "../CSS/Lectures.css";

const Lectures = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
    });
  }, []);

  const [selectedSubject, setSelectedSubject] = useState('All');

  const playlists = [
    {
      id: 1,
      title: "Complete C++ DSA Course",
      url: "https://www.youtube.com/embed/videoseries?list=PLfqMhTWNBTe137I_EPQd34TsgV6IO55pt",
      description: "Master Data Structures & Algorithms in C++ with this comprehensive playlist.",
      subject: "C++ DSA"
    },
    {
      id: 2,
      title: "Java + DSA + Interview Preparation",
      url: "https://www.youtube.com/embed/videoseries?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ",
      description: "Prepare for FAANG interviews with Java DSA fundamentals and advanced topics.",
      subject: "Java DSA"
    },
    {
      id: 3,
      title: "Python for Beginners (Full Course)",
      url: "https://www.youtube.com/embed/videoseries?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg",
      description: "100 Days of Code challenge to learn Python from scratch.",
      subject: "Python Programming"
    },
    {
      id: 4,
      title: "Full Stack Web Development 2025",
      url: "https://www.youtube.com/embed/videoseries?list=PLEiEAq2VkUULCC3eEATL4zzuapTjmo1Z_",
      description: "Complete guide to front-end and back-end web development.",
      subject: "Web Development"
    },
    {
      id: 5,
      title: "Complete Machine Learning Playlist",
      url: "https://www.youtube.com/embed/videoseries?list=PLZoTAELRMXVPBTrWtJkn3wWQxZkmTXGwe",
      description: "Roadmap to Machine Learning with Python basics to advanced models.",
      subject: "Machine Learning"
    },
    {
      id: 6,
      title: "Operating Systems Complete Playlist",
      url: "https://www.youtube.com/embed/videoseries?list=PLBlnK6fEyqRiVhbXDGLXDk_OQAeuVcp2O",
      description: "In-depth coverage of OS concepts, processes, memory management, and more.",
      subject: "Operating Systems"
    },
    {
      id: 7,
      title: "Computer Networks Complete Playlist",
      url: "https://www.youtube.com/embed/videoseries?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_",
      description: "Master networking from basics to advanced protocols and security.",
      subject: "Computer Networks"
    },
    {
      id: 8,
      title: "DBMS Complete Playlist",
      url: "https://www.youtube.com/embed/videoseries?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y",
      description: "Comprehensive Database Management Systems course covering SQL, normalization, and more.",
      subject: "DBMS"
    },
    {
      id: 9,
      title: "Theory of Computation & Automata Theory",
      url: "https://www.youtube.com/embed/videoseries?list=PLBlnK6fEyqRgp46KUv4ZY69yXmpwKOIev",
      description: "Full course on TOC including finite automata, regular languages, and computability.",
      subject: "Theory of Computation (TOC)"
    },
    {
      id: 10,
      title: "Aptitude Preparation Complete Playlist",
      url: "https://www.youtube.com/embed/videoseries?list=PLMufDeLh5x2CuBcH_y1hmvmwIBgtGxVdv",
      description: "Complete aptitude preparation for placements and exams with quantitative and logical reasoning.",
      subject: "Aptitude"
    },
    {
      id: 11,
      title: "Java Full Course",
      url: "https://www.youtube.com/embed/videoseries?list=PL9ooVrP1hQOEe9EN119lMdwcBxcrBI1D3",
      description: "Step-by-step Java programming tutorial from basics to advanced concepts.",
      subject: "Java Programming"
    }
  ];

  const uniqueSubjects = ['All', ...new Set(playlists.map(p => p.subject))];

  const filteredPlaylists = selectedSubject === 'All' 
    ? playlists 
    : playlists.filter(p => p.subject === selectedSubject);

  return (
    <div className="lectures-container">
      <header className="lectures-header">
        <h1 className="lectures-title">Explore Our Lecture Playlists</h1>
        <p className="lectures-subtitle">
          Dive into comprehensive video lectures across various computer science and engineering subjects. 
          Curated for students, professionals, and lifelong learners. Start your journey today!
        </p>
      </header>
      
      <div className="brave-message">
        <p>Hey cutie! 🦁 Use Brave browser to skip those pesky ads and focus on learning! 💛</p>
      </div>
      
      <div className="filter-section">
        <label htmlFor="subject-filter" className="filter-label">Filter by Subject: </label>
        <select 
          id="subject-filter"
          className="subject-filter"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          {uniqueSubjects.map(subject => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <p className="filter-count">
          Showing {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? 's' : ''} for "{selectedSubject}"
        </p>
      </div>
      
      {filteredPlaylists.length > 0 ? (
        <div className="playlists-grid">
          {filteredPlaylists.map((playlist) => (
            <div 
              key={playlist.id} 
              className="playlist-card"
              data-aos="zoom-in" 
              data-aos-delay={playlist.id * 100}
            >
              <h3 className="playlist-title">
                {playlist.title}
              </h3>
              
              <div className="playlist-embed">
                <iframe
                  src={playlist.url}
                  title={`${playlist.title} Playlist`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              
              <p className="playlist-subject">
                📚 {playlist.subject}
              </p>
              
              <p className="playlist-description">
                {playlist.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No playlists found for "{selectedSubject}". Try another subject!</p>
        </div>
      )}
      
      <footer className="lectures-footer">
        <p>Happy Learning! 🚀 | Total Playlists: {playlists.length}</p>
      </footer>
    </div>
  );
};

export default Lectures;