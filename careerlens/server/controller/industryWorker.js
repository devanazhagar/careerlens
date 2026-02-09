const IndustryWorker = require('../models/industryWorker');

// Create a new industry worker profile
const createIndustryWorker = async (req, res) => {
    try {
        const {
            userID,
            status,
            dob,
            address,
            pincode,
            city,
            companyName,
            workLocation,
            role,
            domain,
            skills,
            experience,
            interestedRole,
            education,
            currentCTC,
            expectedCTC
        } = req.body;

        // Check if user already has a profile
        const existingWorker = await IndustryWorker.findOne({ userID });
        if (existingWorker) {
            return res.status(400).json({ success: false, message: 'Industry Worker profile already exists' });
        }

        // Handle profile photo
        let profilePhoto = '';
        if (req.file) {
            profilePhoto = 'uploads/' + req.file.filename; // Store the file path
        }

        const newIndustryWorker = new IndustryWorker({
            userID,
            status,
            dob,
            address,
            pincode,
            city,
            companyName,
            workLocation,
            role,
            domain,
            skills: Array.isArray(skills) ? skills : JSON.parse(skills || '[]'),
            experience,
            interestedRole: Array.isArray(interestedRole) ? interestedRole : JSON.parse(interestedRole || '[]'),
            education,
            currentCTC,
            expectedCTC,
            profilePhoto
        });

        await newIndustryWorker.save();
        res.status(201).json({ success: true, message: 'Industry Worker profile created successfully', data: newIndustryWorker });

    } catch (error) {
        console.error('Error creating Industry Worker profile:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

// Get industry worker profile by userID
const getIndustryWorker = async (req, res) => {
    try {
        const { userID } = req.params;
        const worker = await IndustryWorker.findOne({ userID });

        if (!worker) {
            return res.status(404).json({ success: false, message: 'Industry Worker profile not found' });
        }

        res.status(200).json({ success: true, data: worker });

    } catch (error) {
        console.error('Error fetching Industry Worker profile:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
};

module.exports = {
    createIndustryWorker,
    getIndustryWorker
};
