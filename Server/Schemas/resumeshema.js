import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  resumeId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  html: {
    type: String,
    required: true
  },
  css: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;