const express = require('express');
const router = express.Router();
const authController = require('../controllers/user.controller');

router.post('/register', authController.register);

module.exports = router;