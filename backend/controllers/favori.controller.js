const Favori = require('../models/Favori');

// GET — tous mes favoris
exports.getMesFavoris = async (req, res) => {
  try {
    const favoris = await Favori.find({ client: req.user._id })
      .populate({
        path: 'produit',
        populate: [
          { path: 'boutique', select: 'nom slug' },
          { path: 'categorie', select: 'nom' },
          { path: 'promotion_active' }
        ]
      })
      .sort({ date_creation: -1 });

    res.json({ success: true, count: favoris.length, data: favoris });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST — ajouter aux favoris
exports.ajouterFavori = async (req, res) => {
  try {
    const { produitId } = req.params;

    const favori = await Favori.create({
      client: req.user._id,
      produit: produitId
    });

    res.status(201).json({ success: true, data: favori });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Déjà dans vos favoris' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE — retirer des favoris
exports.retirerFavori = async (req, res) => {
  try {
    const { produitId } = req.params;

    const favori = await Favori.findOneAndDelete({
      client: req.user._id,
      produit: produitId
    });

    if (!favori) {
      return res.status(404).json({ success: false, message: 'Favori introuvable' });
    }

    res.json({ success: true, message: 'Retiré des favoris' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET — vérifier si un produit est en favori
exports.verifierFavori = async (req, res) => {
  try {
    const { produitId } = req.params;

    const favori = await Favori.findOne({
      client: req.user._id,
      produit: produitId
    });

    res.json({ success: true, estFavori: !!favori });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET — IDs de tous mes favoris (pour init rapide)
exports.getMesFavorisIds = async (req, res) => {
  try {
    const favoris = await Favori.find({ client: req.user._id }).select('produit');
    const ids = favoris.map(f => f.produit.toString());
    res.json({ success: true, data: ids });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};