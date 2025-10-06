import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import uploadRoute from "./routes/uploadRoute.js";
import studyMaterialRoute from "./routes/studyMaterialRoutes.js"
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // to parse base64 images
console.log(process.env.MONGODB_URI);
  // MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/user", uploadRoute);
app.use("/api/study-materials", studyMaterialRoute);
// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
