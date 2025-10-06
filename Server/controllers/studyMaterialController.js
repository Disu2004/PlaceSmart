import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import StudyMaterial from "../Schemas/studyMaterialModel.js";
import fetch from "node-fetch";
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
        console.log(prompt, materialUrl, name);

        if (!prompt || !materialUrl) {
            return res.status(400).json({ error: "Both 'prompt' and 'materialUrl' are required" });
        }

        // Build the AI instruction dynamically
        const aiInstruction = `
User prompt: "${prompt}"
The user uploaded a study material PDF at: ${materialUrl}
Subject: ${name}

You are an AI study assistant. Follow these rules:
- Understand the user's prompt and respond accordingly.
- If the prompt is a question, answer based on the PDF content.
- If the prompt is to summarize, summarize the PDF content concisely.
- If the prompt is to generate MCQs, provide exactly 10 MCQs with 4 options each.
- For other instructions, follow them literally and contextually.
- Use a structured format only if the prompt requests it.
- Do NOT repeat generic headings unless requested.
- Keep the response clear, concise, and helpful.
- If PDF content is not directly accessible, provide an accurate and relevant answer based on the subject.`;


        // Send prompt + PDF URL + instruction to AI
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: aiInstruction }]
                        }
                    ]
                }),
            }
        );

        const data = await response.json();
        console.log(data);

        const result =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No meaningful response generated from Gemini.";

        return res.json({ answer: result });

    } catch (error) {
        console.error("Detailed Suggestion Error:", error.message);
        return res.status(500).json({ error: "Failed to generate detailed suggestion." });
    }
};
