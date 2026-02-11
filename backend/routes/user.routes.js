const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.post('/register', userController.register);
router.get('/verify-email', userController.verifyEmail);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);


// Routes protégées : l'utilisateur doit être connecté
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.patch('/:id/suspend', authMiddleware, userController.suspendUser);
router.patch('/:id/activate', authMiddleware, userController.activateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);

router.post('/auth/register-gerant', userController.registerGerant);

module.exports = router;
