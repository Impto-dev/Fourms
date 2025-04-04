const mongoose = require('mongoose');

const coverageSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    lines: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    statements: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    branches: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    functions: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

// Index for efficient querying
coverageSchema.index({ date: -1 });

const Coverage = mongoose.model('Coverage', coverageSchema);

module.exports = { Coverage }; 