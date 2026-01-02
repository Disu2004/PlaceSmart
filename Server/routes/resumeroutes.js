import express from 'express';
import {
  getAllResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume
} from '../controllers/resumecontroller.js';

const router = express.Router();

// Public routes
router.get('/resumes', getAllResumes);
router.get('/resumes/:id', getResumeById);
// Admin route
router.post('/admin/resumes', createResume);
router.put('/admin/resumes/:id', updateResume);
router.delete('/admin/resumes/:id', deleteResume);

export default router;