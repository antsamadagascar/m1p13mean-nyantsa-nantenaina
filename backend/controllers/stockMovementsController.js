const MouvementStock = require('../models/MouvementStock');
const Produit = require('../models/Produit');
const mongoose = require('mongoose');

exports.getMouvements = async (req, res) => {
  try {
    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    const { type, recherche, page = 1, limite = 15 } = req.query;
    const boutiqueId = new mongoose.Types.ObjectId(req.user.boutiqueId);
    const filtre = { boutique: boutiqueId };

    if (type) filtre.type = type;

    if (recherche) {
      const produitsTrouves = await Produit.find({
        boutique: boutiqueId,
        $or: [
          { nom:       { $regex: recherche, $options: 'i' } },
          { reference: { $regex: recherche, $options: 'i' } }
        ]
      }).select('_id');
      filtre.produit = { $in: produitsTrouves.map(p => p._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limite);

    const [mouvements, total] = await Promise.all([
      MouvementStock.find(filtre)
        .populate('produit', 'nom reference images')
        .populate('cree_par', 'nom prenom')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limite)),
      MouvementStock.countDocuments(filtre)
    ]);

    const statsAgg = await MouvementStock.aggregate([
      { $match: { boutique: boutiqueId } },
      { $group: { _id: '$type', count: { $sum: 1 }, quantite: { $sum: '$quantite' } } }
    ]);

    const stats = {
      ENTREE: { count: 0, quantite: 0 },
      SORTIE: { count: 0, quantite: 0 }
    };
    statsAgg.forEach(s => { if (stats[s._id] !== undefined) stats[s._id] = { count: s.count, quantite: s.quantite }; });

    res.json({ mouvements, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limite)), limite: parseInt(limite), stats });

  } catch (error) {
    console.error('Erreur getMouvements:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;