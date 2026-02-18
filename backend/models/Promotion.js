// models/Promotion.js
const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  
  // ============================================
  // INFORMATIONS DE BASE
  // ============================================
  nom: {
    type: String,
    required: [true, 'Le nom de la promotion est requis'],
    trim: true,
    maxlength: 100
  },

  description: {
    type: String,
    maxlength: 500
  },

  // ============================================
  // TYPE DE PROMOTION
  // ============================================
  type: {
    type: String,
    enum: ['POURCENTAGE', 'MONTANT_FIXE', 'PRIX_FIXE'],
    required: true,
    default: 'POURCENTAGE'
  },

  // Valeur de la réduction
  valeur: {
    type: Number,
    required: true,
    min: 0
  },

  // Prix promo fixe (pour type PRIX_FIXE)
  prix_fixe: {
    type: Number,
    min: 0
  },

  // ============================================
  // PÉRIODE DE VALIDITÉ
  // ============================================
  date_debut: {
    type: Date,
    required: true,
    default: Date.now
  },

  date_fin: {
    type: Date,
    required: true
  },

  // ============================================
  // PRODUIT CONCERNÉ
  // ============================================
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit',
    required: true
  },

  // Boutique
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },

  // ============================================
  // STATUT & PRIORITÉ
  // ============================================
  actif: {
    type: Boolean,
    default: true
  },

  priorite: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // ============================================
  // STATISTIQUES
  // ============================================
  utilisation_count: {
    type: Number,
    default: 0
  },

  montant_economise_total: {
    type: Number,
    default: 0
  },

  // ============================================
  // OPTIONS D'AFFICHAGE
  // ============================================
  afficher_badge: {
    type: Boolean,
    default: true
  },

  badge_couleur: {
    type: String,
    default: '#ff6b6b'
  },

  badge_texte: {
    type: String,
    maxlength: 30
  },
  supprime: { type: Boolean, default: false },
  date_suppression: { type: Date, default: null }

}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// VIRTUALS
// ============================================

// Vérifier si la promotion est active
promotionSchema.virtual('est_active').get(function() {
  if (!this.actif) return false;
  
  const maintenant = new Date();
  return maintenant >= this.date_debut && maintenant <= this.date_fin;
});

// Vérifier si la promotion a expiré
promotionSchema.virtual('est_expiree').get(function() {
  return new Date() > this.date_fin;
});

// Nombre de jours restants
promotionSchema.virtual('jours_restants').get(function() {
  if (this.est_expiree) return 0;
  
  const maintenant = new Date();
  const difference = this.date_fin - maintenant;
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
});

// ============================================
// MÉTHODES
// ============================================

// Calculer le prix après promotion
promotionSchema.methods.calculerPrixPromo = function(prixOriginal) {
  if (!this.est_active) return prixOriginal;

  let prixPromo = prixOriginal;

  switch (this.type) {
    case 'POURCENTAGE':
      prixPromo = prixOriginal * (1 - this.valeur / 100);
      break;
    
    case 'MONTANT_FIXE':
      prixPromo = Math.max(0, prixOriginal - this.valeur);
      break;
    
    case 'PRIX_FIXE':
      prixPromo = this.prix_fixe || prixOriginal;
      break;
  }

  return Math.round(prixPromo);
};

// ============================================
// INDEXES
// ============================================
promotionSchema.index({ boutique: 1, actif: 1, date_debut: 1, date_fin: 1 });
promotionSchema.index({ produit: 1 });
promotionSchema.index({ date_fin: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);