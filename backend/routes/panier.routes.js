const express = require('express');
const router = express.Router();
const panierController = require('../controllers/panier.controller');
const protect = require('../middleware/auth'); // utiliser directement sans {}


// ============================================
// Toutes les routes nécessitent l'authentification
// ============================================
router.use(protect);


/**
 * @route   GET /api/panier
 * @desc    Récupère le panier de l'utilisateur
 * @access  Private
 */
router.get('/', panierController.getPanier);


/**
 * @route   POST /api/panier/ajouter
 * @desc    Ajoute un article au panier
 * @access  Private
 */
router.post('/ajouter', panierController.ajouterArticle);


/**
 * @route   PUT /api/panier/article/:articleId
 * @desc    Met à jour la quantité d'un article
 * @access  Private
 */
router.put('/article/:articleId', panierController.mettreAJourQuantite);


/**
 * @route   DELETE /api/panier/article/:articleId
 * @desc    Supprime un article du panier
 * @access  Private
 */
router.delete('/article/:articleId', panierController.supprimerArticle);


/**
 * @route   DELETE /api/panier
 * @desc    Vide le panier
 * @access  Private
 */
router.delete('/', panierController.viderPanier);


module.exports = router;
