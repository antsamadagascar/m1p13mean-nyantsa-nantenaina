const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');

router.get('/', boutiqueController.getBoutiques);
router.get('/public', boutiqueController.getBoutiquesPublic);
router.get('/:id', boutiqueController.getBoutiqueById);          
router.patch('/:id/valider', boutiqueController.validerBoutique);
router.patch('/:id/suspendre', boutiqueController.suspendreBoutique);
router.patch('/:id/reactiver', boutiqueController.reactiverBoutique);

module.exports = router;