const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Routes publiques
router.post('/connexion', authController.connexion);

// Routes protégées
router.post('/deconnexion', auth, authController.deconnexion);

module.exports = router;