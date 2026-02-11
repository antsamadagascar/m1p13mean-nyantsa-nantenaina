const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');

router.post('/register', userController.register);
router.get('/verify-email', userController.verifyEmail);

router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Liste des utilisateurs avec filtres+actions
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/suspend', userController.suspendUser);
router.patch('/:id/activate', userController.activateUser);
router.patch('/:id/role', userController.changeUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
