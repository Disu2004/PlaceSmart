import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "../CSS/About.css";
import Navbar from "./Navbar";
import TusharImage from "../images/Tushar.jpg";
import DishantImage from "../images/Dishant.jpg";
import PratikImage from "../images/Pratik.jpg"
const About = () => {
  useEffect(() => {
    AOS.init({ duration: 1200, once: false, easing: "ease-in-out" });
  }, []);

  return (
    <>
      <Navbar />
      <div className="about-container">
        {/* 🌄 hero-about Section */}
        <section className="hero-about-section">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80"
            alt="About hero-about"
            className="hero-about-image"
          />
          <div className="hero-about-overlay" />
          <div className="hero-about-text" data-aos="fade-up">
            <h1>About Our Project</h1>
            <p>
              Empowering innovation through collaboration, creativity, and
              cutting-edge technology — built with passion and purpose.
            </p>
          </div>
        </section>

        {/* 👥 Team Section */}
        <section className="team-section" data-aos="fade-up">
          <h2>Meet Our Team</h2>
          <div className="team-container">
            {[
              {
                name: "Dishant Upadhyay",
                role: "CEO",
                img: DishantImage,
              },
              {
                name: "Tushar Parmar",
                role: "Manager & Assistant",
                img: TusharImage,
              },
              {
                name: "Pratik Chauhan",
                role: "Mentor & Guide",
                img: PratikImage,
              },
            ].map((member, i) => (
              <div className="team-card" key={i} data-aos="zoom-in">
                <img src={member.img} alt={member.name} />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 💫 Vision Section */}
        <section className="vision-section" data-aos="fade-up">
          <h2>Our Vision</h2>
          <p>
            To become a leading force in technological innovation — delivering
            reliable, human-centered solutions that inspire trust and creativity
            across industries.
          </p>
          <div className="vision-points">
            <div className="vision-card" data-aos="fade-right">
              <h3>💡 Inspire</h3>
              <p>
                Encouraging creative minds to think beyond boundaries and shape
                the future of technology.
              </p>
            </div>
            <div className="vision-card" data-aos="fade-up">
              <h3>🚀 Innovate</h3>
              <p>
                Pushing the limits of AI, data, and design to build intelligent
                and scalable systems.
              </p>
            </div>
            <div className="vision-card" data-aos="fade-left">
              <h3>🌍 Impact</h3>
              <p>
                Making meaningful contributions that create lasting positive
                change in people's lives.
              </p>
            </div>
          </div>
        </section>

        {/* 🏆 Achievements Section */}
        <section className="achievements-section" data-aos="fade-up">
          <h2>Our Achievements</h2>
          <ul>
            <li data-aos="fade-right">
              🏅 Developed an intelligent movie recommendation system integrating
              AI and NLP.
            </li>
            <li data-aos="fade-left">
              💻 Built multiple web applications with responsive, modern design
              principles.
            </li>
            <li data-aos="fade-right">
              ⚙️ Implemented advanced ML algorithms — CNN, SVD, and collaborative
              filtering.
            </li>
            <li data-aos="fade-left">
              🤝 Collaborated across disciplines to bring design and engineering
              together seamlessly.
            </li>
          </ul>
        </section>

        {/* 🧠 Technologies Section */}
        <section className="tech-section" data-aos="fade-up">
          <h2>Technologies We Use</h2>
          <div className="tech-logos">
            {[
              "React",
              "Node.js",
              "MongoDB",
              "Express",
              "TensorFlow",
              "OpenCV",
              "Python",
            ].map((tech, i) => (
              <span className="tech-chip" data-aos="zoom-in" key={i}>
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default About;