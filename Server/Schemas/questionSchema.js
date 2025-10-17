const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    userID: {
        type: Number,
        required: true,
        ref: 'User'
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create model
const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;
