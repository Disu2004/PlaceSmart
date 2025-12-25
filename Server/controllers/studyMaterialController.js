import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import StudyMaterial from "../Schemas/studyMaterialModel.js";
import fetch from "node-fetch";
import * as pdfParseLib from "pdf-parse"; // ESM import
let pdfText = null;
try {
    // Fetch PDF from Cloudinary
    const response = await fetch(materialUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Parse PDF text correctly
    const parsed = await pdfParseLib.default(buffer); // ✅ call .default
    pdfText = parsed.text;
} catch (err) {
    console.warn("PDF parsing failed, will fallback to URL:", err.message);
}
const gemini_api_key = process.env.GEMINI_API_KEY;

// 🔧 Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Multer Storage using Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "study_materials",
        resource_type: "raw", // ✅ fixes PDF issue
    },
});


export const upload = multer({ storage });

// 📤 Upload a new study material
export const uploadStudyMaterial = async (req, res) => {
    try {
        const { userId, name, subject } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const fileUrl = cloudinary.url(req.file.filename, {
            resource_type: "raw",
            folder: "study_materials",
            secure: true,
            flags: "attachment",
            attachment: req.file.originalname,
        });


        const newMaterial = new StudyMaterial({ userId, name, subject, fileUrl });
        await newMaterial.save();

        res.status(201).json({ success: true, material: newMaterial });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: "Failed to upload material" });
    }
};

// 📂 Get all study materials
export const getAllStudyMaterials = async (req, res) => {
    try {
        const materials = await StudyMaterial.find().sort({ createdAt: -1 });
        res.status(200).json(materials);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch materials" });
    }
};

export const downloadMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).send("Material not found");
        console.log(material)
        const response = await fetch(material.fileUrl);
        const buffer = await response.arrayBuffer();

        // Try to get extension from filename in URL
        let extension = material.fileUrl.split(".").pop();
        if (!extension.includes("?")) extension = extension.split("?")[0]; // remove query string

        const filename = `${material.name}.pdf`;

        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error(err);
        res.status(500).send("Download failed");
    }
};

// In studyMaterialController.js

export const getMyMaterials = async (req, res) => {
    try {
        const { userId } = req.params;
        const materials = await StudyMaterial.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(materials);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch materials" });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params; // MongoDB _id

        // 1️⃣ Find material by MongoDB ID
        const material = await StudyMaterial.findById(id);
        if (!material) {
            return res.status(404).json({ success: false, message: "Material not found" });
        }

        // 2️⃣ Extract public_id from Cloudinary fileUrl
        // Example URL: https://res.cloudinary.com/<cloud_name>/raw/upload/v1234567890/study_materials/filename.pdf
        const urlParts = material.fileUrl.split("/");
        const filenameWithExt = urlParts[urlParts.length - 1]; // filename.pdf
        const filename = filenameWithExt.split(".")[0]; // filename without extension
        const folder = urlParts[urlParts.length - 2]; // "study_materials"
        const publicId = `${folder}/${filename}`;

        // 3️⃣ Delete file from Cloudinary
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

        // 4️⃣ Delete MongoDB document
        await StudyMaterial.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Material deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete material" });
    }
};

