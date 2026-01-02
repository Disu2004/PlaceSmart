import Resume from '../Schemas/resumeshema.js'
import mongoose from 'mongoose';

// Helper function to get next sequential ID
async function getNextId() {
  try {
    const counter = await mongoose.connection.db.collection('counters').findOneAndUpdate(
      { _id: 'resumeId' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    if (!counter.value) return (await Resume.countDocuments()) + 1;
    return counter.value.seq;
  } catch (err) {
    console.log("Counter error, fallback:", err.message);
    return (await Resume.countDocuments()) + 1;
  }
}

// Get all resumes
export const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ resumeId: 1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single resume by ID
export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ resumeId: Number(req.params.id) });
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new resume
export const createResume = async (req, res) => {
  try {
    const { name, html, css } = req.body;
    
    // Validation
    if (!name || !html || !css) {
      return res.status(400).json({ error: "Missing required fields: name, html, css" });
    }
    
    const resumeId = await getNextId();
    const newResume = new Resume({ resumeId, name, html, css });
    await newResume.save();
    
    res.json({ success: true, resumeId, message: "Resume created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update existing resume
export const updateResume = async (req, res) => {
  try {
    const { name, html, css } = req.body;
    
    const updated = await Resume.findOneAndUpdate(
      { resumeId: Number(req.params.id) },
      { name, html, css },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ error: "Resume not found" });
    }
    
    res.json({ success: true, message: "Resume updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete resume
export const deleteResume = async (req, res) => {
  try {
    const deleted = await Resume.findOneAndDelete({ resumeId: Number(req.params.id) });
    
    if (!deleted) {
      return res.status(404).json({ error: "Resume not found" });
    }
    
    res.json({ success: true, message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};