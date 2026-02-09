const mongoose = require('mongoose');

const IndustryWorkerSchema = new mongoose.Schema({
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
    address: {
        type: String,
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
    companyName: {
        type: String,
        required: true
    },
    workLocation: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    skills: {
        type: [String],
        default: []
    },
    experience: {
        type: String, // String description as per common simple requirements, or could be object structure if detailed
        required: true
    },
    interestedRole: {
        type: [String],
        default: []
    },
    education: {
        type: String,
        required: true
    },
    currentCTC: {
        type: String,
        required: true
    },
    expectedCTC: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    roleswitch:{
        type: String, // yes/no
        required: true
    },
   intentrole:{
    type: String,
    required: true
   }
}, { timestamps: true });

module.exports = mongoose.model('IndustryWorker', IndustryWorkerSchema);
