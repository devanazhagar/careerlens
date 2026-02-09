const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        index: true
    },
    aptitudeResults: {
        score: Number,
        total: Number,
        data: Object
    },
    gameResults: {
        verbal: Object,
        fluency: Object,
        number: Object,
        spatial: Object,
        memory: Object,
        perceptual: Object,
        reasoning: Object
    },
    practicalResults: {
        code: String,
        task: Object,
        aiReview: String
    },
    interviewResults: {
        answer: String,
        question: String,
        aiAnalysis: String
    },
    finalReport: {
        overallScore: Number,
        targetRole: String,
        strengths: [String],
        performanceAnalysis: Object, // 7 areas overview
        skillGaps: [String],
        improvementRoadmap: [String],
        roleFitment: String,
        aiGeneratedAt: { type: Date, default: Date.now }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
