const router = require('express').Router();
const commandeCtrl = require('../controllers/commande.controller');
const auth = require('../middleware/auth');

router.get('/boutique', auth, commandeCtrl.getCommandesBoutique);
router.post('/', auth, commandeCtrl.creerCommande);
router.get('/', auth, commandeCtrl.getMesCommandes);
router.get('/:id', auth, commandeCtrl.getCommandeDetail);
router.patch('/:id/annuler', auth, commandeCtrl.annulerCommande);

router.patch('/:id/statut', auth, commandeCtrl.mettreAJourStatut);
module.exports = router;