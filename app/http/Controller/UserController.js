const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../Model/User');
const nodemailer = require('nodemailer');

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, name: user.name }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m'
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d'
  });
};

const authController = {
  // ✅ Inscription avec envoi d’email
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({ message: 'Utilisateur déjà existant.' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        emailVerified: false
      });

      const savedUser = await newUser.save();

      // 🔔 Envoi d’un email de vérification
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const verificationToken = jwt.sign({ id: savedUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

      const verificationUrl = `${process.env.BASE_URL}/verify-email/${verificationToken}`;

      // await transporter.sendMail({
      //   from: process.env.SMTP_USER,
      //   to: email,
      //   subject: 'Vérifie ton email 📩',
      //   html: `<p>Bienvenue ${name}, clique ici pour vérifier ton email : <a href="${verificationUrl}">Confirmer</a></p>`
      // });
console.log(verificationUrl)
      res.status(201).json({ message: 'Compte créé. Vérifie ton email pour activer ton compte.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ✅ Vérification d’email
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

      user.emailVerified = true;
      await user.save();
      res.status(200).json({ message: 'Email vérifié avec succès !' });
    } catch (err) {
      res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }
  },

  // 🔐 Connexion avec access + refresh tokens
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !user.emailVerified) {
        return res.status(401).json({ message: "Identifiants invalides ou email non vérifié." });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: "Mot de passe incorrect." });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(200).json({ accessToken: `Bearer ${accessToken}`, refreshToken });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 🔄 Rafraîchir l'access token
  refresh: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(401).json({ message: 'Token manquant.' });

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

      const newAccessToken = generateAccessToken(user);
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(403).json({ message: 'Token expiré ou invalide.' });
    }
  }
};

module.exports = authController;
