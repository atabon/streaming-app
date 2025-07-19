const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const Diffusion = require('../../Model/Diffusion');
const STATUS_DIFFUSION = require('../Status/diffusion');
const schedule = require('node-schedule');

module.exports = {
  createDiffusion: async function (req, res) {
    const user_id = req.params.user_id;

    try {
      const userResp = await axios.get(`${process.env.GATEWAY}/api/users/${user_id}`);
      if (!userResp.data || !userResp.data.isAdmin) {
        return res.status(403).json({ message: "Action interdite. Rôle admin requis." });
      }

      const projection = res.projection;
      const projectionDate = new Date(projection.date);
      const jobDate = new Date(projectionDate.getTime() - 10 * 60 * 1000);

      schedule.scheduleJob(jobDate, () => {
        module.exports.convertVideoForStreaming(projection.film.video, projection);
      });

      res.status(200).json({ message: "Salle de diffusion en cours de création." });

    } catch (err) {
      console.log(err.message);
      res.status(500).json({ message: "Erreur lors de la vérification du rôle." });
    }
  },

  convertVideoForStreaming: async function (videoUri, projection) {
    const folder = `upload/events/room/${projection.id}`;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    const ffmpegCommand = `ffmpeg -i ${videoUri} -codec:v libx264 -codec:a aac -f hls -hls_time 8 -hls_segment_filename "${folder}/segment%05d.ts" -start_number 0 ${folder}/index.m3u8`;

    exec(ffmpegCommand, async (error) => {
      if (error) return console.log("Erreur ffmpeg:", error.message);

      const diffusion = new Diffusion({
        streamUrl: `${process.env.SERVER}/${folder}/index.m3u8`,
        streamableAt: new Date(projection.dateDif),
        projectionID: projection.id,
        duration: 400,
        users: [],
        status: 'PENDING'
      });

      try {
        await diffusion.save();
        console.log("Diffusion créée.");
      } catch (e) {
        console.log("Erreur création diffusion:", e.message);
      }
    });
  },

  addUserToDiffusion: async (req, res) => {
    const { user_id, projection_id } = req.params;

    try {
      const ticketResp = await axios.get(`${process.env.GATEWAY}/ticket/${projection_id}/${user_id}`);
      const ticket = ticketResp.data.ticket;

      if (ticket && ticket.user_id === user_id) {
        const diff = await Diffusion.findOne({ projectionID: projection_id });
        if (!diff) return res.status(404).json({ message: "Diffusion introuvable." });

        if (!diff.users.includes(user_id)) {
          diff.users.push(user_id);
          await diff.save();
        }

        return res.status(200).json({
          message: "Utilisateur ajouté.",
          diffusion_date: diff.streamableAt
        });
      }

      res.status(403).json({ message: "Ticket requis." });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  joinRoom: async (req, res) => {
    const { userid, diffid } = req.params;

    const room = await Diffusion.findById(diffid);
    if (!room) return res.status(404).json({ message: "Diffusion introuvable." });

    if (!room.users.includes(userid)) {
      return res.status(403).json({ message: "Accès non autorisé. Ticket requis." });
    }

    if (room.status !== 'LIVE') {
      return res.status(200).json({
        message: STATUS_DIFFUSION.keyoff(room.status),
        status: room.status
      });
    }

    // 🔀 Générer segments personnalisés (tu peux le laisser tel quel)
    res.status(200).json({
      message: "LIVE",
      status: room.status,
      data: room.streamUrl // simplification ici
    });
  }
};
