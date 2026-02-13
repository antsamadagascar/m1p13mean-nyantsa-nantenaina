const Produit = require('../models/Produit');

exports.getMesProduits = async (req, res) => {
    try {
  
      // Vérifier rôle
      if (req.user.role !== 'BOUTIQUE') {
        return res.status(403).json({ message: 'Accès réservé aux boutiques' });
      }
  
      if (!req.user.boutiqueId) {
        return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
      }
  
      const produits = await Produit.find({
        boutique: req.user.boutiqueId
      })
        .populate('categorie', 'nom')
        .populate('sous_categorie', 'nom')
        .sort({ createdAt: -1 });
  
      res.json(produits);
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
