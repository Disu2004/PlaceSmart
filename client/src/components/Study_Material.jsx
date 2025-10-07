import React, { useState, useEffect } from "react";
import "../CSS/StudyMaterial.css";
import Navbar from "./Navbar";

const Study_Material = () => {
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [file, setFile] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openPdfUrl, setOpenPdfUrl] = useState(null);

    const [aiLoadingIds, setAiLoadingIds] = useState([]); // track loading per material
    const [prompts, setPrompts] = useState({}); // store input per material
    const [aiResponses, setAiResponses] = useState({}); // store AI response per material

    const API_URL = "https://placesmart.onrender.com/api/study-materials";

    const fetchMaterials = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setMaterials(data);
        } catch (error) {
            console.error("Error fetching materials:", error);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!name || !subject || !file) {
            alert("Please fill all fields and select a file");
            return;
        }
        const formData = new FormData();
        formData.append("userId", localStorage.getItem("userId"));
        formData.append("name", name);
        formData.append("subject", subject);
        formData.append("file", file);

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/upload`, {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert("File uploaded successfully!");
                setName("");
                setSubject("");
                setFile(null);
                fetchMaterials();
            } else {
                alert(result.message || "Upload failed!");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed!");
        } finally {
            setLoading(false);
        }
    };

    // 🧠 Ask AI about a specific material
    const handleAskAI = async (materialId, fileUrl, name) => {
        const prompt = prompts[materialId];
        if (!prompt || !prompt.trim()) {
            alert("Please enter a question before asking AI!");
            return;
        }

        try {
            setAiLoadingIds((prev) => [...prev, materialId]);
            setAiResponses((prev) => ({ ...prev, [materialId]: "" }));

            const response = await fetch(
                "https://placesmart.onrender.com/api/study-materials/detailed-suggestion",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, materialUrl: fileUrl, name }),
                }
            );
            const data = await response.json();
            if (response.ok) {
                setAiResponses((prev) => ({
                    ...prev,
                    [materialId]: data.answer || "No response from AI.",
                }));
            } else {
                setAiResponses((prev) => ({
                    ...prev,
                    [materialId]: "Error: " + (data.error || "Something went wrong"),
                }));
            }
        } catch (error) {
            console.error("AI fetch error:", error);
            setAiResponses((prev) => ({
                ...prev,
                [materialId]: "Error connecting to AI server.",
            }));
        } finally {
            setAiLoadingIds((prev) => prev.filter((id) => id !== materialId));
        }
    };

    return (
        <div>
            <Navbar />
            <div className="study-container">
                <div className="study-card">
                    <h1 className="study-title">📚 Study Material Upload</h1>

                    {/* Upload Form */}
                    <form onSubmit={handleUpload} className="study-form">
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? "Uploading..." : "Upload"}
                        </button>
                    </form>

                    <hr className="divider" />
                    <h2 className="materials-heading">📂 Uploaded Study Materials</h2>

                    {materials.length === 0 ? (
                        <p className="no-materials">No materials uploaded yet.</p>
                    ) : (
                        <div className="materials-grid">
                            {materials.map((mat) => {
                                const isLoading = aiLoadingIds.includes(mat._id);
                                return (
                                    <div key={mat._id} className="material-card">
                                        <h3>{mat.subject}</h3>
                                        <p>Uploaded by: {mat.name}</p>
                                        <p className="date">
                                            {new Date(mat.createdAt).toLocaleString()}
                                        </p>

                                        <a
                                            href={`https://placesmart.onrender.com/api/study-materials/materials/${mat._id}/download`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="download-btn"
                                        >
                                            Download
                                        </a>

                                        <button
                                            className="download-btn"
                                            style={{ marginLeft: "10px" }}
                                            onClick={() => setOpenPdfUrl(mat.fileUrl)}
                                            type="button"
                                        >
                                            Open PDF
                                        </button>

                                        {/* 🧠 Ask AI Section */}
                                        <div className="ai-section" style={{ marginTop: "10px" }}>
                                            <input
                                                type="text"
                                                placeholder="Ask AI about this material..."
                                                value={prompts[mat._id] || ""}
                                                onChange={(e) =>
                                                    setPrompts((prev) => ({
                                                        ...prev,
                                                        [mat._id]: e.target.value,
                                                    }))
                                                }
                                                className="ai-input"
                                            />
                                            <button
                                                type="button"
                                                className="ai-btn download-btn"
                                                style={{ marginLeft: "10px" }}
                                                onClick={() =>
                                                    handleAskAI(mat._id, mat.fileUrl, mat.name)
                                                }
                                                disabled={isLoading}
                                            >
                                                {isLoading ? "Thinking..." : "Ask AI"}
                                            </button>
                                        </div>

                                        {/* 🧾 AI Response Display */}
                                        {aiResponses[mat._id] && (
                                            <div
                                                className="ai-response-box"
                                                style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}
                                            >
                                                <h4>🤖 AI Response:</h4>
                                                <div>{aiResponses[mat._id]}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* PDF Modal */}
                    {openPdfUrl && (
                        <div className="pdf-modal">
                            <div className="pdf-modal-content">
                                <button
                                    className="close-btn"
                                    onClick={() => setOpenPdfUrl(null)}
                                    style={{ float: "right", margin: "5px" }}
                                >
                                    Close
                                </button>
                                <iframe
                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(
                                        openPdfUrl
                                    )}&embedded=true`}
                                    title="Open PDF"
                                    width="100%"
                                    height="600px"
                                    frameBorder="0"
                                ></iframe>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Study_Material;
