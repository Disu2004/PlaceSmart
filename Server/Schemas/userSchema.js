const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: {
        type: String, // make it a string so you can prefix role (e.g. "A1001")
        required: true,
        unique: true
    },
    userDesignation: {
        type: String,
        enum: ['student', 'teacher', 'admin'], // only these 3 allowed
        required: true
    },
    imageurl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('UserData', userSchema);
