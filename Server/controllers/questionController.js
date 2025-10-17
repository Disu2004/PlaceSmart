import Question from "../Schemas/questionSchema.js";

// ================================
// 1️⃣ Upload single question
// ================================
export const uploadQuestion = async (req, res) => {
    try {
        const { userID, question, subject } = req.body;

        if (!userID || !question || !subject)
            return res.status(400).json({ success: false, error: "All fields are required (userID, question, subject)" });

        const newQuestion = new Question({
            userID,
            question,
            subject
        });

        await newQuestion.save();

        return res.json({
            success: true,
            message: "✅ Question uploaded successfully!",
            question: newQuestion
        });
    } catch (err) {
        console.error("Error uploading question:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ================================
// 2️⃣ Upload multiple questions
// ================================
export const uploadMultipleQuestions = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!Array.isArray(questions) || questions.length === 0)
            return res.status(400).json({ success: false, error: "Questions array is required" });

        const savedQuestions = await Question.insertMany(questions);
        console.log("Questions Saved")
        return res.json({
            success: true,
            message: `✅ ${savedQuestions.length} questions uploaded successfully!`,
            questions: savedQuestions
        });
    } catch (err) {
        console.error("Error uploading multiple questions:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ================================
// 3️⃣ Fetch all questions
// ================================
export const getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find().sort({ timestamp: -1 });
        console.log("Questions ")
        return res.json({ success: true,  questions: questions  , "message": "✅ Questions fetched successfully!"});
    } catch (err) {
        console.error("Error fetching all questions:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ================================
// 4️⃣ Fetch questions by userID
// ================================
export const getQuestionsByUser = async (req, res) => {
    try {
        const { userID } = req.params;

        if (!userID)
            return res.status(400).json({ success: false, error: "User ID is required" });

        const questions = await Question.find({ userID }).sort({ timestamp: -1 });

        if (questions.length === 0)
            return res.status(404).json({ success: false, error: "No questions found for this user" });

        return res.json({ success: true, questions });
    } catch (err) {
        console.error("Error fetching user questions:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
