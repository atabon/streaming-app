const Contact = require('../../Model/Contact');

const contactController = {
  // ➕ Ajouter un message de contact
  create: async (req, res) => {
    try {
      const contact = new Contact(req.body);
      const saved = await contact.save();
      res.status(201).json({ message: 'Message envoyé', contact: saved });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // 📥 Obtenir tous les messages
  getAll: async (req, res) => {
    try {
      const contacts = await Contact.find().sort({ sentAt: -1 });
      res.status(200).json(contacts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // 🔍 Obtenir un message par ID
  getById: async (req, res) => {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact) return res.status(404).json({ message: 'Message introuvable' });
      res.status(200).json(contact);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // 📝 Marquer un message comme lu
  markAsRead: async (req, res) => {
    try {
      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      res.status(200).json({ message: 'Message marqué comme lu', contact });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // 🗑️ Supprimer un message
  delete: async (req, res) => {
    try {
      const deleted = await Contact.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Message introuvable' });
      res.status(200).json({ message: 'Message supprimé' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = contactController;
