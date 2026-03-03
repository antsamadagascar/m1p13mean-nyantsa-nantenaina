const express = require('express');
const router = express.Router();
const sousCategorieController = require('../controllers/sousCategorie.controller');


// Obtenir toutes les sous-catégories
router.get('/', sousCategorieController.obtenirSousCategories);

// // Obtenir une sous-catégorie par ID
// router.get('/:id', sousCategorieController.obtenirSousCategorieParId);

// // Obtenir sous-catégories par catégorie
router.get('/categorie/:categorieId', sousCategorieController.obtenirSousCategoriesParCategorie);

module.exports = router;