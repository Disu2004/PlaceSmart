import React, { useState, useEffect } from "react";
import "../CSS/StudyMaterial.css";
import Navbar from "./Navbar";
import { FaSearch } from "react-icons/fa";

const Study_Material = () => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openPdfUrl, setOpenPdfUrl] = useState(null);
  const [aiLoadingIds, setAiLoadingIds] = useState([]);
  const [prompts, setPrompts] = useState({});
  const [aiResponses, setAiResponses] = useState({});

  // 🔍 Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const API_URL = `${BACKEND_URL}/api/study-materials`;

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

  const formatAIResponse = (text) => {
    if (!text) return "";
    let formatted = text.replace(/###\s*(.*?)(?=\n|$)/g, "<h3>$1</h3>");
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<i>$1</i>");
    formatted = formatted.replace(/(?:^|\n)\d+\.\s+(.*?)(?=\n|$)/g, "<li>$1</li>");
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>");
    formatted = formatted.replace(/(?:^|\n)[\*\-]\s+(.*?)(?=\n|$)/g, "<li>$1</li>");
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
    formatted = formatted.replace(/\n/g, "<br>");
    return formatted;
  };

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
        "http://localhost:8000/api/study-materials/detailed-suggestion",
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

  // 🔍 Filter materials by search term
  const filteredMaterials = materials.filter(
    (mat) =>
      mat.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              className="file-input1 files"
            />
            <button type="submit" className="uploads" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </button>
          </form>

          <hr className="divider" />

          {/* 🔍 Search Section */}
          <div className="search-section">
            <FaSearch
              className="search-icon"
              onClick={() => setShowSearch(!showSearch)}
            />
            <input
              type="text"
              placeholder="Search by subject or uploader..."
              className={`search-input ${showSearch ? "show" : ""}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <h2 className="materials-heading">📂 Uploaded Study Materials</h2>

          {filteredMaterials.length === 0 ? (
            <p className="no-materials">No materials found.</p>
          ) : (
            <div className="materials-grid">
              {filteredMaterials.map((mat) => {
                const isLoading = aiLoadingIds.includes(mat._id);
                return (
                  <div key={mat._id} className="material-card">
                    <h3>{mat.subject}</h3>
                    <p>Uploaded by: {mat.name}</p>
                    <p className="date">
                      {new Date(mat.createdAt).toLocaleString()}
                    </p>

                    <a
                      href={`http://localhost:8000/api/study-materials/materials/${mat._id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-btn"
                    >
                      Download
                    </a>

                    <button
                      className="download-btn"
                      onClick={() => setOpenPdfUrl(mat.fileUrl)}
                      type="button"
                      style={{ marginLeft: "20px" }}
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

                    {aiResponses[mat._id] && (
                      <div
                        className="ai-response-box"
                        style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}
                      >
                        <h4>🤖 AI Response:</h4>
                        <div
                          className="ai-response-content"
                          dangerouslySetInnerHTML={{
                            __html: formatAIResponse(aiResponses[mat._id]),
                          }}
                        ></div>
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
