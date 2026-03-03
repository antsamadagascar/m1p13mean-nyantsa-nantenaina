const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({

  // ============================================
  // CIBLE — boutique OU produit (pas les deux)
  // ============================================
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    default: null
  },

  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit',
    default: null
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le client est requis']
  },

  note: {
    type: Number,
    required: [true, 'La note est requise'],
    min: [1, 'La note minimale est 1'],
    max: [5, 'La note maximale est 5'],
    validate: {
      validator: Number.isInteger,
      message: 'La note doit être un nombre entier'
    }
  },

  commentaire: {
    type: String,
    trim: true,
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  },

  statut: {
    type: String,
    enum: ['visible', 'masque', 'signale'],
    default: 'visible'
  }

}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// ============================================
// INDEX — un seul avis par client par cible
// ============================================

// Un client = un seul avis par boutique
evaluationSchema.index(
  { boutique: 1, client: 1 },
  { unique: true, partialFilterExpression: { boutique: { $ne: null } } }
);

// Un client = un seul avis par produit
evaluationSchema.index(
  { produit: 1, client: 1 },
  { unique: true, partialFilterExpression: { produit: { $ne: null } } }
);

// Validation : il faut au moins une cible
evaluationSchema.pre('save', function(next) {
  if (!this.boutique && !this.produit) {
    return next(new Error('Une évaluation doit cibler une boutique ou un produit'));
  }
  if (this.boutique && this.produit) {
    return next(new Error('Une évaluation ne peut pas cibler les deux à la fois'));
  }
  next();
});

// ============================================
// FONCTIONS DE CALCUL
// ============================================

async function recalculerMoyenneBoutique(boutiqueId) {
  try {
    const objectId = new mongoose.Types.ObjectId(boutiqueId.toString());

    const result = await mongoose.model('Evaluation').aggregate([
      { $match: { boutique: objectId, statut: 'visible' } },
      { $group: { _id: '$boutique', moyenne: { $avg: '$note' }, total: { $sum: 1 } } }
    ]);

    await mongoose.model('Boutique').findByIdAndUpdate(boutiqueId, {
      'evaluation.moyenne': result.length ? Math.round(result[0].moyenne * 10) / 10 : 0,
      'evaluation.total': result.length ? result[0].total : 0
    });

  } catch (err) {
    console.error('Erreur recalculerMoyenneBoutique:', err.message);
  }
}

async function recalculerMoyenneProduit(produitId) {
  try {
    const objectId = new mongoose.Types.ObjectId(produitId.toString());

    const result = await mongoose.model('Evaluation').aggregate([
      { $match: { produit: objectId, statut: 'visible' } },
      { $group: { _id: '$produit', moyenne: { $avg: '$note' }, total: { $sum: 1 } } }
    ]);

    await mongoose.model('Produit').findByIdAndUpdate(produitId, {
      'note_moyenne': result.length ? Math.round(result[0].moyenne * 10) / 10 : 0,
      'nombre_avis': result.length ? result[0].total : 0
    });

  } catch (err) {
    console.error('Erreur recalculerMoyenneProduit:', err.message);
  }
}

// ============================================
// HOOKS
// ============================================
evaluationSchema.post('save', async function() {
  if (this.boutique) await recalculerMoyenneBoutique(this.boutique);
  if (this.produit)  await recalculerMoyenneProduit(this.produit);
});

evaluationSchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return;
  if (doc.boutique) await recalculerMoyenneBoutique(doc.boutique);
  if (doc.produit)  await recalculerMoyenneProduit(doc.produit);
});

// ============================================
// MÉTHODES STATIQUES
// ============================================
evaluationSchema.statics.calculerMoyenneBoutique = recalculerMoyenneBoutique;
evaluationSchema.statics.calculerMoyenneProduit  = recalculerMoyenneProduit;

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
module.exports = Evaluation;