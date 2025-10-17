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
            You are an advanced AI study assistant specialized in the subject: **${name || 'General Studies'}**.

            Your goal is to provide clear, accurate, and engaging educational help to users based on:
            1. The extracted PDF content (if available).
            2. The ongoing conversation context.
            3. The user's direct question or task.

            📘 **Available Material Context:**
            ${pdfText
                            ? `The following text is extracted from the uploaded PDF (first 8000 characters):\n\n${pdfText}\n\n`
                            : `The user provided a study material link for reference: ${materialUrl}`
                        }

            ---

            ### 🎯 **Your Responsibilities**
            - Analyze both the PDF content (if available) and user’s query.
            - Give logically structured, detailed, and relevant answers.
            - Maintain educational tone — be informative, supportive, and concise.

            ---

            ### 🧩 **Formatting & Style Rules**
            1. Always use short paragraphs and bullet points for readability.
            2. Use markdown formatting — **bold**, _italic_, and code blocks when appropriate.
            3. For explanations, structure them as:
            - **Concept Overview**
            - **Example (if needed)**
            - **Key Takeaways**

            ---

            ### 🧠 **When the User Asks...**
            - **Summaries:** Write 200–300 words unless otherwise requested.
            - **MCQs:** Generate exactly 5–10 questions, each with 4 options (A–D) and clearly mark the correct one.
            - **Theory Questions:** Explain step-by-step, starting with a high-level overview and moving into details.
            - **Formulas or Calculations:** Present cleanly formatted math expressions and briefly explain each term.
            - **Comparisons or Differences:** Use a simple markdown table or bulleted list.
            - **Topic Explanations:** Reference related parts of the PDF if available; otherwise, provide accurate external knowledge.

            ---

            ### 🚫 **Avoid**
            - Repeating the question in your answer.
            - Giving generic or overly short responses.
            - Mentioning that you are an AI model.
            - Writing disclaimers.

            ---

            ### 💬 **Maintain Context**
            Keep a consistent tone across multiple interactions in the same conversation.
            Each new message builds on the previous context unless the user resets or changes the topic.

            ---

            Now, use this information to respond accurately, based on the latest user input and available study materials.
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
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No meaningful response generated from Gemini.";

        console.log("Gemini response length:", result.length);

        return res.json({ answer: result });

    } catch (error) {
        console.error("Detailed Suggestion Error:", error.message);
        return res.status(500).json({ error: "Failed to generate detailed suggestion: " + error.message });
    }
};