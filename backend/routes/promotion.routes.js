// routes/promotionRoutes.js
const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const auth = require('../middleware/auth');

// Routes pour les promotions
router.get('/promotions', auth, promotionController.getMesPromotions);
router.get('/produits/:produitId/promotion', auth, promotionController.getPromotionProduit);
router.post('/produits/:produitId/promotion', auth, promotionController.createPromotionProduit);
router.put('/produits/:produitId/promotion/:promotionId', auth, promotionController.updatePromotionProduit);
router.delete('/produits/:produitId/promotion/:promotionId', auth, promotionController.deletePromotionProduit);

module.exports = router;