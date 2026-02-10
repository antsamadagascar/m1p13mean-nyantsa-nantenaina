const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');

router.get('/boutiques', boutiqueController.getBoutiques);
router.get('/boutiques/public', boutiqueController.getBoutiquesPublic);
router.get('/boutiques/:id', boutiqueController.getBoutiqueById);          
router.patch('/boutiques/:id/valider', boutiqueController.validerBoutique);
router.patch('/boutiques/:id/suspendre', boutiqueController.suspendreBoutique);
router.patch('/boutiques/:id/reactiver', boutiqueController.reactiverBoutique);

module.exports = router;