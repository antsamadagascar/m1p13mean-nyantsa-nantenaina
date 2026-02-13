const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produit.controller');

const auth = require('../middleware/auth');

router.get('/mes-produits', auth, produitController.getMesProduits);

module.exports = router;