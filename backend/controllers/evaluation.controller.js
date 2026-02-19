const Evaluation = require('../models/Evaluation');
const Boutique = require('../models/Boutique');

// ============================================
// GET - Toutes les évaluations d'une boutique
// ============================================
exports.getEvaluations = async (req, res) => {
  try {
    const { boutiqueId } = req.params;

    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
      return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    }

    const evaluations = await Evaluation.find({
      boutique: boutiqueId,
      statut: 'visible'
    })
      .populate('client', 'nom prenom photo')
      .sort({ date_creation: -1 });

    res.json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// POST - Créer ou modifier son évaluation
// ============================================
exports.soumettre = async (req, res) => {
  try {
    const { boutiqueId } = req.params;
    const { note, commentaire } = req.body;
    const clientId = req.user._id;

    // Vérifier que la boutique existe et est active
    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
      return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    }
    if (!boutique.statut.actif) {
      return res.status(400).json({ success: false, message: 'Cette boutique n\'est pas active' });
    }

    // Vérifier si une évaluation existe déjà
    const existante = await Evaluation.findOne({ boutique: boutiqueId, client: clientId });

    let evaluation;

    if (existante) {
      // Mise à jour
      existante.note = note;
      existante.commentaire = commentaire;
      evaluation = await existante.save();

      return res.json({
        success: true,
        message: 'Évaluation mise à jour',
        data: evaluation
      });
    }

    // Nouvelle évaluation
    evaluation = await Evaluation.create({
      boutique: boutiqueId,
      client: clientId,
      note,
      commentaire
    });

    res.status(201).json({
      success: true,
      message: 'Évaluation ajoutée',
      data: evaluation
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// GET - Récupérer MON évaluation pour une boutique
// ============================================
exports.monEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findOne({
      boutique: req.params.boutiqueId,
      client: req.user._id
    });

    if (!evaluation) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: evaluation });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// DELETE - Supprimer son évaluation
// ============================================
exports.supprimer = async (req, res) => {
  try {
    const evaluation = await Evaluation.findOneAndDelete({
      boutique: req.params.boutiqueId,
      client: req.user._id
    });

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Évaluation introuvable' });
    }

    res.json({ success: true, message: 'Évaluation supprimée' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// ADMIN - Changer le statut d'une évaluation
// ============================================
exports.changerStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const { id } = req.params;

    if (!['visible', 'masque', 'signale'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const evaluation = await Evaluation.findByIdAndUpdate(
      id,
      { statut },
      { new: true }
    );

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Évaluation introuvable' });
    }

    // Recalculer la moyenne après modération
    await Evaluation.calculerMoyenne(evaluation.boutique);

    res.json({ success: true, data: evaluation });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};