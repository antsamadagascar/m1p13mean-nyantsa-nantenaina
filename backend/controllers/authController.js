const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// CONNEXION
exports.connexion = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Vérifie que les champs sont remplis
    if (!email || !motDePasse) 
    
    {  return res.status(400).json({ message: "Veuillez renseigner votre email et mot de passe" }); }

    //  Vérifie le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) 
    { return res.status(400).json({ message: "Email invalide" }); }

    // Cherche l'utilisateur
    const user = await User.findOne({ email });
    if (!user) 
    
    {  return res.status(401).json({ message: "Email ou mot de passe incorrect" }); }

    // Vérifie si le compte est actif
    if (!user.actif) 
    {   return res.status(403).json({ message: "Votre compte a été désactivé" });  }

    // Vérifie le mot de passe
    const motDePasseValide = await user.comparerMotDePasse(motDePasse);
    if (!motDePasseValide)
    
    {  return res.status(401).json({ message: "Email ou mot de passe incorrect" }); }

    // Mis à jour la dernière connexion
    await User.findByIdAndUpdate(user._id, { 
      derniereConnexion: new Date() 
    });

    // Génére un token
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
    console.error(error);
    res.status(500).json({ message: "Erreur serveur, veuillez réessayer" });
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
  try {
    const user = await User.findById(req.user.id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json({ success: true, user }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur, veuillez réessayer" });
  }
};
