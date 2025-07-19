const mongoose = require('mongoose');

// user schema
var diffusionSchema = new mongoose.Schema({
    streamUrl: {
        type: String,
        required: true,
    },
    streamableAt: {
        type: Date,
        required: true,
    },
    users: [{ type: String }],
    projectionID: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: 'UPCOMING',
    },
});


//Export the model
module.exports = mongoose.model('Diffusion', diffusionSchema);