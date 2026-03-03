const Evaluation = require('../models/Evaluation');
const Boutique = require('../models/Boutique');
const Produit = require('../models/Produit');



// ============================================
// BOUTIQUE — Soumettre
// ============================================
exports.soumettreBoutique = async (req, res) => {
  try {
    const { boutiqueId } = req.params;
    const { note, commentaire } = req.body;
    const clientId = req.user._id;

    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    if (!boutique.statut.actif) return res.status(400).json({ success: false, message: 'Boutique inactive' });

    const existante = await Evaluation.findOne({ boutique: boutiqueId, client: clientId });

    if (existante) {
      existante.note = note;
      existante.commentaire = commentaire;
      await existante.save();
    } else {
      await Evaluation.create({ boutique: boutiqueId, client: clientId, note, commentaire });
    }

    const boutiqueMAJ = await Boutique.findById(boutiqueId).select('evaluation');

    res.status(existante ? 200 : 201).json({
      success: true,
      message: existante ? 'Évaluation mise à jour' : 'Évaluation ajoutée',
      evaluation: boutiqueMAJ.evaluation
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};



// ============================================
// PRODUIT — Soumettre
// ============================================
exports.soumettreProduit = async (req, res) => {
  try {
    const { produitId } = req.params;
    const { note, commentaire } = req.body;
    const clientId = req.user._id;

    const produit = await Produit.findById(produitId);
    if (!produit) return res.status(404).json({ success: false, message: 'Produit introuvable' });
    if (produit.statut === 'ARCHIVE' || produit.supprime) {
      return res.status(400).json({ success: false, message: 'Produit non disponible' });
    }

    const existante = await Evaluation.findOne({ produit: produitId, client: clientId });

    if (existante) {
      existante.note = note;
      existante.commentaire = commentaire;
      await existante.save();
    } else {
      await Evaluation.create({ produit: produitId, client: clientId, note, commentaire });
    }

    const produitMAJ = await Produit.findById(produitId).select('note_moyenne nombre_avis');

    res.status(existante ? 200 : 201).json({
      success: true,
      message: existante ? 'Évaluation mise à jour' : 'Évaluation ajoutée',
      evaluation: { moyenne: produitMAJ.note_moyenne, total: produitMAJ.nombre_avis }
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// COMMUN — Mon évaluation
// ============================================
exports.monEvaluation = async (req, res) => {
  try {
    const { boutiqueId, produitId } = req.params;
    const filtre = boutiqueId
      ? { boutique: boutiqueId, client: req.user._id }
      : { produit: produitId, client: req.user._id };

    const evaluation = await Evaluation.findOne(filtre);
    res.json({ success: true, data: evaluation || null });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// COMMUN — Supprimer
// ============================================
exports.supprimer = async (req, res) => {
  try {
    const { boutiqueId, produitId } = req.params;
    const filtre = boutiqueId
      ? { boutique: boutiqueId, client: req.user._id }
      : { produit: produitId, client: req.user._id };

    const evaluation = await Evaluation.findOneAndDelete(filtre);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Évaluation introuvable' });

    res.json({ success: true, message: 'Évaluation supprimée' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// ADMIN — Changer statut
// ============================================
exports.changerStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!['visible', 'masque', 'signale'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const evaluation = await Evaluation.findByIdAndUpdate(id, { statut }, { new: true });
    if (!evaluation) return res.status(404).json({ success: false, message: 'Évaluation introuvable' });

    // Recalcul selon la cible
    if (evaluation.boutique) await Evaluation.calculerMoyenneBoutique(evaluation.boutique);
    if (evaluation.produit)  await Evaluation.calculerMoyenneProduit(evaluation.produit);

    res.json({ success: true, data: evaluation });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// evaluation.controller.js
exports.getEvaluationsProduit = async (req, res) => {
    try {
      const { produitId } = req.params;
  
      const produit = await Produit.findById(produitId).select('note_moyenne nombre_avis nom');
      if (!produit) return res.status(404).json({ success: false, message: 'Produit introuvable' });
  
      const evaluations = await Evaluation.find({ produit: produitId, statut: 'visible' })
        .populate('client', 'nom prenom avatar')  // ← avatar et non photo
        .sort({ date_creation: -1 });
  
      res.json({
        success: true,
        evaluation: { moyenne: produit.note_moyenne, total: produit.nombre_avis },
        count: evaluations.length,
        data: evaluations
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
  
  exports.getEvaluationsBoutique = async (req, res) => {
    try {
      const { boutiqueId } = req.params;
  
      const boutique = await Boutique.findById(boutiqueId).select('evaluation nom');
      if (!boutique) return res.status(404).json({ success: false, message: 'Boutique introuvable' });
  
      const evaluations = await Evaluation.find({ boutique: boutiqueId, statut: 'visible' })
        .populate('client', 'nom prenom avatar')  // ← avatar et non photo
        .sort({ date_creation: -1 });
  
      res.json({
        success: true,
        evaluation: boutique.evaluation,
        count: evaluations.length,
        data: evaluations
      });
  
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };