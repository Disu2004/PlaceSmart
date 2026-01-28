import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRouter from "./routes/userRoutes.js";
import studyMaterialRoute from "./routes/studyMaterialRoutes.js"
import questionRoutes from "./routes/questionRoutes.js";
import interviewRoutes from './routes/interviewRoute.js';
import ResumeRoutes from './routes/resumeroutes.js';

dotenv.config();
const app = express();

// CORS Configuration - FIXED
app.use(cors({
  origin: "http://localhost:5173", // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "10mb" }));

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/user", userRouter);
app.use("/api/study-materials", studyMaterialRoute);
app.use("/api/questions", questionRoutes);
app.use("/", interviewRoutes);
app.use("/resume", ResumeRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));