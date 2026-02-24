const express = require('express');
const router = express.Router();
const emplacementController = require('../controllers/emplacement.controller');
const auth = require('../middleware/auth');

router.get('/disponibles', auth, emplacementController.getDisponibles); // ⚠️ avant /:id
router.get('/', auth, emplacementController.getAll);
router.post('/', auth, emplacementController.create);
router.put('/:id', auth, emplacementController.update);
router.delete('/:id', auth, emplacementController.delete);

module.exports = router;