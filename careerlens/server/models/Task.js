const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['career', 'skill', 'social', 'resume', 'general'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    testData: {
        question: String,
        options: [String],
        correctAnswer: String, // Stored as the string itself or index
        explanation: String
    },
    aiGenerated: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
