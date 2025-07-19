const { exec } = require('child_process');
const fs = require('fs');
require('process');
const axios = require('axios');
const schedule = require('node-schedule');
const Diffusion = require('../../Model/Diffusion');
const STATUS_DIFFUSION = require('../Status/diffusion');

module.exports = DiffusionController = {

    // this methode return nothing as response but can be modified to publish event on a broker
    createDiffusion: async function (req, res) {

        const user_id = req.params.user_id;

        let isAdmin = false;
        let projection = null;
        // verifiy if the user exist an he is an admin
        // await axios.get(`${process.env.GATEWAY}/user/user?is_admin=${user_id}`).then(res => {
        //     isAdmin = res.data.is_admin;
        // }).catch((error) => console.log(error)
        // );

        if (true) {
            // get projection from middle[projection]
            projection = res.projection;
            // get projection date to excute this job 10min befor the geven date and hour
            const projectionDate = new Date(projection.date).toUTCString();
            const cronJobDate = new Date(new Date(projectionDate).getTime() - 10 * 60 * 1000);

            // cron job
            setTimeout(()=>{
                DiffusionController.converVideoForStreaming(projection.film.video, projection);
            });
            
            res.status(200).json({
            'message':' salle de diffusion en cours de creation'
            });
            // const job = schedule.scheduleJob(cronJobDate, async () => { })
        } else {
            // none admin
            res.status(403).json({ 'message': `Cette action n'est pas authoriser(Role d'administration requis)` });
        }

    },


    // convert the uploaded video by the project service
    converVideoForStreaming: async function (videoUri, projection) {

        const uploadFolder = 'upload/events/room/' + projection.id;

        // const lowBitrate = ``;
        // const middleBitrate = ``;
        // const highBitrate = ``;

        // create event folder
        if (!fs.existsSync(uploadFolder)) {
            fs.mkdirSync(uploadFolder, { recursive: true });
        }

        const ffmpegCommand = `ffmpeg -i ${videoUri} -codec:v libx264 -codec:a aac -f hls -hls_time 8 -hls_segment_filename "${uploadFolder}/segment%05d.ts" -start_number 0 ${uploadFolder + '/index.m3u8'}`;

        exec(ffmpegCommand, (error, _stdout, _stderr) => {
            if (error) {
                console.log('error occured ' + error.message);

            } else {
                console.log("ok");

            }

        });
        
        // create new diffusion
        const diffusion = new Diffusion({
            streamUrl: `${process.env.SERVER}/${uploadFolder}/index.m3u8`,
            streamableAt: new Date(projection.dateDif),
            projectionID: projection.id,
            duration: 400,
        });
        // save diffusion
        try {
            const newDiffusion = await diffusion.save();
            
        } catch (error) {

            console.log({
                'message': error.message,
            })
        }
    },

    // add user for an existing event(diffusion)
    addUserToDiffusion: async (req, res) => {

        const user_id = req.params.user_id;
        const projection_id = req.params.projection_id;

        let ticket;

        // verifiy if the user pay ticket
        await axios.get(`${process.env.GATEWAY}/ticket/${projection_id}/${user_id}`).then(res => {
            ticket = res.data.ticket;
        }).catch((error) => console.log(error)
        );


        if (ticket != null && ticket.user_id === user_id) {
            let oldDiff = await Diffusion.findOne({ projectionID: projection_id });
            if (oldDiff != null) {
                oldDiff.users.push(ticket.user_id);
                await oldDiff.save();

                res.status(200).json({
                    'message': `User added successfuly`,
                    'diffusion_date': `${oldDiff.streamableAt}`,
                });
            } else {
                res.status(404).json({
                    'message': `Projection with id ${projection_id} don't existe`,
                });
            }
        }

        res.status(404).json({
            'message': 'subscription_require'
        });
    },


    // join diffusion
    joinRoom: async (req, res) => {

        const user_id = req.params.userid;
        const diff_id = req.params.diffid;

        const theRoom = await Diffusion.findOne({
            _id: diff_id,
        });

        if (theRoom == null) {
            res.status(404).json({
                'message': 'Cette diffusion n\'existe pas.'
            });
        }

        if (theRoom.users.find(user_id) == null) {
            res.status(404).json({
                'message': `subscription_require`
            });
        }

        if (theRoom.status != 'LIVE') {
            res.status(301).json({
                'message': `${STATUS_DIFFUSION.keyoff(theRoom.status)}`,
                'status': `${theRoom.status}`,
            });
        }

        const today = new Date().getTime();
        const dayToStartEvent = theRoom.streamableAt.getTime();

        const duration = theRoom.duration;
        const delay = (today - dayToStartEvent) / 1000;

        const segmentDuration = 10;
        const totalNumberOfSegment = duration / segmentDuration;
        const actualSegmentNumber = Math.floor(delay / segmentDuration);

        // segments
        const segments = []
        for (let i = actualSegmentNumber; i < totalNumberOfSegment; ++i) {
            segments.push(`http://localhost:3001/upload/events/room/1/segment${i.toString().padStart(5, '0')}.ts`)
        }

        const userStreamData = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:${duration}\n#EXT-X-MEDIA-SEQUENCE:${actualSegmentNumber}\n${segments.map(seg =>
            `#EXTINF:${segmentDuration},\n${seg}`
        ).join('\n')}\n#EXT-X-ENDLIST`;

        // create user streamable m3u8 file corresponding
        const user_file = `upload/events/room/${theRoom.projectionID}/${user_id}.m3u8`;
        fs.mkdirSync(user_file, { recursive: true });

        exec(`echo ${userStreamData} > ${user_file}`, (error, _stdout, _stderr) => {
            if (error) {
                console.log('error occured ' + error.message);
            }

        });

        res.set('Content-Type', 'application/x-mpegURL');
        res.status(200).json({
            'message': `${STATUS_DIFFUSION.LIVE}`,
            'data': `${user_file}`,
            'status': `${theRoom.status}`,
        });

    },
    jobTest: (req, res) => {

        return res.status(200).json({
            "greeting": "greeting"
        });
    }
}

