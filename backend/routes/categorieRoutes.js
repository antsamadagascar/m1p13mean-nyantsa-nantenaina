const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');


// Obtenir toutes les catégories
router.get('/', categorieController.obtenirCategories);

module.exports = router;