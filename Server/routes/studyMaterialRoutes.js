import express from "express";
import {
  uploadStudyMaterial,
  getAllStudyMaterials,
  upload,
  downloadMaterial,
  getMyMaterials,
  deleteMaterial,
  detailedSuggestion
} from "../controllers/studyMaterialController.js";

const router = express.Router();

// 📤 Upload a new study material
router.post("/upload", upload.single("file"), uploadStudyMaterial);

// 📂 Get all study materials
router.get("/", getAllStudyMaterials);
router.get("/materials/:id/download",downloadMaterial)
router.get("/my-materials/:userId", getMyMaterials);
router.delete("/deletematerial/:id/delete" , deleteMaterial);
router.post("/detailed-suggestion", detailedSuggestion);
export default router;
