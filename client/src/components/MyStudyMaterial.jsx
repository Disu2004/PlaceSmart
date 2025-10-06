import React, { useEffect, useState } from "react";
import "../CSS/StudyMaterial.css";

const MyStudyMaterial = () => {
    const userId = localStorage.getItem("userId");
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL = "https://placesmart.onrender.com/api/study-materials";

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

    if (loading) return <p>Loading your study materials...</p>;

    return (
        <div className="my-materials-container">
            <h1>My Study Materials</h1>
            {materials.length === 0 ? (
                <p>No materials uploaded yet.</p>
            ) : (
                <div className="materials-grid">
                    {materials.map((mat) => (
                        <div key={mat._id} className="material-card">
                            <h3>{mat.subject}</h3>
                            <p>Title: {mat.name}</p>

                            {/* Download PDF */}
                            <a
                                href={mat.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={`${mat.name}.pdf`}
                                className="download-btn"
                            >
                                Download PDF
                            </a>

                            {/* Delete button */}
                            <button
                                onClick={() => handleDelete(mat._id)}
                                className="download-btn"
                                style={{ marginLeft: "10px" }}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyStudyMaterial;
