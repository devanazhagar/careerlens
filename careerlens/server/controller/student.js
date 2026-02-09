const Student = require('../models/student');
const User = require('../models/user');

const addStudentInfo = async (req, res) => {
    try {
        const userID = req.body.userID || req.user.id; // Assuming userauth middleware sets req.user.id or you pass it in body

        // Destructure all required fields from body
        const {
            pincode, city, address, schoolName, standard, board, status,
            subject, interestedDegree, passion, interestedCollege, hobbies,
            dob, languagePreference, englishProficiency, currentGrade,
            lastExamPercentage, onlineCourses, competitions, techExposure,
            parentalInfluence
        } = req.body;

        // Check if file is uploaded
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Profile photo is required." });
        }

        const profilePhoto = 'uploads/' + req.file.filename;

        // Check required fields
        if (!userID || !pincode || !city || !address || !schoolName || !standard || !board ||
            !subject || !interestedDegree || !passion || !interestedCollege || !dob ||
            !languagePreference || !englishProficiency || !currentGrade || !lastExamPercentage ||
            !onlineCourses || !competitions || !techExposure || !parentalInfluence) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
                received: req.body
            });
        }

        // Check if student info already exists for this user
        let student = await Student.findOne({ userID });
        if (student) {
            return res.status(400).json({ success: false, message: "Student info already exists for this user." });
        }

        // Create new student
        const newStudent = new Student({
            userID,
            pincode,
            city,
            address,
            profilePhoto,
            schoolName,
            standard,
            board,
            subject,
            interestedDegree,
            passion,
            interestedCollege,
            hobbies: Array.isArray(hobbies) ? hobbies : [hobbies], // Ensure hobbies is an array
            status,
            dob,
            languagePreference,
            englishProficiency,
            currentGrade,
            lastExamPercentage,
            onlineCourses,
            competitions,
            techExposure,
            certifications: req.body.certifications || 'no', // Handle if missing since not in strict check yet? 
            parentalInfluence
        });

        await newStudent.save();

        res.json({
            success: true,
            message: "Student information added successfully.",
            data: newStudent
        });

    } catch (error) {
        console.error("Error adding student info:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

const getStudentInfo = async (req, res) => {
    try {
        const { userID } = req.body; // Or from req.params / req.user

        if (!userID) {
            return res.status(400).json({ success: false, message: "UserID is required." });
        }

        const student = await Student.findOne({ userID });

        if (!student) {
            return res.status(404).json({ success: false, message: "Student info not found." });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addStudentInfo, getStudentInfo };
