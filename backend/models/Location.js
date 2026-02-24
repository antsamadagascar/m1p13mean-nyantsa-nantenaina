const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: [true, 'La boutique est requise'],
    unique: true // une boutique = un seul contrat à la fois
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'La zone est requise']
  },
  numero_local: {
    type: String,
    required: [true, 'Le numéro du local est requis'],
    trim: true,
    maxlength: [20, 'Le numéro ne peut pas dépasser 20 caractères']
  },
  surface: {
    type: Number,
    min: [0, 'La surface ne peut pas être négative']
  },
  loyer_mensuel: {
    type: Number,
    required: [true, 'Le loyer mensuel est requis'],
    min: [0, 'Le loyer ne peut pas être négatif']
  },
  date_debut: {
    type: Date,
    required: [true, 'La date de début est requise']
  },
  date_fin: {
    type: Date,
    default: null // null = durée indéfinie
  },
  statut: {
    type: String,
    enum: ['actif', 'expire', 'resilie'],
    default: 'actif'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Auto-expiration : vérifie si la date de fin est passée
locationSchema.pre('save', function(next) {
  if (this.date_fin && new Date(this.date_fin) < new Date() && this.statut === 'actif') {
    this.statut = 'expire';
  }
  next();
});

module.exports = mongoose.model('Location', locationSchema);