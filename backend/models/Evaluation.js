const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: [true, 'La boutique est requise']
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

// Un client ne peut laisser qu'une seule évaluation par boutique
evaluationSchema.index({ boutique: 1, client: 1 }, { unique: true });

// ============================================
// FONCTION DE CALCUL — séparée et réutilisable
// ============================================
async function recalculerMoyenne(boutiqueId) {
  try {
    // ← CAST EXPLICITE — c'était le bug principal
    const objectId = new mongoose.Types.ObjectId(boutiqueId.toString());

    const result = await mongoose.model('Evaluation').aggregate([
      { $match: { boutique: objectId, statut: 'visible' } },
      {
        $group: {
          _id: '$boutique',
          moyenne: { $avg: '$note' },
          total: { $sum: 1 }
        }
      }
    ]);

    await mongoose.model('Boutique').findByIdAndUpdate(boutiqueId, {
      'evaluation.moyenne': result.length ? Math.round(result[0].moyenne * 10) / 10 : 0,
      'evaluation.total': result.length ? result[0].total : 0
    });

  } catch (err) {
    console.error('Erreur recalculerMoyenne:', err.message);
  }
}

// ============================================
// HOOKS — async pour capturer les erreurs
// ============================================

// ← async ajouté — sans ça les erreurs sont silencieuses
evaluationSchema.post('save', async function() {
  await recalculerMoyenne(this.boutique);
});

evaluationSchema.post('findOneAndDelete', async function(doc) {
  if (doc) await recalculerMoyenne(doc.boutique);
});

// ============================================
// MÉTHODE STATIQUE — pour appel manuel si besoin
// ============================================
evaluationSchema.statics.calculerMoyenne = recalculerMoyenne;

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
module.exports = Evaluation;