const mongoose = require('mongoose');

const favoriSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit',
    required: true
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: false }
});

// Un client ne peut avoir qu'un seul favori par produit
favoriSchema.index({ client: 1, produit: 1 }, { unique: true });

module.exports = mongoose.model('Favori', favoriSchema);