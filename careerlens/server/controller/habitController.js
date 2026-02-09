const HabitPlan = require('../models/HabitPlan');
const CareerReport = require('../models/CareerReport');
const Assessment = require('../models/assessment');
const ResumeReport = require('../models/ResumeReport');
const { analyzeWithGemini } = require('../aiservice');

const generateHabitPlan = async (req, res) => {
    try {
        const { userID } = req.body;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        if (!userID) {
            return res.status(400).json({ success: false, message: "UserID is required" });
        }

        // 1. Gather context from all 4 reports
        const contextData = {};

        const career = await CareerReport.findOne({ userID });
        if (career) {
            contextData.careerGoal = career.careerAnalysis?.html ? "Has career roadmap" : "Pending";
            contextData.socialState = career.socialAnalysis?.html ? "Has social strategy" : "Pending";
        }

        const skill = await Assessment.findOne({ userID }).sort({ createdAt: -1 });
        if (skill && skill.finalReport) {
            contextData.skills = {
                role: skill.finalReport.targetRole,
                strengths: skill.finalReport.strengths,
                roadmap: skill.finalReport.improvementRoadmap
            };
        }

        const resume = await ResumeReport.findOne({ userID }).sort({ generatedAt: -1 });
        if (resume) {
            contextData.resume = {
                score: resume.score,
                missingKeywords: resume.missing_keywords,
                issues: resume.key_issues
            };
        }

        // 2. Construct Prompt for Gemini
        const prompt = `Generate a monthly habit plan (5-7 core habits) for a professional development journey based on these reports:
        Context: ${JSON.stringify(contextData)}
        
        Requirements:
        1. Habits should be actionable and specific (e.g., "Study NumPy library" instead of "Learn AI").
        2. Categorize each habit as 'career', 'skill', 'social', or 'resume'.
        3. Return ONLY a valid JSON array of objects like this: [{"taskName": "...", "category": "..."}]
        4. Focus on consistency and bridging the gaps identified in their reports.
        `;

        const aiResponse = await analyzeWithGemini(prompt);

        if (!aiResponse.success) {
            throw new Error("AI generation failed: " + aiResponse.error);
        }

        // AI might return text with markdown or just JSON
        let tasks = [];
        try {
            let jsonContent = aiResponse.text;

            // Try to find the first '[' and last ']' to extract the JSON array
            const firstBracket = jsonContent.indexOf('[');
            const lastBracket = jsonContent.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1) {
                jsonContent = jsonContent.substring(firstBracket, lastBracket + 1);
            }

            tasks = JSON.parse(jsonContent);
        } catch (e) {
            console.error("❌ Failed to parse AI habits. RAW RESPONSE:", aiResponse.text);
            return res.status(500).json({
                success: false,
                message: "AI response parsing failed. Please try again.",
                debug: aiResponse.text.substring(0, 100)
            });
        }

        // 3. Save or Update Plan
        if (tasks.length === 0) {
            // Fallback default habits if AI returns nothing
            tasks = [
                { taskName: "Review Career Roadmap", category: "career" },
                { taskName: "Upskill in primary technical domain", category: "skill" },
                { taskName: "Optimize LinkedIn Profile", category: "social" },
                { taskName: "Update Resume with latest projects", category: "resume" },
                { taskName: "Network with industry peers", category: "career" }
            ];
        }

        let plan = await HabitPlan.findOne({ userID, month, year });
        if (plan) {
            plan.tasks = tasks.map(t => ({
                taskName: t.taskName || "General Development Task",
                category: t.category || "general",
                completions: new Array(31).fill(false)
            }));
            plan.aiGeneratedAt = new Date();
        } else {
            plan = new HabitPlan({
                userID,
                month,
                year,
                tasks: tasks.map(t => ({
                    taskName: t.taskName || "General Development Task",
                    category: t.category || "general",
                    completions: new Array(31).fill(false)
                }))
            });
        }

        await plan.save();

        res.json({ success: true, plan });

    } catch (error) {
        console.error("❌ Habit Generation Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate AI plan. Using default template instead.",
            error: error.message
        });
    }
};

const getHabitPlan = async (req, res) => {
    try {
        const { userID } = req.query;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        if (!userID) {
            return res.status(400).json({ success: false, message: "UserID is required" });
        }

        const plan = await HabitPlan.findOne({ userID, month, year });

        if (!plan) {
            return res.json({ success: true, plan: null, message: "No plan found for this month" });
        }

        res.json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleHabitDay = async (req, res) => {
    try {
        const { userID, taskId, dayIndex } = req.body; // dayIndex is 0-30
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const plan = await HabitPlan.findOne({ userID, month, year });
        if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

        const task = plan.tasks.id(taskId);
        if (!task) return res.status(404).json({ success: false, message: "Task not found" });

        // Toggle the specific day
        task.completions[dayIndex] = !task.completions[dayIndex];

        // Mark explicitly modified for Mongoose array detection
        plan.markModified('tasks');
        await plan.save();

        res.json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { generateHabitPlan, getHabitPlan, toggleHabitDay };
