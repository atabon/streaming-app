const Diffusion = require('../Model/Diffusion');
const axios = require('axios');

const STATUS = {
  PENDING: 'PENDING',
  LIVE: 'LIVE',
  EXPIRED: 'EXPIRED'
};

async function updateDiffusionStatus() {
  try {
    const now = new Date();
    const diffusions = await Diffusion.find({ status: { $in: [STATUS.PENDING, STATUS.LIVE] } });

    for (const diff of diffusions) {
      const start = new Date(diff.streamableAt).getTime();
      const end = start + diff.duration * 1000;
      const nowTime = now.getTime();

      let newStatus = diff.status;

      if (nowTime >= start && nowTime <= end && diff.status !== STATUS.LIVE) {
        newStatus = STATUS.LIVE;
      } else if (nowTime > end && diff.status !== STATUS.EXPIRED) {
        newStatus = STATUS.EXPIRED;
      }

      if (newStatus !== diff.status) {
        diff.status = newStatus;
        await diff.save();

        // 💌 Notifier les utilisateurs (exemple avec console)
        for (const userId of diff.users) {
          console.log(`Notify user ${userId}: Diffusion ${diff.projectionID} est maintenant ${newStatus}`);
          // 👉 Tu peux appeler une vraie API d'envoi d'email/notification ici
          // await axios.post(`${process.env.NOTIFICATION_URL}/send`, {...})
        }
      }
    }

  } catch (err) {
    console.log("Erreur dans updateDiffusionStatus:", err.message);
  }
}

module.exports = updateDiffusionStatus;
