const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produit.controller');

/**
 * @route   GET /api/produits
 * @desc    Récupère la liste des produits avec filtres
 * @access  Public
 */
router.get('/', produitController.getProduits);

/**
 * @route   GET /api/produits/filtres
 * @desc    Récupère les filtres disponibles
 * @access  Public
 */
router.get('/filtres', produitController.getFiltresDisponibles);

/**
 * @route   GET /api/produits/:idOrSlug
 * @desc    Récupère un produit par ID ou slug
 * @access  Public
 */
router.get('/:idOrSlug', produitController.getProduit);

/**
 * @route   GET /api/produits/:id/similaires
 * @desc    Récupère les produits similaires
 * @access  Public
 */
router.get('/:id/similaires', produitController.getProduitsSimilaires);

/**
 * @route   PATCH /api/produits/:id/statut
 * @desc    Met à jour le statut d'un produit
 * @access  Admin/Boutique
 */
router.patch('/:id/statut', produitController.updateStatutProduit);

module.exports = router;
