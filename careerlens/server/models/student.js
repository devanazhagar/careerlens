const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['student', 'collegeStudent', 'industryWorker'],
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String, // Stores the path to the uploaded file
        default: ''
    },
    schoolName: {
        type: String,
        required: true
    },
    standard: {
        type: String,
        required: true //SHOULD INCREMENT BASED ON THE year
    },
    board: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true  //dropdown (commerce-business maths ,commerce-ca,bio maths,CS)
    },
    interestedDegree: {
        type: String,
        required: true
    },
    passion: {
        type: String,
        required: true
    },
    interestedCollege: {
        type: String,
        required: true
    },
    hobbies: {
        type: [String], // Array of strings
        default: []
    },
    dob: {
        type: Date,
        required: true
    },
    languagePreference: {
        type: String,
        required: true
    },
    englishProficiency: {
        type: String,
        required: true //excellent,intermediate,beginner
    },
    currentGrade: {
        type: String,
        required: true //percentage
    },
    lastExamPercentage: {
        type: String,
        required: true //percentage
    },
    onlineCourses: {
        type: String,
        required: true // yes/no any online course taken 
    },
    competitions: {
        type: String,
        required: true // yes/no any competition participated
    },
    techExposure: {
        type: String,
        required: true // yes/no any technical exposure
    },
     certifications: {
        type: String,
        required: true // yes/no any certifications
    },
    parentalInfluence: {
        type: String,
        required: true // yes/no
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', StudentSchema);
