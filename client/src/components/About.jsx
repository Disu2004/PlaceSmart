import React, { useEffect } from "react";
import "../CSS/About.css"
import Navbar from "./Navbar";
import TusharImage from "../images/Tushar.jpg";
import DishantImage from "../images/Dishant.jpg";
import PratikImage from "../images/Pratik.jpg";

const About = () => {
  useEffect(() => {
    // Custom Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
        }
      });
    }, observerOptions);

    // Observe all elements with data-aos attribute
    const elements = document.querySelectorAll('[data-aos]');
    elements.forEach(el => {
      observer.observe(el);
    });

    // Cleanup
    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="about-container">
        {/* 🌄 Hero Section */}
        <section className="hero-about-section">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80"
            alt="About hero"
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
              <div 
                className="team-card" 
                key={i} 
                data-aos="zoom-in"
                data-aos-delay={i * 100}
              >
                <img src={member.img} alt={member.name} />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 🎯 Mission Section */}
        <section className="mission-section" data-aos="fade-up">
          <h2>Our Mission</h2>
          <p className="mission-text">
            To create innovative solutions that empower students and professionals
            to excel in their placement journey through cutting-edge technology,
            comprehensive resources, and personalized guidance.
          </p>
          <div className="mission-cards">
            {[
              {
                title: "🎓 Educate",
                description: "Providing comprehensive study materials and resources for placement preparation."
              },
              {
                title: "💪 Empower",
                description: "Building confidence through mock interviews and real-world problem solving."
              },
              {
                title: "🎯 Excel",
                description: "Helping students achieve their career goals with personalized guidance."
              }
            ].map((mission, i) => (
              <div 
                className="mission-card" 
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
              >
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
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
            {[  
              {
                icon: "💡",
                title: "Inspire",
                description: "Encouraging creative minds to think beyond boundaries and shape the future of technology."
              },
              {
                icon: "🚀",
                title: "Innovate",
                description: "Pushing the limits of AI, data, and design to build intelligent and scalable systems."
              },
              {
                icon: "🌍",
                title: "Impact",
                description: "Making meaningful contributions that create lasting positive change in people's lives."
              }
            ].map((vision, i) => (
              <div 
                className="vision-card" 
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
              >
                <h3>{vision.icon} {vision.title}</h3>
                <p>{vision.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 🏆 Achievements Section */}
        <section className="achievements-section" data-aos="fade-up">
          <h2>Our Achievements</h2>
          <ul>
            {[
              "🏅 Developed an intelligent placement preparation system integrating AI and modern web technologies.",
              "💻 Built multiple interactive web applications with responsive, modern design principles.",
              "⚙️ Implemented advanced algorithms for coding problems and interview preparation.",
              "🤝 Collaborated across disciplines to bring design and engineering together seamlessly.",
              "📚 Created comprehensive study material repository for computer science subjects.",
              "🎯 Helped hundreds of students prepare for technical interviews and placements."
            ].map((achievement, i) => (
              <li 
                key={i}
                data-aos="fade-right"
                data-aos-delay={i * 50}
              >
                {achievement}
              </li>
            ))}
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
              "JavaScript",
              "Python",
              "CSS3",
              "HTML5",
              "Git",
              "REST APIs"
            ].map((tech, i) => (
              <span 
                className="tech-chip" 
                data-aos="zoom-in"
                data-aos-delay={i * 50}
                key={i}
              >
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