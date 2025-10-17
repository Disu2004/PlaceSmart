import express from "express";
import {
    uploadQuestion,
    uploadMultipleQuestions,
    getAllQuestions,
    getQuestionsByUser
} from "../controllers/questionController.js"

const router = express.Router();

// // Routes
router.post("/upload", uploadQuestion);
router.post("/upload-multiple", uploadMultipleQuestions);
router.get("/get-questions", getAllQuestions);
router.get("/:userID", getQuestionsByUser);

export default router;
