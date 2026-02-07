const User = require('../models/User');
const userService = require('../services/user.service');
const { verifyToken } = require('../utils/tokenUtils');
const { sendWelcomeEmail } = require('../services/emailService');

const register = async (req, res) => {
  try {
    await userService.registerUser(req.body);

    res.status(201).json({
      message: 'Inscription réussie'
    });
    console.log(req.body);

  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    res.status(400).json({ message: error.message });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }
    const decoded = verifyToken(token); // { userId }
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (user.emailVerifie) {
      return res.status(400).json({ error: 'Email déjà vérifié' });
    }
    user.emailVerifie = true;
    await user.save();
    await sendWelcomeEmail(user);

    // 7. Réponse succès
    res.json({
      message: 'Email vérifié avec succès',
      redirectUrl: '/login'
    });

  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(400).json({ error: 'Token invalide ou expiré' });
  }
};

module.exports = {
  register,
  verifyEmail
};
