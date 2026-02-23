const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');
const { uploadBoutique, uploadImageBoutique } = require('../controllers/boutique.controller');
const statsController = require('../controllers/stats.controller');

// Création
router.post('/create', boutiqueController.createBoutique);

// Routes publiques
router.get('/public', boutiqueController.getBoutiquesPublic);
router.get('/', boutiqueController.getBoutiques);
router.get('/all', boutiqueController.getAllBoutiques);

// Route config horaires (espace boutique uniquement)
router.get('/horaires/:id', boutiqueController.getMesHoraires);
router.patch('/horaires/:id', boutiqueController.updateHoraires);

// Stats /:id pour ne pas être interceptée
router.get('/:id/chiffre-affaires', statsController.getChiffreAffaires);

// Routes par ID
router.get('/:id', boutiqueController.getBoutiqueById);
router.get('/details/:id', boutiqueController.getBoutiqueDetailsById);

// Actions sur boutique
router.patch('/:id/suspendre', boutiqueController.suspendreBoutique);
router.patch('/:id/reactiver', boutiqueController.reactiverBoutique);
router.patch('/:id', boutiqueController.updateBoutique);
router.post('/:id/upload-image', uploadBoutique.single('image'), uploadImageBoutique);

module.exports = router;
