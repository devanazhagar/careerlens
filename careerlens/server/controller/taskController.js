const Task = require('../models/Task');
const CareerReport = require('../models/CareerReport');
const Assessment = require('../models/assessment');
const ResumeReport = require('../models/ResumeReport');
const { analyzeWithGemini } = require('../aiservice');
const fs = require('fs');
const path = require('path');

const logError = (fnName, error) => {
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    const logPath = path.join(logDir, 'server_error.log');
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] ${fnName} Error: ${error.stack || error.message}\n`;
    fs.appendFileSync(logPath, message);
    console.error(`❌ ${fnName} Error:`, error.message);
};

const DEFAULT_TASKS = [
    { title: "Complete Career Path Assessment", category: "career", priority: "High" },
    { title: "Upload and Analyze Resume", category: "resume", priority: "High" },
    { title: "Take Skill Aptitude Test", category: "skill", priority: "Medium" },
    { title: "Optimize LinkedIn Profile Headlines", category: "social", priority: "Medium" },
    { title: "Review Industry Trends in Target Role", category: "career", priority: "Low" }
];

const VALID_CATEGORIES = ['career', 'skill', 'social', 'resume', 'general'];

const generateTasks = async (req, res) => {
    try {
        const { userID } = req.body;
        if (!userID) return res.status(400).json({ success: false, message: "UserID required" });

        // Gather Context
        const context = {};
        const career = await CareerReport.findOne({ userID });
        if (career) {
            context.career = career.careerAnalysis?.html ? "Has career roadmap" : "Pending";
            context.social = career.socialAnalysis?.html ? "Has social strategy" : "Pending";
        }
        const skill = await Assessment.findOne({ userID }).sort({ createdAt: -1 });
        if (skill && skill.finalReport) {
            context.skill = {
                gaps: skill.finalReport.skillGaps,
                roadmap: skill.finalReport.improvementRoadmap
            };
        }
        const resume = await ResumeReport.findOne({ userID }).sort({ generatedAt: -1 });
        if (resume) {
            context.resume = { issues: resume.key_issues, missingKeywords: resume.missing_keywords };
        }

        // If no context at all, use defaults as base
        let taskList = [];
        if (Object.keys(context).length === 0) {
            taskList = DEFAULT_TASKS;
        } else {
            const prompt = `Generate 5-8 actionable, professional development tasks for a user based on this profile context: ${JSON.stringify(context)}.
            Tasks should help improve their portfolio, skills, or professional presence.
            
            Requirements:
            1. Categories must be one of: 'career', 'skill', 'social', 'resume'.
            2. Priority must be one of: 'High', 'Medium', 'Low'.
            3. Return ONLY a valid JSON array of objects: [{"title": "...", "category": "...", "priority": "..."}]
            `;

            const aiResponse = await analyzeWithGemini(prompt);

            if (aiResponse.success) {
                try {
                    const matches = aiResponse.text.match(/\[.*\]/s);
                    if (matches) {
                        taskList = JSON.parse(matches[0]);
                        // Sanitize categories
                        taskList = taskList.map(t => ({
                            ...t,
                            category: VALID_CATEGORIES.includes(t.category?.toLowerCase()) ? t.category.toLowerCase() : 'general'
                        }));
                    }
                } catch (e) {
                    console.error("Task Parsing Fail, using defaults.");
                }
            }

            if (taskList.length === 0) taskList = DEFAULT_TASKS;
        }

        // Wipe old pending generated tasks and replace
        await Task.deleteMany({ userID, status: 'pending', aiGenerated: true });

        const createdTasks = await Task.insertMany(taskList.map(t => ({
            userID,
            ...t,
            status: 'pending',
            aiGenerated: true
        })));

        res.json({ success: true, tasks: createdTasks });
    } catch (error) {
        logError("generateTasks", error);
        res.status(500).json({ success: false, message: "Task generation system temporarily unstable. Please try again." });
    }
};

const getTasks = async (req, res) => {
    try {
        const { userID } = req.query;
        if (!userID) return res.status(400).json({ success: false, message: "UserID required" });
        const tasks = await Task.find({ userID, status: 'pending' }).sort({ createdAt: -1 });
        res.json({ success: true, tasks });
    } catch (error) {
        logError("getTasks", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTaskTest = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        // If test already generated, return it (hide answer)
        if (task.testData && task.testData.question) {
            const taskObj = task.toObject();
            const { correctAnswer, ...clientData } = taskObj.testData;
            return res.json({ success: true, test: clientData });
        }

        // Generate Test using context
        const prompt = `Generate a single multiple-choice question to verify if a user has completed the following task: "${task.title}".
        
        Requirements:
        1. The question should be specific and testing actual knowledge related to the task.
        2. Provide 4 options.
        3. Identify the correct answer.
        4. Return ONLY a valid JSON object: {"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "Exact string of correct option", "explanation": "..."}
        `;

        const aiResponse = await analyzeWithGemini(prompt);
        if (!aiResponse.success) throw new Error("AI failed to generate test");

        let testData;
        try {
            const matches = aiResponse.text.match(/\{.*\}/s);
            if (!matches) throw new Error("No JSON object found in AI response");
            testData = JSON.parse(matches[0]);
        } catch (e) {
            logError("test-parsing", new Error(`Failed to parse: ${aiResponse.text}`));
            throw new Error("Neural link unstable. Parsing error.");
        }

        task.testData = testData;
        await task.save();

        const { correctAnswer, ...clientData } = testData;
        res.json({ success: true, test: clientData });
    } catch (error) {
        logError("getTaskTest", error);
        res.status(500).json({ success: false, message: "Certification system unavailable. " + error.message });
    }
};

const submitTaskTest = async (req, res) => {
    try {
        const { taskId, answer } = req.body;
        const task = await Task.findById(taskId);
        if (!task || !task.testData) return res.status(404).json({ success: false, message: "Task or test not found" });

        // Flexible comparison
        const normalize = (s) => s?.toString().toLowerCase().trim().replace(/[.]/g, '');
        const isCorrect = normalize(task.testData.correctAnswer) === normalize(answer);

        if (isCorrect) {
            task.status = 'completed';
            await task.save();
            res.json({ success: true, passed: true, message: "Certification Verified! Task completed." });
        } else {
            res.json({
                success: true,
                passed: false,
                message: "Validation failed. Reflect on the task requirements and try again.",
                explanation: task.testData.explanation
            });
        }
    } catch (error) {
        logError("submitTaskTest", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { generateTasks, getTasks, getTaskTest, submitTaskTest };
