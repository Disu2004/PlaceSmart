import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import '../CSS/ResumeEditor.css';

// Main App Component
export default function ResumeBuilderApp() {
  const [currentView, setCurrentView] = useState('gallery');
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const navigateToEditor = (id) => {
    setSelectedResumeId(id);
    setCurrentView('editor');
  };

  const navigateToGallery = () => {
    setCurrentView('gallery');
    setSelectedResumeId(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`app-container ${theme}`}>
      {showWelcome && <WelcomeMessage theme={theme} />}

      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {currentView === 'gallery' ? (
        <ResumeGallery onSelectResume={navigateToEditor} theme={theme} />
      ) : (
        <ResumeEditor 
          resumeId={selectedResumeId} 
          onBack={navigateToGallery} 
          theme={theme} 
        />
      )}
    </div>
  );
}

// Welcome Message Component
function WelcomeMessage({ theme }) {
  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        <div className="welcome-icon">✨</div>
        <h2 className="welcome-title">Specialized Theme Available!</h2>
        <p className="welcome-text">
          {theme === 'dark' ? '🌙 Golden Black Theme Active' : '🌸 Pink White Theme Active'}
        </p>
        <p className="welcome-subtext">Click the theme button to switch anytime</p>
      </div>
    </div>
  );
}

// Theme Toggle Button
function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle}>
      <span className="theme-icon">{theme === 'dark' ? '🌸' : '🌙'}</span>
      <span className="theme-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
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
      <div className="animated-background" />

      <div className="gallery-header">
        <div className="header-content">
          <div className="logo-icon">✨</div>
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
function ResumeEditor({ resumeId, onBack, theme }) {
  const resumeRef = useRef();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:8000';

    fetch(`${backendUrl}/resume/resumes/${resumeId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch resume');
        return res.json();
      })
      .then(data => {
        const { html, css } = data;

        // Inject resume content with ISOLATED styles
        resumeRef.current.innerHTML = `
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
          <style>
            /* Reset only for resume content - NOT for whole page */
            .resume-content * { 
              box-sizing: border-box; 
            }
            
            /* Base resume styling - only affects resume content */
            .resume-content {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* User's resume styles */
            ${css}

            /* Editable styles - ONLY for screen, ONLY for resume content */
            @media screen {
              .resume-content [contenteditable=true] {
                min-height: 1.2em;
                outline: none;
                transition: background 0.2s ease, box-shadow 0.2s ease;
                position: relative;
              }
              
              .resume-content [contenteditable=true]:focus {
                outline: 2px solid ${theme === 'dark' ? '#FFD700' : '#D946A6'} !important;
                background: ${theme === 'dark' ? 'rgba(255,215,0,0.08)' : 'rgba(217,70,166,0.08)'} !important;
                border-radius: 4px;
                padding: 4px 8px;
                box-shadow: 0 0 10px ${theme === 'dark' ? 'rgba(255,215,0,0.3)' : 'rgba(217,70,166,0.3)'} !important;
              }
              
              .resume-content [contenteditable=true]:hover:not(:focus) {
                background: ${theme === 'dark' ? 'rgba(255,215,0,0.04)' : 'rgba(217,70,166,0.04)'} !important;
                border-radius: 4px;
              }
              
              .resume-content [contenteditable=true]:empty:before {
                content: "Click to edit";
                color: #999;
                font-style: italic;
              }
            }
            
            /* Remove ALL editing styles for PDF/print */
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
            
            /* Image handling */
            .resume-content img { 
              max-width: 100%; 
              height: auto;
              display: block;
            }
          </style>

          ${html}
        `;

        setTimeout(() => {
          // Make text editable - target only meaningful text elements
          const editable = resumeRef.current.querySelectorAll(
            "h1, h2, h3, h4, h5, h6, p, li, span:not(.icon):not([class*='separator']), td, th, " +
            "div:not(.resume-paper):not(.resume-content):not([class*='container']):not([class*='wrapper']):not([class*='section'])"
          );
          
          editable.forEach(el => {
            // Only make elements with actual text content editable
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
  }, [resumeId, theme]);

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

const downloadPDF = () => {
  const exportElement = resumeRef.current;
  if (!exportElement) return;

  setPdfDownloading(true);
  setLoading(true);

  // Clone the element
  const clone = exportElement.cloneNode(true);
  
  // Remove editable attributes
  const editableElements = clone.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(el => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('style');
  });

  // Ensure proper A4 sizing
  clone.style.width = '210mm';
  clone.style.minHeight = '297mm';
  clone.style.background = '#ffffff';
  clone.style.padding = '0';
  clone.style.margin = '0';

  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '210mm';
  tempContainer.style.background = '#ffffff';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.appendChild(clone);
  document.body.appendChild(tempContainer);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Resume_${new Date().getTime()}.pdf`,
    image: { 
      type: 'jpeg', 
      quality: 0.98 
    },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,  // 210mm * 96dpi / 25.4mm/inch
      windowHeight: 1123, // 297mm * 96dpi / 25.4mm/inch
      width: 794,
      height: 1123,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait'
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy']
    }
  };

  html2pdf()
    .set(opt)
    .from(tempContainer)
    .save()
    .then(() => {
      document.body.removeChild(tempContainer);
      setPdfDownloading(false);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    })
    .catch((err) => {
      console.error('PDF error:', err);
      document.body.removeChild(tempContainer);
      setPdfDownloading(false);
      setLoading(false);
      alert('Failed to generate PDF. Please try again.');
    });
};

  return (
    <div className="editor-container">
      <div className="animated-background" />

      <div className="editor-navbar">
        <div className="navbar-content">
          <div className="navbar-logo">
            <div className="logo-icon">✨</div>
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

            <button onClick={onBack} className="back-button">
              🏠 Gallery
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

      <div className="instructions">
        <div className="instructions-box">
          <p className="instructions-text">
            <span className="instructions-icon">✨</span>
            {' '}Click કરીને નામ, નંબર, સ્કિલ્સ બધું બદલો
            <span className="instructions-separator">•</span>
            Photo પણ આવશે
            <span className="instructions-separator">•</span>
            PDF પરફેક્ટ આવશે
          </p>
        </div>
      </div>
    </div>
  );
}