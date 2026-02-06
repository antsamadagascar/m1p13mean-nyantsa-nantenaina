const User = require('../models/User');
const generateToken = require('../utils/generateToken');


// CONNEXION
exports.connexion = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    if (!user.actif) {
      return res.status(403).json({ message: "Votre compte a été désactivé" });
    }
    
    const motDePasseValide = await user.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }
    
    await User.findByIdAndUpdate(user._id, { 
      derniereConnexion: new Date() 
    });
    
    const token = generateToken(user._id, user.role);
    
    res.json({
      success: true,
      message: "Connexion réussie",
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        boutiqueId: user.boutiqueId
      },
      token
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DÉCONNEXION
exports.deconnexion = async (req, res) => {
  res.json({
    success: true,
    message: "Déconnexion réussie"
  });
};

// OBTENIR L'UTILISATEUR CONNECTÉ
exports.getUtilisateurConnecte = async (req, res) => {
  try 
  {  const user = await User.findById(req.user.id).select('-motDePasse');
    res.json({ success: true, user }); 
   } 
    
    catch (error) {
    res.status(500).json({ message: error.message });
  }
};



