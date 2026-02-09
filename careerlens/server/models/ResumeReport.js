const mongoose = require('mongoose');

const ResumeReportSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    score: Number,
    summary: String,
    key_issues: [String],
    improvements: [String],
    ats_compatibility: String,
    missing_keywords: [String],
    extracted_text: String,
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ResumeReport', ResumeReportSchema);
