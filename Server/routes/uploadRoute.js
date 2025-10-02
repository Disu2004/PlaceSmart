// routes/uploadRouter.js
import express from "express";
import { saveUserImage, loginUser } from "../controllers/uploadController.js";

const router = express.Router();

// POST /userdata → save/register
router.post("/userdata", saveUserImage);

// POST /login → verify user face
router.post("/login", loginUser);

export default router;
