const mongoose = require('mongoose');

const CollegeStudentSchema = new mongoose.Schema({
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
    dob: {
        type: Date,
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
    languagePreference: {
        type: String, // Kept as String to match simplest requirement, can be array if needed
        required: true
    },
    englishProficiency: {
        type: String,
        required: true
    },
    collegeName: {
        type: String,
        required: true
    },
    degree: {
        type: String,
        required: true //currently pursuing or finished
    },
    academicYear: {
        type: String,
        required: true //total course academic year 2023-2027
    },
    interestedField: {
        type: [String],
        default: []
    },
    interestedrole:{
        type: [String],
        default: []
    },
    passion: {
        type: [String],
        default: []
    },
    interestedCompany: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },
    certifications: [{
        name: String,
        issuer: String,
        date: Date
    }],
    projects: [{
        title: String,
        description: String,
        link: String
    }],
    experience: [{
        company: String,
        role: String,
        duration: String,
        description: String
    }],
    cgpa: {
        type: String, // String to allow '9.5' or formats like '9.5/10'
        required: true
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    careerIntentTimeline: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('CollegeStudent', CollegeStudentSchema);
