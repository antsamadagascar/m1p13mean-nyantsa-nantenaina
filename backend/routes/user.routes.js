const express = require('express');
const router = express.Router();
const authController = require('../controllers/user.controller');

router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);
module.exports = router;