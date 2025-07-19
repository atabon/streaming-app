const express = require("express");
const authController = require('../../app/http/Controller/UserController');
const user = require('../../app/http/Middleware/AppMiddleWare');
const projection = require('../../app/http/Middleware/AppMiddleWare');
const auth = require('../../app/http/Middleware/AuthMiddleWare');
const DiffusionController = require("../../app/http/Controller/DiffusionController");
const route = express.Router();
const contactController = require('../../app/http/Controller/ContactController');

// ➕ Ajouter un message de contact
route.post('/contact-message', contactController.create);
route.get('/contact-message', auth, contactController.getAll);
route.get('/contact-message/:id', auth, contactController.getById);
route.patch('/contact-message/:id/read', auth, contactController.markAsRead);
route.delete('/contact-message/:id', auth, contactController.delete);

// 🔐 Authentification
route.post('/register', authController.register);
route.get('/verify-email/:token', authController.verifyEmail);
route.post('/login', authController.login);
route.post('/refresh-token', authController.refresh);


// diffusion routes
route.get('/diffusion/join-room/:diffid', DiffusionController.joinRoom);
route.post('/diffusion/create/:user_id/:projection_id',projection, DiffusionController.createDiffusion);

// test routes
route.get('/test', DiffusionController.jobTest);
module.exports = route