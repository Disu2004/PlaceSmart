import React, { useEffect } from "react";
import Navbar from "./Navbar";
import "../CSS/Home.css";
import AOS from "aos";
import "aos/dist/aos.css";
import heroImage from "../images/hero.jpeg";
import smartWork from "../images/smartwork.webp"
import ahead from "../images/stayahead.webp";
import skillImage from "../images/skill.jpeg";
import { useNavigate } from "react-router-dom";
const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if(localStorage.getItem("userId") >=2000){
      navigate("/teacher-home");
    }
    AOS.init({ duration: 1400 });
  }, []);

  return (
    <div className="pb-home-container">
      <Navbar />

      {/* Hero Section */}
      <section className="pb-hero-section">
        <div className="pb-hero-content" data-aos="fade-up">
          <h1>Welcome to Placement Buddy</h1>
          <p>
            Your one-stop solution to ace interviews, build a perfect resume,
            and prepare with the best study materials.
          </p>
        </div>
        <div className="pb-hero-image" data-aos="zoom-in">
          <img
            src={heroImage}
            alt="Hero"
          />
        </div>
      </section>

      {/* Cards Section */}
      <section className="pb-cards-section">
        <h2 data-aos="fade-right">Our Features</h2>
        <div className="pb-cards-container">
          <div className="pb-card" data-aos="flip-left">
            <h3>Interview Coach</h3>
            <p>Get real-time guidance and mock interview sessions.</p>
          </div>
          <div className="pb-card" data-aos="flip-left" data-aos-delay="100">
            <h3>Resume Builder</h3>
            <p>Create professional resumes that stand out to recruiters.</p>
          </div>
          <div className="pb-card" data-aos="flip-left" data-aos-delay="200">
            <h3>Study Material</h3>
            <p>Access curated content for technical and HR interview prep.</p>
          </div>
        </div>
      </section>

      {/* Zigzag Section 1 */}
      <section className="pb-zigzag-section">
        <div className="pb-zigzag-content" data-aos="fade-right">
          <h2>Prepare Smartly, Achieve Faster</h2>
          <p>
            With Placement Buddy, learn the smart way. Follow structured guides,
            improve your skills, and track your progress with precision.
          </p>
        </div>
        <div className="pb-zigzag-image" data-aos="fade-left">
          <img
            src={smartWork}
            alt="Smart Learning"
          />
        </div>
      </section>

      {/* Zigzag Section 2 (Reversed) */}
      <section className="pb-zigzag-section pb-reverse">
        <div className="pb-zigzag-content" data-aos="fade-left">
          <h2>Build Real Skills</h2>
          <p>
            Practice with real-world interview questions, coding challenges, and
            group discussions to sharpen your abilities.
          </p>
        </div>
        <div className="pb-zigzag-image" data-aos="fade-right">
          <img
            src={skillImage}
            alt="Skill Building"
          />
        </div>
      </section>

      {/* Zigzag Section 3 */}
      <section className="pb-zigzag-section">
        <div className="pb-zigzag-content" data-aos="fade-right">
          <h2>Stay Ahead of the Competition</h2>
          <p>
            Get access to exclusive resources, expert tips, and curated
            placement strategies to always stay one step ahead.
          </p>
        </div>
        <div className="pb-zigzag-image" data-aos="fade-left">
          <img
            src={ahead}
            alt="Competition"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="pb-steps-section">
        <h2 data-aos="fade-up">How Placement Buddy Works</h2>
        <div className="pb-steps-container">
          <div className="pb-step" data-aos="fade-right">
            <span>1</span>
            <p>Sign up & create your profile</p>
          </div>
          <div className="pb-step" data-aos="fade-up">
            <span>2</span>
            <p>Practice with AI-powered tools & mock tests</p>
          </div>
          <div className="pb-step" data-aos="fade-left">
            <span>3</span>
            <p>Track progress & improve weak areas</p>
          </div>
          <div className="pb-step" data-aos="fade-up" data-aos-delay="200">
            <span>4</span>
            <p>Land your dream placement!</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="pb-testimonials-section">
        <h2 data-aos="fade-up">What Our Students Say</h2>
        <div className="pb-testimonials-container">
          <div className="pb-testimonial" data-aos="zoom-in">
            <p>
              "Placement Buddy gave me confidence to crack my first interview!
              The mock tests were a game changer."
            </p>
            <h4>- Harshad Dalsaniya</h4>
          </div>
          <div className="pb-testimonial" data-aos="zoom-in" data-aos-delay="100">
            <p>
              "The resume builder is fantastic. My CV finally looks professional
              and recruiters noticed me!"
            </p>
            <h4>- Darshana Chandpa</h4>
          </div>
          <div className="pb-testimonial" data-aos="zoom-in" data-aos-delay="200">
            <p>
              "From coding challenges to HR prep, everything was in one place.
              Highly recommended!"
            </p>
            <h4>- Tushar Parmar</h4>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-faq-section" data-aos="fade-up">
        <h2>Frequently Asked Questions</h2>
        <div className="pb-faq-item">
          <h4>Is Placement Buddy free to use?</h4>
          <p>Yes, basic features are free. Premium tools are available too.</p>
        </div>
        <div className="pb-faq-item">
          <h4>Can I practice coding interviews here?</h4>
          <p>
            Absolutely! We provide coding challenges and mock technical rounds.
          </p>
        </div>
        <div className="pb-faq-item">
          <h4>Will I get feedback on my resume?</h4>
          <p>
            Yes, our AI-powered resume builder gives instant feedback to make
            your CV stand out.
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="pb-newsletter-section" data-aos="fade-up">
        <h2>Stay Updated!</h2>
        <p>Subscribe to our newsletter and never miss placement updates.</p>
        <form>
          <input type="email" placeholder="Enter your email" required />
          <button type="submit">Subscribe</button>
        </form>
      </section>

      {/* CTA Section */}
      <section className="pb-cta-section" data-aos="fade-up">
        <h2>Ready to Start?</h2>
        <p>Join Placement Buddy and take your career to the next level.</p>
        <button className="pb-cta-btn">Get Started</button>
      </section>
    </div>
  );
};

export default Home;