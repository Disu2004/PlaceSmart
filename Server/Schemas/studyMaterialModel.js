import mongoose from "mongoose";

const studyMaterialSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const StudyMaterial = mongoose.model("StudyMaterial", studyMaterialSchema);
export default StudyMaterial;
