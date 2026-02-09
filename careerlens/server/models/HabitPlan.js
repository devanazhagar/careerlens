const mongoose = require('mongoose');

const HabitPlanSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
        index: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    tasks: [{
        taskName: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['career', 'skill', 'social', 'resume', 'general'],
            default: 'general'
        },
        completions: {
            type: [Boolean],
            default: new Array(31).fill(false)
        }
    }],
    aiGeneratedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure one plan per user per month
HabitPlanSchema.index({ userID: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('HabitPlan', HabitPlanSchema);
