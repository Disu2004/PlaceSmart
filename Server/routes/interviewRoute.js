import express from 'express';
import {
    generateInterviewQuestions,
    getFollowUpQuestion,
    reviewInterviewResponse,
    evaluateCompleteInterview
} from '../controllers/interviewController.js';

const router = express.Router();

// Generate interview questions - supports both GET and POST
router.get('/generate-questions', generateInterviewQuestions);
router.post('/generate-questions', generateInterviewQuestions);

// Follow-up question endpoint
router.post('/followup', getFollowUpQuestion);

// Review single answer endpoint
router.post('/review', reviewInterviewResponse);

// Evaluate complete interview endpoint
router.post('/evaluatecompleteinterview', evaluateCompleteInterview);

export default router;