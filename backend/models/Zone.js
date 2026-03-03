const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la zone est requis'],
    unique: true,
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  
  code: {
    type: String,
    unique: true,
    uppercase: true,
    maxlength: [10, 'Le code ne peut pas dépasser 10 caractères']
  },
  
  // Coordonnées du centre de la zone (pour affichage sur carte)
  coordonnees: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  
  actif: {
    type: Boolean,
    default: true
  },
  
  ordre: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Génération automatique du slug
zoneSchema.pre('save', function(next) {
  if (this.isModified('nom') && !this.slug) {
    this.slug = this.nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Génération auto du code si pas fourni
  if (this.isModified('nom') && !this.code) {
    this.code = this.nom
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/g, '')
      .substring(0, 10);
  }
  
  next();
});

const Zone = mongoose.model('Zone', zoneSchema);

module.exports = Zone;