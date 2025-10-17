import React, { useState, useEffect, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import AOS from "aos";
import "aos/dist/aos.css";
import "../../CSS/UploadQuestions.css";
import TeacherNav from "./TeacherNav";

// ✅ 100% OFFLINE: Worker served from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const UploadQuestions = () => {
    const [uploadMode, setUploadMode] = useState("text");
    const [questionText, setQuestionText] = useState("");
    const [subject, setSubject] = useState("");
    const [level, setLevel] = useState("");
    const [file, setFile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionError, setExtractionError] = useState(null);
    const [uploadError, setUploadError] = useState(null); // New: For backend errors
    const [isUploading, setIsUploading] = useState(false); // New: Upload progress
    const [progress, setProgress] = useState(0);
    const [previewText, setPreviewText] = useState("");
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const abortControllerRef = useRef(null);
    const timeoutRef = useRef(null);
    const parseTimeoutRef = useRef(null);
    const userID = localStorage.getItem("userId");
    const BACKEND_URL = process.env.BACKEND_URL;
    useEffect(() => {
        AOS.init({ duration: 800 });

        console.log(userID)
        console.log("PDF.js version:", pdfjsLib.version);
        console.log("Worker configured:", pdfjsLib.GlobalWorkerOptions.workerSrc);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (parseTimeoutRef.current) {
                clearTimeout(parseTimeoutRef.current);
            }
        };
    }, []);

    const extractQuestionsGeneral = useCallback((rawText) => {
        if (!rawText || rawText.length < 30) return [];

        console.log("Extracting from text:", rawText.length, "chars");

        // Step 1️⃣ Clean up and normalize
        let text = rawText
            .replace(/\r?\n+/g, " ") // join broken lines
            .replace(/\s{2,}/g, " ")
            .replace(/�/g, "")
            .replace(/\bCO\d+\b/gi, "") // only remove CO codes, not Bloom verbs
            .replace(/-{2,}/g, "")
            .replace(/[_•●▪◦]/g, "")
            .trim();

        // Step 1.5️⃣ Remove common header patterns
        text = text
            .replace(/\bFACULTY OF ENGINEERING AND TECHNOLOGY\b/gi, "")
            .replace(/\bDepartment of Computer Engineering\b/gi, "")
            .replace(/\b01CE0721 – UI AND UX DESIGN\b/gi, "")
            .replace(/\bIssue Date\b/gi, "")
            .replace(/\bDue Date\b/gi, "")
            .replace(/\bNote:\b/gi, "")
            .replace(/\bSubject\b/gi, "")
            .replace(/\d{2}\/\d{2}\/\d{4}/g, "") // remove dates like 18/07/2025
            .replace(/\bAssignment - 1\b/gi, "")
            .replace(/\bWrite Assignment in the file pages\b/gi, "")
            .replace(/\bSubmit assignment in the file\b/gi, "")
            .replace(/\bAssignment will be checked in the respective lab sessions only\b/gi, "")
            .replace(/\bMandatory to submit your checked assignment in the Google Classroom\b/gi, "")
            .replace(/\bSubject Faculty\b/gi, "")
            .replace(/\bProf\.\s*\(Dr\.\)\s*Kruna[lv]?\s*Vaghela\b/gi, "")
            .replace(/\bProf\.\s*Harsh\s*Nagar\b/gi, "")
            .replace(/\bProf\.\s*Parth\s*Shah\b/gi, "")
            .replace(/\bHead of Department\b/gi, "")
            .replace(/\bDept\. of Computer Engineering\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        // Step 2️⃣ Jump to questions table start
        const tableStart = text.search(/\bSr\.\s*No\.\b|\bQuestion\b/i);
        if (tableStart > -1) {
            text = text.substring(tableStart);
        } else {
            // Fallback to previous assignment start if no table found
            const assignmentStart = text.search(/\bAssignment for Average Students\b/i);
            if (assignmentStart > 0) {
                text = text.substring(assignmentStart);
            }
        }

        // Step 3️⃣ Universal question pattern, handling optional dot after number
        const regex = /\b(\d+)\s*(?:\.\s*)?([A-Z].+?)(?=\b\d+\s*(?:\.\s*)?[A-Z]|\s*$)/g;

        const matches = [...text.matchAll(regex)];
        const questions = [];
        const bloomWords = [
            'Apply', 'Analyze', 'Evaluate', 'Remember', 'Understand', 'Create',
            'Explain', 'Describe', 'Discuss', 'Compare', 'Define', 'Illustrate',
            'Summarize', 'Interpret', 'Justify', 'List', 'State', 'Distinguish',
            'Identify', 'Classify', 'Demonstrate', 'Construct', 'Design', 'Examine'
        ];

        // Step 4️⃣ Clean up each question
        for (const m of matches) {
            const number = m[1]?.trim();
            let questionText = m[2]
                .replace(/\s+/g, " ")
                .trim();

            const words = questionText.split(' ');
            questionText = words
                .map((word, index) => {
                    const cleanWord = word.replace(/[.,;:!?]/, '').trim(); // remove punctuation for matching
                    const upperClean = cleanWord.toUpperCase();
                    if (index > 0 && bloomWords.some(b => b.toUpperCase() === upperClean)) {
                        return ''; // skip this word
                    }
                    return word;
                })
                .filter(w => w.trim() !== '')
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            questionText = questionText
                .replace(/Assignment for.*/gi, "")
                .replace(/Categorization Rule.*/gi, "")
                .replace(/Faculty.*/gi, "")
                .replace(/Subject.*/gi, "")
                .replace(/Semester.*/gi, "")
                .replace(/P\s*-\s*Premium.*/gi, "")
                .replace(/A\s*-\s*Average.*/gi, "")
                .replace(/C\s*-\s*Challenge.*/gi, "")
                .replace(/Sr\. No\./gi, "")
                .replace(/Taxonomy\b/gi, "")
                .trim();

            if (questionText.length > 15) {
                questions.push({
                    number,
                    text: questionText,
                });
            }
        }

        console.log(`✅ Extracted ${questions.length} clean questions`);
        return questions;
    }, []);

    const parsePastedText = useCallback((text) => {
        if (!text.trim()) {
            setQuestions([]);
            setPreviewText("");
            return;
        }

        setPreviewText(text);
        const extracted = extractQuestionsGeneral(text);

        if (extracted.length > 0) {
            setQuestions(extracted.map((q, index) => ({
                id: Date.now() + index,
                text: q.text,
                number: q.number,
                source: 'text'
            })));
            setExtractionError(null);
        } else {
            setQuestions([]);
            setExtractionError("No questions detected. Check format or try more text.");
        }
    }, [extractQuestionsGeneral]);

    const handleTextChange = useCallback((e) => {
        const value = e.target.value;
        setQuestionText(value);
        setExtractionError(null);

        if (parseTimeoutRef.current) {
            clearTimeout(parseTimeoutRef.current);
        }

        if (value.trim().length > 50) {
            parseTimeoutRef.current = setTimeout(() => {
                parsePastedText(value);
            }, 500);
        } else {
            setQuestions([]);
            setPreviewText("");
        }
    }, [parsePastedText]);

    const previewPDF = useCallback(async (file, signal) => {
        try {
            console.log("Processing PDF:", file.name, file.size);

            if (file.size > 10 * 1024 * 1024) {
                throw new Error("File too large (max 10MB)");
            }

            const arrayBuffer = await file.arrayBuffer();
            if (signal.aborted) throw new Error('Cancelled');

            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                disableFontFace: false,
                verbosity: 0,
            });

            const pdf = await loadingTask.promise;
            console.log("PDF loaded:", pdf.numPages, "pages");

            let fullText = '';
            const maxPages = Math.min(5, pdf.numPages);

            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                if (signal.aborted) break;

                try {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();

                    const pageText = textContent.items
                        .map(item => {
                            if (item.str && typeof item.str === 'string' && item.str.trim()) {
                                return item.str
                                    .replace(/\s+/g, ' ')
                                    .replace(/�/g, '')
                                    .trim();
                            }
                            return '';
                        })
                        .filter(str => str.length > 0)
                        .join(' ')
                        .trim();

                    if (pageText.length > 10) {
                        fullText += pageText + '\n\n';
                    }
                } catch (pageError) {
                    console.warn(`Page ${pageNum} failed:`, pageError);
                }
            }

            if (fullText.length < 100) {
                throw new Error("Little text found. PDF might be scanned/images.");
            }

            console.log("Extracted:", fullText.length, "chars");
            return fullText.trim();

        } catch (error) {
            console.error("PDF error:", error);
            if (signal.aborted) throw new Error('Cancelled');
            throw error;
        }
    }, []);

    const handleFileUpload = async (e) => {
        const uploadedFile = e.target.files[0];

        if (!uploadedFile?.type.startsWith('application/pdf')) {
            setExtractionError("Please select a valid PDF file.");
            return;
        }

        setFile(uploadedFile);
        setQuestions([]);
        setExtractionError(null);
        setIsExtracting(true);
        setProgress(0);
        setPreviewText("");

        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        timeoutRef.current = setTimeout(() => {
            abortControllerRef.current?.abort();
        }, 30000);

        try {
            setProgress(20);
            const extractedText = await previewPDF(uploadedFile, signal);

            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;

            setProgress(90);
            parsePastedText(extractedText);
            setProgress(100);

        } catch (error) {
            console.error("Upload failed:", error);

            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;

            let errorMsg = "PDF processing failed";
            if (error.message.includes('little text') || error.message.includes('scanned')) {
                errorMsg = "📸 PDF is scanned/images. Use Text Input (copy-paste from PDF).";
            } else if (error.message.includes('cancelled')) {
                errorMsg = "⏰ Processing timed out.";
            } else {
                errorMsg += `: ${error.message}`;
            }

            setExtractionError(errorMsg);
            setProgress(0);
        } finally {
            setIsExtracting(false);
            abortControllerRef.current = null;
        }
    };

    const clearQuestions = useCallback(() => {
        setQuestions([]);
        setFile(null);
        setExtractionError(null);
        setUploadError(null);
        setIsUploading(false);
        setIsExtracting(false);
        setProgress(0);
        setQuestionText("");
        setPreviewText("");
        setSelectedQuestions([]);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
    }, []);

    // Updated: Backend integration for upload
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!userID?.trim()) {
            setUploadError("⚠️ User ID is required for upload!");
            return;
        }

        if (!subject.trim()) {
            setUploadError("⚠️ Subject is required for upload!");
            return;
        }

        const validQuestions = questions.filter(q => q.text && q.text.length > 15);
        if (validQuestions.length === 0) {
            setUploadError("⚠️ No valid questions to upload!");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        // Prepare questions for backend (append level to question text)
        const questionsToUpload = validQuestions.map(q => ({
            userID,
            question: `${level ? `[${level}] ` : ''}${q.text}`,
            subject
        }));

        try {
            const response = await fetch(`${BACKEND_URL}/api/questions/upload-multiple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ questions: questionsToUpload })
            });

            if (!response.ok) {
                // Handle non-2xx responses without trying to parse JSON
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText || 'Unknown error'}`);
            }

            const data = await response.json();

            if (data.success) {
                alert(data.message);
                clearQuestions(); // Clear after successful upload
            } else {
                setUploadError(`❌ Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadError(`❌ ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    }, [questions, subject, level, userID, clearQuestions]);

    const deleteQuestion = useCallback((questionId) => {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }, []);

    // ✅ Merge questions feature
    const toggleSelectQuestion = useCallback((questionId) => {
        setSelectedQuestions(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else if (prev.length < 2) {
                return [...prev, questionId];
            }
            return prev;
        });
    }, []);

    const mergeSelectedQuestions = useCallback(() => {
        if (selectedQuestions.length !== 2) {
            alert("⚠️ Select exactly 2 questions to merge!");
            return;
        }

        setQuestions(prev => {
            const [firstId, secondId] = selectedQuestions;
            const firstQ = prev.find(q => q.id === firstId);
            const secondQ = prev.find(q => q.id === secondId);

            if (!firstQ || !secondQ) return prev;

            const mergedText = firstQ.text + " " + secondQ.text;

            return prev
                .map(q => q.id === firstId ? { ...q, text: mergedText } : q)
                .filter(q => q.id !== secondId);
        });

        setSelectedQuestions([]);
    }, [selectedQuestions]);

    return (
        <>
            <TeacherNav />
            <div className="upload-container" data-aos="fade-up">

                <h1 className="upload-title">📚 Smart Question Uploader</h1>

                <div className="mode-info">
                    <p>✨ <strong>Text Input = Instant Results!</strong> Copy PDF → Paste here</p>
                </div>

                <div className="mode-toggle">
                    <button
                        className={`mode-btn ${uploadMode === "text" ? "active" : ""}`}
                        onClick={() => setUploadMode("text")}
                        disabled={isExtracting}
                    >
                        ✨ Text Input (Recommended)
                    </button>
                    <button
                        className={`mode-btn ${uploadMode === "pdf" ? "active" : ""}`}
                        onClick={() => setUploadMode("pdf")}
                        disabled={isExtracting}
                        style={{ marginLeft: "30px" }}
                    >
                        📄 PDF Extract
                    </button>
                </div>

                <form className="upload-form" onSubmit={handleSubmit}>
                    {uploadMode === "text" && (
                        <div className="form-group">
                            <label>📋 Paste Questions:</label>
                            <textarea
                                className="question-textarea"
                                placeholder="Copy ALL text from PDF (Ctrl+A → Ctrl+C) and paste here..."
                                value={questionText}
                                onChange={handleTextChange}
                                rows="12"
                                disabled={isExtracting}
                            />
                            {questions.length > 0 && (
                                <div className="extracted-count">
                                    ✅ {questions.length} questions auto-detected! ✨
                                </div>
                            )}
                        </div>
                    )}

                    {uploadMode === "pdf" && (
                        <div className="form-group">
                            <label>📁 Upload PDF:</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                className="file-input"
                                onChange={handleFileUpload}
                                disabled={isExtracting}
                            />
                            <div className="pdf-hint">
                                <p>📄 Text-based PDFs only • Max 10MB</p>
                                <p>⚠️ Scanned PDFs? Use Text Input (Ctrl+A → Ctrl+C)</p>
                            </div>
                            {file && (
                                <div className="file-info">
                                    <p>📄 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
                                    {isExtracting && (
                                        <div className="progress-container">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                                            </div>
                                            <span>{progress}%</span>
                                        </div>
                                    )}
                                    {previewText && (
                                        <details>
                                            <summary>Extracted Text ({previewText.length} chars)</summary>
                                            <pre>{previewText.substring(0, 1000)}...</pre>
                                        </details>
                                    )}
                                </div>
                            )}
                        </div>
                    )}


                    <div className="form-group">
                        <label>📚 Subject:</label>
                        <input
                            type="text"
                            className="subject-input"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>🎯 Difficulty:</label>
                        <div className="difficulty-buttons">
                            {["Easy", "Medium", "Hard"].map((diff) => (
                                <button
                                    key={diff}
                                    type="button"
                                    className={`level-btn ${level === diff ? "selected" : ""}`}
                                    onClick={() => setLevel(diff)}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="upload-btn" disabled={isExtracting || isUploading || !userID?.trim() || !subject.trim()}>
                        {isUploading ? "⏳ Uploading..." : isExtracting ? "⏳ Processing..." : `🚀 Upload ${questions.length} Questions to Backend`}
                    </button>
                </form>

                {extractionError && (
                    <div className="error-message">
                        <p>{extractionError}</p>
                        <button
                            onClick={() => {
                                setUploadMode("text");
                                setExtractionError(null);
                            }}
                            className="switch-text-btn"
                        >
                            ✨ Switch to Text Input
                        </button>
                    </div>
                )}

                {uploadError && (
                    <div className="error-message">
                        <p>{uploadError}</p>
                        <button onClick={() => setUploadError(null)} className="switch-text-btn">
                            ❌ Dismiss
                        </button>
                    </div>
                )}

                {questions.length > 0 && !isExtracting && (
                    <div className="questions-display">
                        <div className="questions-header">
                            <h2>✅ Found {questions.length} Questions!</h2>
                            <button onClick={clearQuestions} className="clear-all-btn">
                                🗑️ Clear
                            </button>
                            <button
                                onClick={mergeSelectedQuestions}
                                className="merge-btn"
                                disabled={selectedQuestions.length !== 2}
                            >
                                🔗 Merge Selected
                            </button>
                        </div>
                        <div className="questions-grid">
                            {questions.map((question) => (
                                <div key={question.id} className={`question-card ${selectedQuestions.includes(question.id) ? "selected" : ""}`}>
                                    <div className="question-number">
                                        <input
                                            type="checkbox"
                                            checked={selectedQuestions.includes(question.id)}
                                            onChange={() => toggleSelectQuestion(question.id)}
                                        /> Q{question.number}
                                    </div>
                                    <div className="question-text">
                                        <p>{question.text}</p>
                                    </div>
                                    <div className="question-actions">
                                        <button
                                            onClick={() => deleteQuestion(question.id)}
                                            className="delete-question-btn"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default UploadQuestions;