import React, { useEffect, useState } from 'react';
import '../../CSS/ViewQuestions.css';
import Navbar from '../Navbar';
import TeacherNav from './TeacherNav';

const ViewQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [search, setSearch] = useState('');
    const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:8000";

    useEffect(() => {
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
    }, [questions]); // Re-observe when questions change

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/questions/get-questions`);
                const data = await response.json();
                if (data.success) {
                    setQuestions(data.questions);
                } else {
                    console.error('Error:', data.message);
                }
            } catch (err) {
                console.error('Error fetching questions:', err);
            }
        };
        fetchQuestions();
    }, [BACKEND_URL]);

    const filteredQuestions =
        search.trim() === ''
            ? questions
            : questions.filter(
                (q) =>
                    q.subject?.toLowerCase().includes(search.toLowerCase()) ||
                    q.userId?.toLowerCase().includes(search.toLowerCase()) ||
                    q.question?.toLowerCase().includes(search.toLowerCase())
            );

    return (
      <>
      <TeacherNav />
        <div className="view-questions-container">
            <h1 data-aos="fade-down" className="title">
                📘 All Questions
            </h1>

            <div className="search-bar" data-aos="zoom-in">
                <div className="search-container">
                    <div className="search-border"></div>
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="questions-list">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q, index) => (
                        <div className="question-card" key={index} data-aos="fade-right">
                            <h2 className="subject">{q.subject}</h2>
                            <p className="question-text">📝 {q.question}</p>
                            <p className="userid">👤 User ID: {q.userId}</p>
                            <p className="timestamp">🕒 {new Date(q.timestamp).toLocaleString()}</p>
                        </div>
                    ))
                ) : (
                    <p className="no-results" data-aos="zoom-in">
                        No questions found...
                    </p>
                )}
            </div>
        </div>
      </>
    );
};

export default ViewQuestions;