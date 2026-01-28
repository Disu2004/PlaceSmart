import React, { useEffect } from "react";
import TeacherNav from "./TeacherNav";
import "../../CSS/TeacherHome.css";
import teachHero from "../../images/teacher-hero.jpg";
import mentor from "../../images/mentor.jpg";
import analytics from "../../images/analytics.jpg";
import Growth from "../../images/Growth.jpg";
import { useNavigate } from "react-router-dom";

const TeacherHome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if(localStorage.getItem("userId") < 2000){
      navigate("/home");
    }

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
        }
      });
    }, observerOptions);

    // Observe all elements with data-aos attribute
    document.querySelectorAll('[data-aos]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [navigate]);

  return (
    <div className="teacher-home">
      <TeacherNav />

      {/* Hero Section */}
      <section className="teacher-hero">
        <div className="hero-content" data-aos="fade-right">
          <h1>Welcome, Educator!</h1>
          <p>
            Empower students, track progress, and inspire learning — all from your teacher dashboard.
          </p>
          <button className="hero-btn">Explore Tools</button>
        </div>
        <div className="hero-image" data-aos="zoom-in">
          <img src={teachHero} alt="Teacher Hero" />
        </div>
      </section>

      {/* Feature Cards */}
      <section className="teacher-features">
        <h2 data-aos="fade-up">Your Smart Teaching Tools</h2>
        <div className="feature-cards">
          <div className="feature-card" data-aos="flip-left">
            <h3>Track Student Progress</h3>
            <p>Monitor student performance with interactive dashboards and analytics.</p>
          </div>
          <div className="feature-card" data-aos="flip-left" data-aos-delay="100">
            <h3>Upload Study Material</h3>
            <p>Upload notes, assignments, and resources directly to your class portal.</p>
          </div>
          <div className="feature-card" data-aos="flip-left" data-aos-delay="200">
            <h3>Schedule Tests</h3>
            <p>Create, manage, and evaluate online assessments with ease.</p>
          </div>
        </div>
      </section>

      {/* Zigzag Sections */}
      <section className="zigzag-section">
        <div className="zigzag-content" data-aos="fade-right">
          <h2>Be a Mentor</h2>
          <p>
            Help students discover their strengths and guide them towards career success with real-time mentoring tools.
          </p>
        </div>
        <div className="zigzag-image" data-aos="fade-left">
          <img src={mentor} alt="Mentorship" />
        </div>
      </section>

      <section className="zigzag-section reverse">
        <div className="zigzag-content" data-aos="fade-left">
          <h2>Analyze, Improve, Inspire</h2>
          <p>
            Get deep insights into class performance, identify gaps, and tailor your teaching approach.
          </p>
        </div>
        <div className="zigzag-image" data-aos="fade-right">
          <img src={analytics} alt="Analytics" />
        </div>
      </section>

      <section className="zigzag-section">
        <div className="zigzag-content" data-aos="fade-right">
          <h2>Inspire Growth</h2>
          <p>
            Motivate your students with achievements, leaderboards, and positive reinforcement.
          </p>
        </div>
        <div className="zigzag-image" data-aos="fade-left">
          <img src={Growth} alt="Growth" />
        </div>
      </section>

      {/* Call To Action */}
      <section className="teacher-cta" data-aos="zoom-in">
        <h2>Start Making a Difference Today</h2>
        <p>
          Join the digital classroom revolution and bring innovation to your teaching journey.
        </p>
        <button className="cta-btn" onClick={() => navigate("/add-assignment")}>
          Go to Dashboard
        </button>
      </section>
    </div>
  );
};

export default TeacherHome;