const router = require('express').Router();
const commandeCtrl = require('../controllers/commande.controller');
const auth = require('../middleware/auth');

router.get('/boutique/stats', auth, commandeCtrl.getStatsBoutique);
router.get('/boutique', auth, commandeCtrl.getCommandesBoutique);

router.post('/', auth, commandeCtrl.creerCommande);
router.get('/', auth, commandeCtrl.getMesCommandes);
router.patch('/:id/annuler', auth, commandeCtrl.annulerCommande);
router.patch('/:id/statut', auth, commandeCtrl.mettreAJourStatut);
router.patch('/:id/confirmer-paiement', auth, commandeCtrl.confirmerPaiement);
router.get('/:id', auth, commandeCtrl.getCommandeDetail);

module.exports = router;