const express = require('express');
const router = express.Router();
const {
  createBoutique
} = require('../controllers/boutiqueController');

// Middleware d'authentification (à adapter selon votre système)
// const { protect, authorize } = require('../middleware/auth');

router.post('/',createBoutique);

module.exports = router;