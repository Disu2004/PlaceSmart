import express from "express";
import { uploadImage } from "../controllers/uploadController.js";

const router = express.Router();

// POST /upload
router.post("/", uploadImage);

export default router;
