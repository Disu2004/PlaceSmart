import React, { useState, useEffect, useRef } from "react";
import "../CSS/StudyMaterial.css";
import Navbar from "./Navbar";
import { FaSearch, FaCommentDots, FaTimes } from "react-icons/fa";

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
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatDimensions, setChatDimensions] = useState({ width: 350, height: 450 });
  const chatBoxRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;
  const API_URL = `http://localhost:8000/api/study-materials`;
  console.log(API_URL);

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
      const response = await fetch(`${API_URL}/detailed-suggestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, materialUrl: fileUrl, name }),
      });
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

  const openChat = (mat) => {
    setSelectedMaterial(mat);
    setPrompts((prev) => ({ ...prev, [mat._id]: prompts[mat._id] || "" }));
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedMaterial(null);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResize = (e) => {
    if (!chatBoxRef.current) return;
    const rect = chatBoxRef.current.getBoundingClientRect();
    const newWidth = Math.max(300, e.clientX - rect.left);
    const newHeight = Math.max(300, e.clientY - rect.top);
    setChatDimensions({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  const filteredMaterials = materials.filter(
    (mat) =>
      mat.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentPrompt = selectedMaterial ? prompts[selectedMaterial._id] || "" : "";
  const currentResponse = selectedMaterial ? aiResponses[selectedMaterial._id] : "";
  const isLoading = selectedMaterial ? aiLoadingIds.includes(selectedMaterial._id) : false;

  return (
    <div className="study-wrapper">
      <Navbar />
      <div className="study-container">
        <div className="study-card">
          <h1 className="study-title">📚 Study Material Upload</h1>
          <form onSubmit={handleUpload} className="study-form">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-input"
            />
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
            <button type="submit" className="upload-btn" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </button>
          </form>
          <hr className="divider" />
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
              {filteredMaterials.map((mat) => (
                <div key={mat._id} className="material-card">
                  <div className="card-header">
                    <h3 className="card-subject">{mat.subject}</h3>
                    <p className="card-uploader">Uploaded by: {mat.name}</p>
                    <p className="card-date">
                      {new Date(mat.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="card-actions">
                    <a
                      href={`${API_URL}/api/study-materials/materials/${mat._id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn download-btn"
                    >
                      Download
                    </a>
                    <button
                      className="action-btn open-btn"
                      onClick={() => setOpenPdfUrl(mat.fileUrl)}
                      type="button"
                    >
                      Open PDF
                    </button>
                    <button
                      className="action-btn chat-btn"
                      onClick={() => openChat(mat)}
                      type="button"
                    >
                      <FaCommentDots /> Chat AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {openPdfUrl && (
            <div className="pdf-modal">
              <div className="pdf-modal-content">
                <button
                  className="close-btn"
                  onClick={() => setOpenPdfUrl(null)}
                >
                  ×
                </button>
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(
                    openPdfUrl
                  )}&embedded=true`}
                  title="Open PDF"
                  width="100%"
                  height="600px"
                  frameBorder="0"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom-Right Chat Box */}
      {isChatOpen && selectedMaterial && (
        <div ref={chatBoxRef} className="chat-box" style={{ width: `${chatDimensions.width}px`, height: `${chatDimensions.height}px` }}>
          <div className="resize-handle" onMouseDown={handleResizeStart}></div>
          <div className="chat-header">
            <span className="chat-title">AI Chat - {selectedMaterial.subject}</span>
            <button className="close-chat-btn" onClick={closeChat}>
              <FaTimes />
            </button>
          </div>
          <div className="chat-messages">
            {currentResponse && (
              <>
                <div className="message user-message">
                  <div className="message-bubble">
                    <p>{currentPrompt}</p>
                  </div>
                </div>
                <div className="message ai-message">
                  <div className="message-bubble ai-bubble">
                    <span className="ai-icon">🤖</span>
                    <div
                      className="ai-response-content"
                      dangerouslySetInnerHTML={{
                        __html: formatAIResponse(currentResponse),
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="chat-input-section">
            <input
              type="text"
              placeholder="Ask about this material..."
              value={currentPrompt}
              onChange={(e) =>
                setPrompts((prev) => ({
                  ...prev,
                  [selectedMaterial._id]: e.target.value,
                }))
              }
              className="chat-input"
              onKeyPress={(e) => e.key === 'Enter' && handleAskAI(selectedMaterial._id, selectedMaterial.fileUrl, selectedMaterial.name)}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleAskAI(selectedMaterial._id, selectedMaterial.fileUrl, selectedMaterial.name)}
              disabled={isLoading || !currentPrompt.trim()}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Study_Material;