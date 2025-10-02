import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

export default function ResumeBuilder() {
    const [status, setStatus] = useState("Click to start voice recognition");
    const [listening, setListening] = useState(false);

    const startListening = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setListening(true);
            setStatus("🎤 Listening for command...");
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.toLowerCase();
            console.log("Voice command:", command);

            if (command.includes("build my resume")) {
                setStatus("📄 Generating Resume...");
                generatePDF();
            }
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            setStatus("❌ Error occurred. Try again.");
        };

        recognition.onend = () => {
            setListening(false);
            setStatus("Click to start voice recognition");
        };

        recognition.start();
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const resumeText = `
Name: John Doe
Email: johndoe@example.com
Phone: +91 9876543210

Objective:
To obtain a challenging position where I can apply my skills and grow professionally.

Education:
- B.Sc Computer Science, XYZ University
- High School, ABC School

Skills:
- JavaScript, React, Node.js
- HTML, CSS, Bootstrap

Experience:
- Web Developer at ABC Company
    `;
        doc.setFontSize(12);
        doc.text(resumeText, 10, 10);
        doc.save("My_Resume.pdf"); // auto-download

        setStatus("✅ Resume generated and downloaded!");
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>📝 Resume Builder</h2>
            <p>
                Say "build my resume" to automatically generate and download your resume
                as PDF.
            </p>
            <button onClick={startListening} style={{ padding: "10px", fontSize: "16px" }}>
                {listening ? "🎙 Listening..." : "Start Voice Recognition"}
            </button>
            <p>Status: {status}</p>
        </div>
    );
}
