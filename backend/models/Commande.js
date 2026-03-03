const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({

  // ============================================
  // UTILISATEUR
  // ============================================
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  panier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Panier',
    default: null
  },

  // ============================================
  // ARTICLES (snapshot au moment de la commande)
  // ============================================
  articles: [{
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
    variante: { type: mongoose.Schema.Types.ObjectId, default: null },
    nom_produit: { type: String, required: true },
    sku: { type: String },
    quantite: { type: Number, required: true, min: 1 },
    prix_unitaire: { type: Number, required: true },
    prix_promo_unitaire: { type: Number, default: null }
  }],

  // ============================================
  // ADRESSE LIVRAISON
  // ============================================
  adresse_livraison: {
    nom: { type: String, required: true },
    telephone: { type: String, required: true },
    adresse: { type: String, required: true },
    ville: { type: String, required: true },
    zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', default: null }
  },

  // ============================================
  // TOTAUX
  // ============================================
  sous_total: { type: Number, required: true },
  total_remise: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // ============================================
  // STATUT COMMANDE — suivi livraison
  // EN_ATTENTE -> EN_COURS -> LIVREE -> ANNULEE
  // ============================================
  statut: {
    type: String,
    enum: ['EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ANNULEE'],
    default: 'EN_ATTENTE'
  },

  // ============================================
  // STATUT PAIEMENT — séparé du statut commande
  // IMPAYE par défaut -> PAYE quand livreur ramène l'argent
  // ============================================
  statut_paiement: {
    type: String,
    enum: ['IMPAYE', 'PAYE'],
    default: 'IMPAYE'
  },

  // ============================================
  // RÉFÉRENCE UNIQUE
  // ============================================
  reference: {
    type: String,
    unique: true,
    required: true
  },

  // ============================================
  // DATES IMPORTANTES
  // ============================================
  date_paiement:   { type: Date, default: null },
  date_livraison:  { type: Date, default: null },
  date_annulation: { type: Date, default: null },

}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// INDEX
// ============================================
commandeSchema.index({ utilisateur: 1, statut: 1 });
commandeSchema.index({ statut: 1, statut_paiement: 1 });
commandeSchema.index({ reference: 1 });

// ============================================
// VIRTUALS
// ============================================
commandeSchema.virtual('nombre_articles').get(function () {
  return this.articles.reduce((total, a) => total + a.quantite, 0);
});

// Virtual : commande complètement terminée
commandeSchema.virtual('est_terminee').get(function () {
  return this.statut === 'LIVREE' && this.statut_paiement === 'PAYE';
});

module.exports = mongoose.model('Commande', commandeSchema);