export const detailedSuggestion = async (req, res) => {
    try {
        const { prompt, materialUrl, name } = req.body;
        console.log("Received prompt type:", typeof prompt, "Material URL:", materialUrl, "Name:", name);

        // Handle both string and array prompts
        let conversationHistory = [];
        if (typeof prompt === 'string') {
            // Single message case
            conversationHistory = [{ role: 'user', content: prompt }];
        } else if (Array.isArray(prompt) && prompt.length > 0) {
            // Conversation history case
            conversationHistory = prompt;
        } else {
            return res.status(400).json({ error: "Valid 'prompt' (string or non-empty array) and 'materialUrl' are required" });
        }

        if (!materialUrl) {
            return res.status(400).json({ error: "'materialUrl' is required" });
        }

        let pdfText = null;
        let parser = null;

        try {
            // Dynamically import pdf-parse (v2 ESM compatible)
            const pdfParseModule = await import("pdf-parse");
            const { PDFParse } = pdfParseModule;

            if (!PDFParse || typeof PDFParse !== 'function') {
                throw new Error("PDFParse class not found - check pdf-parse v2 installation");
            }

            // Fetch PDF from Cloudinary
            const pdfResponse = await fetch(materialUrl);
            if (!pdfResponse.ok) {
                throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
            }
            const arrayBuffer = await pdfResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Instantiate parser (v2 API)
            parser = new PDFParse({ data: buffer });
            const parsed = await parser.getText(); // Returns { text, ... }
            pdfText = parsed.text.substring(0, 8000); // Limit to first 8000 chars for context
            console.log("PDF text extracted successfully (truncated length:", pdfText.length, ")");
        } catch (err) {
            console.warn("PDF parsing failed, will fallback to URL context:", err.message);
            console.error("Full PDF error stack:", err.stack);
        } finally {
            // Always destroy parser to free memory (v2 requirement)
            if (parser) {
                await parser.destroy();
            }
        }

        // Build system prompt with PDF context
        // Build system prompt with detailed AI behavior and better context handling
        const systemPrompt = `
You are a **Professional AI Study Tutor** specializing in **${name || 'Computer Science'}**.  
Deliver **clear, structured, academic-grade explanations** as a university lecturer would — precise, insightful, and exam-ready.

---

### 📚 **Context Input**
${pdfText
                ? `PDF extract (≤8000 chars):\n${pdfText}\n`
                : `Reference: ${materialUrl}`
            }

---

### 🎯 **Response Rules**
- **Tone**: Formal, confident, educational. No emojis, slang, or casual phrasing.  
- **Structure**: Strictly follow the 5-part format below.  
- **Depth**: Explain *why* and *how*, not just *what*. Include implications and connections.  
- **Clarity**: Use short sentences. Define terms on first use.  
- **Accuracy**: Base all content on provided PDF or standard academic knowledge.

---

### 🧩 **Mandatory Response Format**

1. **Slide Overview**  
   1–2 sentences summarizing the slide’s objective and scope.

2. **Core Concepts**  
   Numbered or bulleted breakdown.  
   - Define each term precisely.  
   - Explain mechanism/process.  
   - State purpose and significance.

3. **Supporting Framework**  
   Use **Markdown table**, **diagram**, or **bulleted comparison** if applicable (e.g., types, pros/cons, flow).

4. **Illustrative Example**  
   One concise, realistic code or real-world analogy. Keep under 60 words.

5. **Key Takeaways**  
   3–5 bolded, concise bullets. Begin each with a verb (e.g., **Define**, **Compare**, **Identify**).

---

### 💡 **Query Handling**
- **MCQs**: 5–7 questions. 4 options (A–D). **Bold correct answer**. 1-line justification.  
- **Summary**: 180–250 words. Objective tone.  
- **Comparison**: Table + 2-sentence insight.  
- **Formula**: LaTeX + variable definitions + derivation steps.

---

### 🚫 **Prohibited**
- Copying slide text verbatim.  
- First-person (“I”, “we”).  
- Filler (“alright”, “let’s dive in”).  
- Emojis or markdown art unless functional.  
- Generic or unstructured responses.

---

### 🔄 **Session Continuity**
Reference prior topics naturally (e.g., “As defined in Slide 3…”). Treat conversation as one lecture.

---

Now: **Explain the current slide** using the exact 5-part structure above — professional, precise, and academically rigorous.
`;
        // Prepare Gemini contents array - system as first content
        const contents = [
            {
                role: "user",
                parts: [{ text: systemPrompt }]
            }
        ];

        // Add conversation history
        conversationHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? "user" : "model",
                parts: [{ text: msg.content }]
            });
        });

        // Send to Gemini (updated to gemini-2.5-flash, which is stable and supported)
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const aiResponse = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            }),
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            // Optional: Log suggestion for fallback models like gemini-2.5-pro or gemini-2.0-flash
            console.warn("Try updating model to gemini-2.5-pro if issues persist.");
            throw new Error(`Gemini API error: ${aiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await aiResponse.json();
        console.log(data)
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No meaningful response generated from Gemini.";

        console.log("Gemini response length:", result.length);

        return res.json({ answer: result });

    } catch (error) {
        console.error("Detailed Suggestion Error:", error.message);
        return res.status(500).json({ error: "Failed to generate detailed suggestion: " + error.message });
    }
};