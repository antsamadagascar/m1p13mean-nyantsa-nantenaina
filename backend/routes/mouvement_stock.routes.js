// mouvement_stock.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stockController = require('../controllers/stockMovements.controller');

// Vérif rapide
console.log('stockController:', stockController);

router.get('/', auth, stockController.getMouvements);

module.exports = router;