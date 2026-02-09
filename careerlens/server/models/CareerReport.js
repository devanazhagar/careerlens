const mongoose = require('mongoose');

const CareerReportSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    careerAnalysis: {
        html: String,
        generatedAt: { type: Date, default: Date.now }
    },
    socialAnalysis: {
        html: String,
        generatedAt: { type: Date, default: Date.now }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CareerReport', CareerReportSchema);
