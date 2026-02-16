const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produit.controller');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
router.get('/mes-produits', auth, produitController.getMesProduits);

// router.post('/', auth, produitController.createProduit);
router.post('/', 
    auth, // Votre middleware d'authentification
    upload.single('image'), // Middleware multer
    produitController.createProduit
  );

router.post('/:id/stock', auth, produitController.addStock);

router.put('/:id', auth, produitController.updateProduit);

module.exports = router;