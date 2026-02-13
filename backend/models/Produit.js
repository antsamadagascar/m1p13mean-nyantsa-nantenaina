const mongoose = require('mongoose');
const slugify = require('slugify');

const produitSchema = new mongoose.Schema({

  // ============================================
  // INFORMATIONS DE BASE
  // ============================================
  nom: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    maxlength: 255
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true
  },

  description: {
    type: String,
    maxlength: 2000
  },

  reference: {
    type: String,
    unique: true,
    required: true
  },

  prix: {
    type: Number,
    required: true,
    min: 0
  },

  prix_promo: {
    type: Number,
    min: 0
  },

  images: [{
    type: String
  }],

  // ============================================
  // RELATIONS
  // ============================================

  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },

  categorie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: true
  },

  sous_categorie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SousCategorie'
  },

  // ============================================
  // STATUT
  // ============================================
  actif: {
    type: Boolean,
    default: true
  },

  quantite: {
    type: Number,
    required: true
  }

}, {
  timestamps: true
});

produitSchema.pre('save', function(next) {
  if (!this.slug && this.nom) {
    this.slug = slugify(this.nom, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Produit', produitSchema);
