const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getEvaluations,
  soumettre,
  monEvaluation,
  supprimer,
  changerStatut
} = require('../controllers/evaluation.controller');

const auth = require('../middleware/auth'); // votre middleware existant

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────
router.get('/', getEvaluations);

// ─────────────────────────────────────────────
// CLIENT CONNECTÉ
// ─────────────────────────────────────────────
router.get('/moi', auth, monEvaluation);
router.post('/', auth, soumettre);
router.delete('/', auth, supprimer);

// ─────────────────────────────────────────────
// ADMIN SEULEMENT
// ─────────────────────────────────────────────
router.patch('/:id/statut', auth, checkAdmin, changerStatut);

module.exports = router;

// Middleware admin inline (pas besoin de restrictTo séparé)
function checkAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' });
  }
  next();
}