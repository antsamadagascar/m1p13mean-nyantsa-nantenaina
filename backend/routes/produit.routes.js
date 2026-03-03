const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produit.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');


/**
 * @route   GET /api/produits/mes-produits
 * @desc    Produits de la boutique connectée
 * @access  Boutique
 */
router.get('/mes-produits', auth, produitController.getMesProduits);

/* =======================================================
   ROUTES PUBLIQUES (CLIENT)
======================================================= */

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



/* =======================================================
   ROUTES BOUTIQUE / ADMIN (PROTÉGÉES)
======================================================= */


/**
 * @route   POST /api/produits
 * @desc    Créer un produit
 * @access  Boutique
 */
router.post(
  '/',
  auth,
  upload.single('image'),
  produitController.createProduit
);

/**
 * @route   PUT /api/produits/:id
 * @desc    Mettre à jour un produit
 * @access  Boutique
 */
router.put(
  '/:id',
  auth,
  upload.single('image'),
  produitController.updateProduit
);

/**
 * @route   PATCH /api/produits/:id/statut
 * @desc    Mettre à jour le statut d'un produit
 * @access  Admin/Boutique
 */
router.patch('/:id/statut', auth, produitController.updateStatutProduit);

/**
 * @route   POST /api/produits/:id/stock
 * @desc    Ajouter du stock
 * @access  Boutique
 */
router.post('/:id/stock', auth, produitController.addStock);

/**
 * @route   DELETE /api/produits/:id/soft
 * @desc    Suppression logique d'un produit
 * @access  Boutique
 */
router.delete('/:id/soft', auth, produitController.softDeleteProduit);


// Route pour supprimer une image spécifique
router.delete('/:produitId/images/:imageId', auth, produitController.deleteImage);

module.exports = router;
