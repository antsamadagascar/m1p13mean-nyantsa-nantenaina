const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiement.controller');
const auth = require('../middleware/auth');

router.post('/generer-mois', auth, paiementController.genererMois);
router.post('/generer-annee', auth, paiementController.genererAnnee);
router.get('/',    auth, paiementController.getAll);
router.post('/',   auth, paiementController.create);
router.put('/:id', auth, paiementController.update);
router.delete('/:id/annuler', auth, paiementController.annuler);

module.exports = router;