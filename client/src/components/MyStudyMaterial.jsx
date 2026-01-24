import React, { useEffect, useState } from "react";
import "../CSS/StudyMaterial.css";
import Navbar from "./Navbar";

const MyStudyMaterial = () => {
    const userId = localStorage.getItem("userId");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:8000";
    const API_URL = `${BACKEND_URL}/api/study-materials`;

    // AOS-like scroll animation
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
    }, [materials]);

    // Fetch user's materials
    const fetchMyMaterials = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/my-materials/${userId}`);
            const data = await response.json();
            setMaterials(data);
        } catch (error) {
            console.error("Error fetching my materials:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyMaterials();
    }, [userId]);

    // Delete a material
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this material?")) return;

        try {
            const response = await fetch(`${API_URL}/deletematerial/${id}/delete`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                alert("File deleted successfully!");
                fetchMyMaterials(); // refresh the list
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="my-materials-container">
                    <p style={{ 
                        textAlign: 'center', 
                        fontSize: '1.3rem', 
                        color: '#3b82f6',
                        padding: '60px 20px'
                    }}>
                        Loading your study materials...
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="my-materials-container">
                <h1 data-aos="fade-down">My Study Materials</h1>
                {materials.length === 0 ? (
                    <p data-aos="fade-up">
                        No materials uploaded yet. Start by uploading your first study material! 📚
                    </p>
                ) : (
                    <div className="materials-grid">
                        {materials.map((mat, index) => (
                            <div 
                                key={mat._id} 
                                className="material-card"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                            >
                                <h3>📖 {mat.subject}</h3>
                                <p><strong>Title:</strong> {mat.name}</p>
                                
                                <div className="material-actions">
                                    {/* Download PDF */}
                                    <a
                                        href={mat.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={`${mat.name}.pdf`}
                                        className="download-btn"
                                    >
                                        📥 Download PDF
                                    </a>

                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleDelete(mat._id)}
                                        className="download-btn"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default MyStudyMaterial;