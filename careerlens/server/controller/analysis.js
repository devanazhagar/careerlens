const { analyzeWithGemini } = require('../aiservice');
const Student = require('../models/student');
const CollegeStudent = require('../models/collegeStudent');
const IndustryWorker = require('../models/industryWorker');
const User = require('../models/user');
const CareerReport = require('../models/CareerReport');
const Assessment = require('../models/assessment');
const ResumeReport = require('../models/ResumeReport');

const getUserProfile = async (userId) => {
    // Try finding user details in all 3 possible collections
    const student = await Student.findOne({ userID: userId });
    if (student) return { ...student.toObject(), type: 'student' };

    const college = await CollegeStudent.findOne({ userID: userId });
    if (college) return { ...college.toObject(), type: 'collegeStudent' };

    const worker = await IndustryWorker.findOne({ userID: userId });
    if (worker) return { ...worker.toObject(), type: 'industryWorker' };

    return null;
};

const analyzeProfile = async (req, res) => {
    try {
        const { userID } = req.body;
        console.log("🔵 Request received for Career Analysis. UserID:", userID);

        // Fetch basic user info
        const user = await User.findById(userID);
        if (!user) {
            console.error("❌ User not found in DB:", userID);
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch detailed profile info
        const profile = await getUserProfile(userID);
        console.log("🔵 Profile found:", profile ? profile.type : "NONE (N/A)");

        // Merge them for the prompt
        const fullData = {
            ...profile,
            Name: user.Name,
            status: profile ? profile.type : 'N/A'
        };

        const prompt = constructPrompt(fullData, req.body.module || 'career');

        console.log(`🔵 Calling Python AI Service for ${req.body.module || 'career'}...`);
        const result = await analyzeWithGemini(prompt);

        if (result.success) {
            console.log("✅ AI Analysis generated successfully.");

            // Save to DB
            let report = await CareerReport.findOne({ userID: userID });
            if (!report) report = new CareerReport({ userID });

            if (req.body.module === 'social') {
                report.socialAnalysis = { html: result.text, generatedAt: new Date() };
            } else {
                report.careerAnalysis = { html: result.text, generatedAt: new Date() };
            }
            await report.save();

            res.json({ success: true, analysis: result.text });
        } else {
            console.error("❌ AI Service responded with error:", result.error);
            res.json({
                success: false,
                message: result.error,
                analysis: `<h3>System Note: Analysis unavailable</h3><p>AI Error: ${result.error}.</p>`
            });
        }
    } catch (error) {
        console.error("❌ Analysis Controller Crash:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCareerStatus = async (req, res) => {
    try {
        const { userID } = req.query;
        console.log("🔵 Fetching career status for userID:", userID);

        if (!userID) {
            console.error("❌ No userID provided in query");
            return res.status(400).json({ success: false, message: "userID is required" });
        }

        // Initialize default response structure
        const response = {
            success: true,
            status: {
                career: 'pending',
                social: 'pending',
                skill: 'pending',
                resume: 'pending'
            },
            data: {
                career: null,
                social: null,
                skill: null,
                resume: null
            }
        };

        // Fetch all reports with error handling for each
        try {
            const career = await CareerReport.findOne({ userID });
            console.log("🔵 Career report found:", !!career);
            if (career) {
                response.status.career = career.careerAnalysis?.html ? 'completed' : 'pending';
                response.status.social = career.socialAnalysis?.html ? 'completed' : 'pending';
                response.data.career = career.careerAnalysis || null;
                response.data.social = career.socialAnalysis || null;
            }
        } catch (err) {
            console.error("❌ Error fetching CareerReport:", err.message);
        }

        try {
            const skill = await Assessment.findOne({ userID }).sort({ createdAt: -1 });
            console.log("🔵 Skill assessment found:", !!skill);
            if (skill) {
                response.status.skill = skill.finalReport ? 'completed' : 'pending';
                response.data.skill = skill.finalReport || null;
            }
        } catch (err) {
            console.error("❌ Error fetching Assessment:", err.message);
        }

        try {
            const resume = await ResumeReport.findOne({ userID }).sort({ generatedAt: -1 });
            console.log("🔵 Resume report found:", !!resume);
            if (resume) {
                response.status.resume = 'completed';
                response.data.resume = resume;
            }
        } catch (err) {
            console.error("❌ Error fetching ResumeReport:", err.message);
        }

        res.json(response);
    } catch (error) {
        console.error("❌ getCareerStatus Critical Error:", error);
        // Return a safe default response instead of crashing
        res.status(200).json({
            success: true,
            status: {
                career: 'pending',
                social: 'pending',
                skill: 'pending',
                resume: 'pending'
            },
            data: {
                career: null,
                social: null,
                skill: null,
                resume: null
            }
        });
    }
};

const constructPrompt = (profile, mode) => {
    // Construct a rich prompt based on available fields
    let prompt = `Analyze the following profile and provide a ${mode === 'social' ? 'GitHub & LinkedIn branding strategy' : 'career roadmap'}.
    
    Category: ${profile.status || 'N/A'}
    Details: ${JSON.stringify(profile)}
    `;

    if (mode === 'social') {
        prompt += `
        Focus on:
        1. GitHub Profile: Suggest projects to feature, README improvements, and contribution strategy.
        2. LinkedIn: Headline optimization, About section Narrative, and networking advice.
        3. Personal Branding: How to position as an expert in ${profile.interestedField || 'their domain'}.
        
        Format: Return a professional HTML report with <h2> and <p> tags. No markdown blocks.
        `;
    } else {
        prompt += `
        Focus on:
        1. <h2>Career DNA Synthesis</h2>: Their unique value and standing.
        2. <h2>Recommended Path</h2>: Specific milestones for the next 3-5 years.
        3. <h2>Strategic Advice</h2>: High-level guidance for their target role which is ${profile.intentrole || profile.interestedrole || 'N/A'}.
        
        Format: Return a professional HTML report with <h2> and <p> tags. No markdown blocks.
        `;
    }

    return prompt;
};

module.exports = { analyzeProfile, getCareerStatus };
