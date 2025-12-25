// Schemas/userSchema.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    userDesignation: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
    imageurl: {
      type: String,
      required: true,
    },
    descriptor: {
      type: [Number],
      required: true,
      minlength: 128,
      maxlength: 128,
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserData", userSchema);