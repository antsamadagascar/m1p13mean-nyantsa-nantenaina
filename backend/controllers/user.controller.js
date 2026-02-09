const User = require('../models/User');
const userService = require('../services/user.service');
const { verifyToken, generatePasswordResetToken } = require('../utils/tokenUtils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');

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

//  Demande de réinitialisation
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ 
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé' 
      });
    }

    // Génére token de réinitialisation (expire en 1h)
    const resetToken = generatePasswordResetToken(user._id);
    
    // Envoye l'email
    await sendPasswordResetEmail(user, resetToken);
    
    res.status(200).json({ 
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé' 
    });
    
  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

//  Réinitialisation du mot de passe
const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { motDePasse } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token manquant' });
    }

    if (!motDePasse || motDePasse.length < 6) {
      return res.status(400).json({ error: 'Mot de passe invalide (minimum 6 caractères)' });
    }

    // Vérifie le token
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Hash le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    user.motDePasse = hashedPassword;
    await user.save();

    res.json({
      message: 'Mot de passe réinitialisé avec succès',
      redirectUrl: '/connexion'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(400).json({ error: 'Token invalide ou expiré' });
  }
};


module.exports = {
  register,
  verifyEmail,
  forgotPassword, 
  resetPassword   
};