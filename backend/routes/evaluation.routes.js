const express = require('express');
const auth = require('../middleware/auth');
const {
  getEvaluationsBoutique,
  soumettreBoutique,
  getEvaluationsProduit,
  soumettreProduit,
  monEvaluation,
  supprimer,
  changerStatut
} = require('../controllers/evaluation.controller');

// ─────────────────────────────────────────────
// ROUTER BOUTIQUE
// ─────────────────────────────────────────────
const boutiqueRouter = express.Router({ mergeParams: true });

boutiqueRouter.get('/',     getEvaluationsBoutique);
boutiqueRouter.get('/moi',  auth, (req, res) => { req.params.boutiqueId = req.params.boutiqueId; monEvaluation(req, res); });
boutiqueRouter.post('/',    auth, soumettreBoutique);
boutiqueRouter.delete('/',  auth, supprimer);

// ─────────────────────────────────────────────
// ROUTER PRODUIT
// ─────────────────────────────────────────────
const produitRouter = express.Router({ mergeParams: true });

produitRouter.get('/',     getEvaluationsProduit);
produitRouter.get('/moi',  auth, monEvaluation);
produitRouter.post('/',    auth, soumettreProduit);
produitRouter.delete('/',  auth, supprimer);

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.patch('/:id/statut', auth, checkAdmin, changerStatut);

function checkAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé' });
  }
  next();
}

module.exports = { boutiqueRouter, produitRouter, adminRouter };