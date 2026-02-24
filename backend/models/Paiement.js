const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },
  mois: {
    type: Number, // 1-12
    required: true
  },
  annee: {
    type: Number,
    required: true
  },
  montant_du: {
    type: Number,
    required: true
  },
  montant_paye: {
    type: Number,
    default: 0
  },
  date_paiement: {
    type: Date,
    default: null
  },
  date_echeance: {
    type: Date,
    required: true // ex: 1er du mois
  },
  statut: {
    type: String,
    enum: ['paye', 'impaye', 'partiel', 'en_retard'],
    default: 'impaye'
  },
  retard_jours: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Unicité : 1 seul paiement par mois/année/location
paiementSchema.index({ location: 1, mois: 1, annee: 1 }, { unique: true });

// Calcul automatique du statut et retard avant save
paiementSchema.pre('save', function(next) {
  const now = new Date();

  if (this.montant_paye >= this.montant_du) {
    this.statut = 'paye';
    this.retard_jours = 0; // payé = plus de retard
  } else if (this.montant_paye > 0) {
    this.statut = 'partiel';
    // retard calculé depuis échéance si date dépassée
    if (now > this.date_echeance) {
      this.retard_jours = Math.floor((now - this.date_echeance) / (1000 * 60 * 60 * 24));
    }
  } else if (now > this.date_echeance) {
    this.statut = 'en_retard';
    this.retard_jours = Math.floor((now - this.date_echeance) / (1000 * 60 * 60 * 24));
  } else {
    this.statut = 'impaye';
    this.retard_jours = 0;
  }

  next();
});

module.exports = mongoose.model('Paiement', paiementSchema);