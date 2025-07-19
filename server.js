const express = require('express');
const routes = require('./Routes/api/routes');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const schedule = require('node-schedule');
const updateDiffusionStatus = require('./app/Job/UdapteDiffusion');
// const VideoJob = require('./app/Job/Job');

mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection

db.on('erro', (error) => console.log(error));
db.once('open', () => console.log("Connected to databse"));

const app = express();

// Configuration CORS
const corsOptions = {
    origin: '*', // Autorise uniquement ton frontend
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true // Autorise les cookies et les sessions
};

app.use(cors(corsOptions));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/upload', express.static('upload'));
app.use('/api/',routes);

app.listen(PORT, () => {
    console.log("app started on server : " + process.env.BASE_URL);
})

const rule = new schedule.RecurrenceRule();
rule.second = 0;

// schedule.scheduleJob(rule, VideoJob.jobRunner);

// Toutes les 1 minutes
schedule.scheduleJob(rule, updateDiffusionStatus);