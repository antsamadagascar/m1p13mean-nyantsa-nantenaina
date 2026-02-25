const mongoose = require('mongoose');

const mouvementStockSchema = new mongoose.Schema({
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit',
    required: true
  },
  type: {
    type: String,
    enum: ['ENTREE', 'SORTIE', 'AJUSTEMENT'],
    required: true
  },
  quantite: {
    type: Number,
    required: true
  },
  motif: String,
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },

  // ── Suivi variantes ──────────────────────────────────────
  variante_sku: {
    type: String,
    default: null  // null = produit simple (pas de variante)
  },
  variante_nom: {
    type: String,
    default: null
  },
  variante_attributs: [{
    nom: String,
    valeur: String
  }],

  // ── Traçabilité ──────────────────────────────────────────
  quantite_avant: {
    type: Number,
    default: null  // stock avant le mouvement
  },
  quantite_apres: {
    type: Number,
    default: null  // stock après le mouvement
  },
  reference_commande: {
    type: String,
    default: null  // lier à une commande si besoin
  },
  cree_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
mouvementStockSchema.index({ produit: 1, createdAt: -1 });
mouvementStockSchema.index({ boutique: 1, createdAt: -1 });
mouvementStockSchema.index({ variante_sku: 1 });

module.exports = mongoose.model('MouvementStock', mouvementStockSchema);