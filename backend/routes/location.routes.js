const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const auth = require('../middleware/auth');

router.get('/',     auth, locationController.getAll);
router.get('/:id',  auth, locationController.getById);
router.post('/',    auth, locationController.create);
router.put('/:id',  auth, locationController.update);
router.delete('/:id', auth, locationController.remove);

module.exports = router;