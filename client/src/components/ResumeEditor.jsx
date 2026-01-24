import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import '../CSS/ResumeEditor.css';
import { useNavigate } from 'react-router-dom';

// Main App Component
export default function ResumeBuilderApp() {
  const [currentView, setCurrentView] = useState('gallery');
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  const navigateToEditor = (id) => {
    setSelectedResumeId(id);
    setCurrentView('editor');
  };

  const navigateToGallery = () => {
    setCurrentView('gallery');
    setSelectedResumeId(null);
  };

  return (
    <div className="app-container">
      {currentView === 'gallery' ? (
        <ResumeGallery onSelectResume={navigateToEditor} />
      ) : (
        <ResumeEditor 
          resumeId={selectedResumeId} 
          onBack={navigateToGallery} 
        />
      )}
    </div>
  );
}

// Gallery Component
function ResumeGallery({ onSelectResume }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:8000';

    fetch(`${backendUrl}/resume/resumes`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch resumes');
        return res.json();
      })
      .then(data => {
        const resumeList = Array.isArray(data) ? data : [data];
        setResumes(resumeList);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <div className="header-content">
          <div className="logo-icon">📄</div>
          <h1 className="main-title">Resume Templates</h1>
        </div>
        <p className="subtitle">Choose a template and customize your perfect resume</p>
      </div>

      <div className="resume-grid">
        {resumes.map((resume, index) => (
          <ResumeCard
            key={resume.id || index}
            resume={resume}
            index={index}
            onSelect={() => onSelectResume(resume.id || (index + 1))}
          />
        ))}
      </div>
    </div>
  );
}

