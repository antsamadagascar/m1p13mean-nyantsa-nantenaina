const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutiqueController');

// Création
router.post('/', boutiqueController.createBoutique);

// Récupération par ID
router.get('/:id', boutiqueController.getBoutiqueById);

module.exports = router;
