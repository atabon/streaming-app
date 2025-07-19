const mongoose = require('mongoose');


const jobSchema = new mongoose.Schema({
    filmPath: {
        type: String,
        require: true
    },
    status: {
        type: String,
        enum: ['pending', 'converting', 'converted', 'failed'],
    },
    duration: Number,
    diffusionDate: Date,
    projectionID: String,
    startTime: Date,
    endTime: Date,
});

module.exports = mongoose.model('Job', jobSchema);