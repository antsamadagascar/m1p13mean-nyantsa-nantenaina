const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');

router.post('/register', userController.register);
router.get('/verify-email', userController.verifyEmail);

router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
