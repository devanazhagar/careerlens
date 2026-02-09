const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const { analyzeWithGemini } = require('../aiservice');

// Helper to call AI via Bridge
const callPythonGemini = async (prompt) => {
    const result = await analyzeWithGemini(prompt);
    if (result.success) return result.text;
    throw new Error(result.error || "AI Bridge Error");
};

const analyzeResume = async (req, res) => {
    try {
        let resumeText = '';
        if (req.file) {
            const filePath = req.file.path;
            const fileExt = path.extname(filePath).toLowerCase();
            if (fileExt === '.pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                resumeText = (await pdf(dataBuffer)).text;
            } else {
                resumeText = fs.readFileSync(filePath, 'utf8');
            }
        } else if (req.body.text) {
            resumeText = req.body.text;
        } else {
            return res.status(400).json({ message: "No resume provided" });
        }

        const prompt = `
        You are an expert ATS Resume Analyzer.
        Analyze this resume text and provide a JSON response strictily following this format:
        { "score": <0-100>, "summary": "...", "key_issues": [], "improvements": [], "ats_compatibility": "...", "missing_keywords": [] }
        
        Resume: "${resumeText.substring(0, 10000)}"
        
        Return ONLY valid JSON.
        `;

        console.log("🔵 Calling Python Bot for Resume Analysis...");
        let analysisRaw = await callPythonGemini(prompt);
        const { cleanJSON } = require('../utils/jsonHelper');
        const analysis = cleanJSON(analysisRaw);

        // PERSISTENCE
        const ResumeReport = require('../models/ResumeReport');
        const User = require('../models/user');

        // Find or create report
        let report = await ResumeReport.findOne({ userID: req.body.userID });
        if (!report) report = new ResumeReport({ userID: req.body.userID });

        Object.assign(report, {
            score: analysis.score,
            summary: analysis.summary,
            key_issues: analysis.key_issues,
            improvements: analysis.improvements,
            ats_compatibility: analysis.ats_compatibility,
            missing_keywords: analysis.missing_keywords,
            extracted_text: resumeText,
            generatedAt: new Date()
        });
        await report.save();

        res.status(200).json({ success: true, analysis, extracted_text: resumeText });

    } catch (error) {
        console.error("Resume Analysis Error:", error);
        // Fallback
        return res.status(200).json({
            success: true,
            extracted_text: "Mock Text due to Error",
            analysis: { score: 70, summary: "Could not run local Python analysis. " + error.message, key_issues: ["Server Error"], improvements: [], ats_compatibility: "Unknown", missing_keywords: [] }
        });
    }
};

const chatWithFiles = async (req, res) => {
    const { messages } = req.body;
    const lastMsg = messages[messages.length - 1].content;
    // We only send the last message + specific context instruction to keep payload small for CLI
    // Or we could reconstruct conversation string.

    console.log("🔵 Calling Python Bot for Chat...");
    try {
        const reply = await callPythonGemini(`You are a career assistant. User asks: ${lastMsg}`);
        res.status(200).json({ success: true, reply });
    } catch (e) {
        res.status(200).json({ success: true, reply: "I'm having trouble connecting to the Python brain. " + e.message });
    }
}

const generateResume = async (req, res) => {
    const { current_resume_text } = req.body;
    const prompt = `Refine this resume to be ATS compliant. Return JSON: { "refined_resume_markdown": "...", "improvement_guide_markdown": "..." } \n\n Resume: ${current_resume_text.substring(0, 5000)}`;

    console.log("🔵 Calling Python Bot for Generation...");
    try {
        let raw = await callPythonGemini(prompt);
        const { cleanJSON } = require('../utils/jsonHelper');
        const data = cleanJSON(raw);
        res.status(200).json({ success: true, data });
    } catch (e) {
        res.status(200).json({ success: true, data: { refined_resume_markdown: "Error: " + e.message, improvement_guide_markdown: "Check logs." } });
    }
};

module.exports = { analyzeResume, chatWithFiles, generateResume };
