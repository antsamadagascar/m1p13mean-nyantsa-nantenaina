const mongoose = require('mongoose');

const mouvementStockSchema = new mongoose.Schema({

  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit',
    required: true
  },

  type: {
    type: String,
    enum: ['ENTREE', 'SORTIE'],
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
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('MouvementStock', mouvementStockSchema);
