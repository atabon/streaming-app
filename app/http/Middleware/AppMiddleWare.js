const axios = require("axios");
const User = require('../../Model/User');

module.exports = async function user(req, res, next) {
    let ui = req.params.id;
    try {
        let user;
        await axios.get(`${process.env.GATEWAY}/user/${user_id}`).then(res => {
            user = res.data.user;
        }).catch((error) => console.log(error));
        if (user == null) {
            res.status(404).json({ "message": `No user with id ${ui}` });
        } else {
            res.user = user;
            next()
        }
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

module.exports = async function projection(req, res, next) {
    let projection_id = req.params.projection_id;
    let projection;
    // get projection by id
    await axios.get(`${process.env.PROJECTION_HOST}/api/projections/${projection_id}`).then(res => {
        projection = res.data.projection;
    }).catch((error) => console.log(error)
    );

    // if the projection don't exist
    if (projection == null) {
        res.status(404).json({ 
            'message': `No projection with id =${projection_id}` ,
            'projection' :projection,
        });
    } else {
        res.projection = projection;
        next();
    }
}