// Resume Card Component
function ResumeCard({ resume, index, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`resume-card ${isHovered ? 'hovered' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div className="card-preview">
        <div className="preview-placeholder">📄</div>
        {isHovered && (
          <div className="hover-overlay">Click to Edit</div>
        )}
      </div>

      <div className="card-info">
        <h3 className="card-title">
          Resume Template {resume.id || index + 1}
        </h3>
        <p className="card-description">Click to customize and download</p>
      </div>
    </div>
  );
}

// Resume Editor Component
function ResumeEditor({ resumeId, onBack }) {
  const navigate = useNavigate();
  const resumeRef = useRef();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [resumeData, setResumeData] = useState({ html: '', css: '' });

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:8000';

    fetch(`${backendUrl}/resume/resumes/${resumeId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch resume');
        return res.json();
      })
      .then(data => {
        const { html, css } = data;
        
        setResumeData({ html, css });

        resumeRef.current.innerHTML = `
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
          <style id="resume-base-styles">
            .resume-content * { 
              box-sizing: border-box; 
            }
            
            .resume-content {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            ${css}

            @media screen {
              .resume-content [contenteditable=true] {
                min-height: 1.2em;
                outline: none;
                transition: background 0.2s ease, box-shadow 0.2s ease;
                position: relative;
              }
              
              .resume-content [contenteditable=true]:focus {
                outline: 2px solid #3b82f6 !important;
                background: rgba(59, 130, 246, 0.08) !important;
                border-radius: 4px;
                padding: 4px 8px;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.3) !important;
              }
              
              .resume-content [contenteditable=true]:hover:not(:focus) {
                background: rgba(59, 130, 246, 0.04) !important;
                border-radius: 4px;
              }
              
              .resume-content [contenteditable=true]:empty:before {
                content: "Click to edit";
                color: #999;
                font-style: italic;
              }
            }
            
            @media print {
              .resume-content [contenteditable=true],
              .resume-content [contenteditable=true]:focus,
              .resume-content [contenteditable=true]:hover {
                outline: none !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
              }
              
              .resume-content [contenteditable=true]:empty:before {
                content: none !important;
              }
            }
            
            .resume-content img { 
              max-width: 100%; 
              height: auto;
              display: block;
            }
          </style>

          ${html}
        `;

        setTimeout(() => {
          const editable = resumeRef.current.querySelectorAll(
            "h1, h2, h3, h4, h5, h6, p, li, span:not(.icon):not([class*='separator']), td, th, " +
            "div:not(.resume-paper):not(.resume-content):not([class*='container']):not([class*='wrapper']):not([class*='section'])"
          );
          
          editable.forEach(el => {
            if (el.textContent.trim().length > 0) {
              el.setAttribute("contenteditable", "true");
            }
          });
          
          setLoading(false);
        }, 500);
      })
      .catch(() => {
        alert("Template not found!");
        setLoading(false);
      });
  }, [resumeId]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const selectors = [
        '#photo',
        '#profile-photo',
        '#profile-image',
        'img[alt*="photo" i]',
        'img[alt*="profile" i]',
        '.profile-photo',
        '.profile-image',
        'img'
      ];

      let img = null;
      for (const selector of selectors) {
        img = resumeRef.current.querySelector(selector);
        if (img) break;
      }

      if (img) {
        img.src = ev.target.result;
        img.style.objectFit = 'cover';
        img.style.width = img.style.width || '150px';
        img.style.height = img.style.height || '150px';
      } else {
        alert('No image element found in the resume template.');
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadPDF = async () => {
    if (!resumeRef.current) {
      alert('Resume content not loaded');
      return;
    }

    setPdfDownloading(true);
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const resumeContentEl = resumeRef.current.querySelector('.resume-content') || resumeRef.current;
      
      if (!resumeContentEl || !resumeContentEl.innerHTML || resumeContentEl.innerHTML.trim().length < 100) {
        alert('Resume content not loaded properly. Please refresh and try again.');
        setPdfDownloading(false);
        setLoading(false);
        return;
      }

      const clonedContent = resumeContentEl.cloneNode(true);
      
      const editableEls = clonedContent.querySelectorAll('[contenteditable]');
      editableEls.forEach(el => {
        el.removeAttribute('contenteditable');
        el.style.outline = 'none';
        el.style.background = 'transparent';
        el.style.boxShadow = 'none';
      });

      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = `
        position: fixed;
        left: -99999px;
        top: 0;
        width: 210mm;
        background: white;
        padding: 0;
        margin: 0;
      `;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        width: 210mm;
        min-height: 297mm;
        background: white;
        font-family: 'Inter', Arial, sans-serif;
        padding: 20mm;
      `;

      const styleTag = document.createElement('style');
      styleTag.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        [contenteditable] {
          outline: none !important;
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        ${resumeData.css}
      `;

      wrapper.appendChild(styleTag);
      wrapper.appendChild(clonedContent);
      pdfContainer.appendChild(wrapper);
      document.body.appendChild(pdfContainer);

      const options = {
        margin: 0,
        filename: `Resume_${Date.now()}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 794,
          windowHeight: 1123,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'] 
        }
      };

      await html2pdf()
        .set(options)
        .from(wrapper)
        .save();

      document.body.removeChild(pdfContainer);
      
      setPdfDownloading(false);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      setPdfDownloading(false);
      setLoading(false);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="editor-container">
      <div className="editor-navbar">
        <div className="navbar-content">
          <div className="navbar-logo">
            <div className="logo-icon">📄</div>
            <h1 className="navbar-title">Resume Editor</h1>
          </div>

          <div className="navbar-actions">
            <label className="upload-button">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                style={{ display: 'none' }}
              />
              <div className="button-content">📤 Upload Photo</div>
            </label>

            <button 
              onClick={downloadPDF} 
              className="download-button"
              disabled={pdfDownloading}
            >
              {pdfDownloading ? '⏳ Generating...' : '⬇️ Download PDF'}
            </button>

            <button 
              onClick={handleBackToHome} 
              className="back-button"
            >
              ⬅ Back to Home
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">
            {pdfDownloading ? 'Generating PDF...' : 'Loading...'}
          </div>
        </div>
      )}

      {success && (
        <div className="success-toast">
          <span className="success-icon">✨</span>
          PDF Downloaded Successfully!
        </div>
      )}

      <div className="resume-container">
        <div className="resume-paper">
          <div ref={resumeRef} className="resume-content" />
        </div>
      </div>
    </div>
  );
}