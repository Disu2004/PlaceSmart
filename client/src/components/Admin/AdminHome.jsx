import { useNavigate } from 'react-router-dom';
import '../../CSS/Admin.css';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
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

    document.querySelectorAll('[data-aos]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-home-container">
        <div data-aos="fade-down">
          <h1 className="admin-home-title">⚙️ Admin Dashboard</h1>
          <p className="admin-home-subtitle">Manage your platform efficiently</p>
        </div>

        <div className="admin-home-cards">
          <div 
            className="admin-home-card"
            onClick={() => navigate('/user-management')}
            data-aos="zoom-in"
          >
            <div className="admin-home-card-icon">👥</div>
            <h2 className="admin-home-card-title">User Management</h2>
            <p className="admin-home-card-desc">
              View, edit, and manage all registered users
            </p>
            <button className="admin-home-btn">
              Manage Users →
            </button>
          </div>

          <div 
            className="admin-home-card"
            onClick={() => navigate('/resume-manager')}
            data-aos="zoom-in"
            data-aos-delay="100"
          >
            <div className="admin-home-card-icon">📄</div>
            <h2 className="admin-home-card-title">Resume Templates</h2>
            <p className="admin-home-card-desc">
              Add, update, and delete resume templates
            </p>
            <button className="admin-home-btn">
              Manage Templates →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}