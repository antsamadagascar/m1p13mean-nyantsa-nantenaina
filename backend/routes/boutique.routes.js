const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');

router.get('/boutiques', boutiqueController.getBoutiques);

module.exports = router;