const CollegeStudent = require('../models/collegeStudent');

exports.registerCollegeStudent = async (req, res) => {
    try {
        const {
            userID, dob, pincode, city, address, languagePreference, englishProficiency, collegeName,
            degree, academicYear, interestedField, passion, interestedCompany, interestedrole,
            skills, certifications, projects, experience, cgpa, careerIntentTimeline, status
        } = req.body;

        // Check if user already has a student profile
        const existingStudent = await CollegeStudent.findOne({ userID });
        if (existingStudent) {
            return res.status(400).json({ message: "Student profile already exists for this user." });
        }

        const newStudent = new CollegeStudent({
            userID,
            status,
            dob,
            pincode,
            city,
            address,
            languagePreference,
            englishProficiency,
            collegeName,
            degree,
            academicYear,
            interestedField: Array.isArray(interestedField) ? interestedField : JSON.parse(interestedField || '[]'),
            passion: Array.isArray(passion) ? passion : JSON.parse(passion || '[]'),
            interestedCompany: Array.isArray(interestedCompany) ? interestedCompany : JSON.parse(interestedCompany || '[]'),
            interestedrole: Array.isArray(interestedrole) ? interestedrole : JSON.parse(interestedrole || '[]'),
            skills: Array.isArray(skills) ? skills : JSON.parse(skills || '[]'),
            certifications: Array.isArray(certifications) ? certifications : JSON.parse(certifications || '[]'),
            projects: Array.isArray(projects) ? projects : JSON.parse(projects || '[]'),
            experience: Array.isArray(experience) ? experience : JSON.parse(experience || '[]'),
            cgpa,
            profilePhoto: req.file ? 'uploads/' + req.file.filename : '', // Assuming Multer is used for file upload
            careerIntentTimeline
        });

        await newStudent.save();
        res.status(201).json({ message: "College Student profile created successfully", student: newStudent });

    } catch (error) {
        console.error("Error registering college student:", error);
        res.status(500).json({ message: "Server error: " + error.message, error: error.message });
    }
};

exports.getCollegeStudent = async (req, res) => {
    try {
        const { userID } = req.params;
        const student = await CollegeStudent.findOne({ userID });

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        res.status(200).json(student);

    } catch (error) {
        console.error("Error fetching college student:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
