const mongoose = require('mongoose');

const emplacementSchema = new mongoose.Schema({
  // zone: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Zone',
  //   required: [true, 'La zone est requise']
  // },
  numero_local: {
    type: String,
    required: [true, 'Le numéro du local est requis'],
    trim: true,
    maxlength: [20, 'Le numéro ne peut pas dépasser 20 caractères']
  },
  type: {
    type: String,
    enum: ['box', 'batiment', 'etage', 'bureau', 'autre'],
    default: 'box'
  },
  surface: {
    type: Number,
    min: [0, 'La surface ne peut pas être négative']
  },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  actif: { type: Boolean, default: true },
  
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

module.exports = mongoose.model('Emplacement', emplacementSchema);