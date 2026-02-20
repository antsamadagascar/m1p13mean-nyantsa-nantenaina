const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getMesFavoris,
  ajouterFavori,
  retirerFavori,
  verifierFavori,
  getMesFavorisIds
} = require('../controllers/favori.controller');

router.use(auth); // tout nécessite d'être connecté

router.get('/',              getMesFavoris);
router.get('/ids',           getMesFavorisIds);
router.get('/:produitId',    verifierFavori);
router.post('/:produitId',   ajouterFavori);
router.delete('/:produitId', retirerFavori);

module.exports = router;