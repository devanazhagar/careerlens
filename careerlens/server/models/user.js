const mongoose = require('mongoose')
require('express')


const UserModels = mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    userID: {
        type: String,
        required: true,
        unique: true
    },
    ResetOTP: {
        type: String,
        default: ''
    },
    ResetOTPexpireAt: {
        type: Number,
        default: 0
    },
    userLinkedinProfileUrl: {
        type: String,
        default: ''
    },
    linkedinSub: {
        type: String,
        default: ''
    },
    linkedinAccessToken: {
        type: String,
        default: ''
    },
    githubAccessToken: {
        type: String,
        default: ''
    }


})

module.exports = mongoose.model('UserSchema', UserModels)