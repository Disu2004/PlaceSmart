import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../CSS/ViewQuestions.css'; // external CSS file

const ViewQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [search, setSearch] = useState('');
    const BACKEND_URL = process.env.BACKEND_URL;
    useEffect(() => {
        AOS.init({ duration: 1000, once: true });
    }, []);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/questions/get-questions`);
                const data = await response.json();
                if (data.success) {
                    setQuestions(data.questions);
                    AOS.refresh(); // ✅ ensure all animate properly
                } else {
                    console.error('Error:', data.message);
                }
            } catch (err) {
                console.error('Error fetching questions:', err);
            }
        };
        fetchQuestions();
    }, []);

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
    );
};

export default ViewQuestions;
