const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');

// Création
router.post('/create', boutiqueController.createBoutique);

// Routes publiques
router.get('/public', boutiqueController.getBoutiquesPublic);
router.get('/', boutiqueController.getBoutiques);
router.get('/all', boutiqueController.getAllBoutiques);

// Routes par ID
router.get('/:id', boutiqueController.getBoutiqueById);
router.get('/details/:id', boutiqueController.getBoutiqueDetailsById);

// Actions sur boutique
router.patch('/:id/suspendre', boutiqueController.suspendreBoutique);
router.patch('/:id/reactiver', boutiqueController.reactiverBoutique);

module.exports = router;
