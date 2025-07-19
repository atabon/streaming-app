const { exec } = require('child_process');
const fs = require('fs');

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DB_URI)
const db = mongoose.connection

db.on('erro', (error) => console.log(error));
db.once('open', () => console.log("Connected to databse"));


const Job = require("../Model/Job");
const schedule = require('node-schedule');
const Diffusion = require('../Model/Diffusion');

const VideoJob = {
    // convert the uploaded video by the project service
    convertVideoForStreaming: async function (job) {

        const uploadFolder = 'upload/events/room/' + job.projectionID;

        // const lowBitrate = ``;
        // const middleBitrate = ``;
        // const highBitrate = ``;

        // create event folder
        if (!fs.existsSync(uploadFolder)) {
            fs.mkdirSync(uploadFolder, { recursive: true });
        }

        const ffmpegCommand = `ffmpeg -i ${job.filmPath} -codec:v libx264 -codec:a aac -f hls -hls_time 7 -hls_segment_filename "${uploadFolder}/segment%05d.ts" -start_number 0 ${uploadFolder + '/index.m3u8'}`;

        exec(ffmpegCommand, async (error, _stdout, _stderr) => {
            if (error) {
                job.status = 'failed';
                job.endTime = new Date();
                await job.save();
                console.log('error occured ' + error.message);
            } else {

                job.status = 'converted';
                job.endTime = new Date();

                await job.save();

                // create new diffusion
                const diffusion = new Diffusion({
                    streamUrl: `${process.env.SERVER}/${uploadFolder}/index.m3u8`,
                    streamableAt: job.diffusionDate,
                    projectionID: job.projectionID,
                    duration: job.duration,
                });
                // save diffusion
                try {
                    const newDiffusion = await diffusion.save();
                    console.log
                        ({
                            'message': 'salle de diffusion cree',
                            'diffusion': newDiffusion,
                        });
                } catch (error) {

                    console.log({
                        'message': error.message,
                    })
                }

            }
        });

    },

    jobRunner: async () => {

        
        const pendingJob = await Job.find({ status: 'pending' })
        .sort({ diffusionDate: 1 })
        .limit(1);
        
        if (pendingJob.length == 0) {
            console.log("No job yet.");
            return;
        }
    
        
        const runningJob = await Job.find({ status: 'converting' }).get();

        if (runningJob) {
            console.log("Some job are running");
            return;
        }

        const job = pendingJob[0];
        job.status = 'converting';
        job.startTime = new Date();
        await job.save();

        try {
            VideoJob.convertVideoForStreaming(job);
        } catch (error) {
            job.status = 'failed';
            job.endTime = new Date();
            await job.save();
        }

        // delete all converted jobs
        // try {
        //     await Job.deleteMany({ status: { $in: ['converted', 'failed'] } })
        //     console.log('Job db clear');

        // } catch (error) {
        //     console.log(error)
        // }
    },
}

const rule = new schedule.RecurrenceRule();
rule.second = 0;

schedule.scheduleJob(rule, VideoJob.jobRunner)