const User = require('../models/User');
const userService = require('../services/user.service');
const { verifyToken, generatePasswordResetToken } = require('../utils/tokenUtils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/email.service');
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

    // Génère token de réinitialisation (expire en 1h)
    const resetToken = generatePasswordResetToken(user._id);
    
    // Envoie l'email
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

// Récupération de tous les utilisateurs avec filtres
const getAllUsers = async (req, res) => {
  try {
    const { role, actif, search, page = 1, limit = 10 } = req.query;
    
    // Construction du filtre
    let filter = {};
    
    if (role && role !== 'ALL') {
      filter.role = role;
    }
    
    if (actif !== undefined && actif !== 'ALL') {
      filter.actif = actif === 'true';
    }
    
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-motDePasse')
      .populate('boutiqueId', 'nom adresse')
      .sort({ dateInscription: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    // Statistiques globales
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalActifs: { $sum: { $cond: ['$actif', 1, 0] } },
          totalSuspendus: { $sum: { $cond: ['$actif', 0, 1] } },
          totalAcheteurs: { $sum: { $cond: [{ $eq: ['$role', 'ACHETEUR'] }, 1, 0] } },
          totalBoutiques: { $sum: { $cond: [{ $eq: ['$role', 'BOUTIQUE'] }, 1, 0] } },
          totalAdmins: { $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || {}
    });
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des utilisateurs' 
    });
  }
};

// Récupération d'un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-motDePasse')
      .populate('boutiqueId');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de l\'utilisateur' 
    });
  }
};

// Suspendre un utilisateur
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // FIX: Vérifie si req.user existe avant de l'utiliser
    if (req.user) {
      // Empêcher la suspension d'un admin par un autre admin
      if (user.role === 'ADMIN' && req.user.role === 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: 'Vous ne pouvez pas suspendre un autre administrateur' 
        });
      }
      
      // Empêcher l'auto-suspension
      if (user._id.toString() === req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Vous ne pouvez pas vous suspendre vous-même' 
        });
      }
    }
    
    user.actif = false;
    user.dateSuspension = new Date();
    user.raisonSuspension = raison || 'Non spécifiée';
    //  FIX: N'utilise que req.user.id que s'il existe
    user.suspenduPar = req.user ? req.user.id : null;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Utilisateur suspendu avec succès',
      data: user
    });
  } catch (error) {
    console.error('Erreur suspendUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suspension de l\'utilisateur' 
    });
  }
};

// Activation d'un utilisateur
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    user.actif = true;
    user.dateSuspension = null;
    user.raisonSuspension = null;
    user.suspenduPar = null;
    user.dateReactivation = new Date();
    //  FIX: on N'utilise que req.user.id que s'il existe
    user.reactivePar = req.user ? req.user.id : null;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Utilisateur activé avec succès',
      data: user
    });
  } catch (error) {
    console.error('Erreur activateUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'activation de l\'utilisateur' 
    });
  }
};

// Supprime un utilisateur
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    //  FIX: Vérifie si req.user existe avant de l'utiliser
    if (req.user) {
      // Empêche la suppression d'un admin
      if (user.role === 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: 'Impossible de supprimer un administrateur' 
        });
      }
      
      // Empêcher l'auto-suppression
      if (user._id.toString() === req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Vous ne pouvez pas vous supprimer vous-même' 
        });
      }
    }
    
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression de l\'utilisateur' 
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  forgotPassword, 
  resetPassword,
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  deleteUser
};