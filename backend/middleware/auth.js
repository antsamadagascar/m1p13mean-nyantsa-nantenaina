const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Accès refusé. Token manquant." });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-motDePasse');
    
    if (!user || !user.actif) {
      return res.status(401).json({ message: "Utilisateur non trouvé ou désactivé" });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
};