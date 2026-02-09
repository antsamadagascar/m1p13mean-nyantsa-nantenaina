const mongoose = require('mongoose');
const slugify = require('slugify');

const boutiqueSchema = new mongoose.Schema({
  // ============================================
  // INFORMATIONS DE BASE
  // ============================================
  nom: {
    type: String,
    required: [true, 'Le nom de la boutique est requis'],
    trim: true,
    maxlength: [255, 'Le nom ne peut pas dépasser 255 caractères'],
    unique: true
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  description: {
    type: String,
    required: [true, 'La description est requise'],
    minlength: [50, 'La description doit contenir au moins 50 caractères'],
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  
  logo: {
    type: String,
    default: null
  },
  
  banniere: {
    type: String,
    default: null
  },
  
  photo_boutique: {
    type: String,
    default: null
  },
  
  // ============================================
  // GÉRANT
  // ============================================
  gerant: {
    nom: {
      type: String,
      required: [true, 'Le nom du gérant est requis'],
      trim: true
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom du gérant est requis'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'L\'email du gérant est requis'],
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Email invalide'
      }
    },
    telephone: {
      type: String,
      required: [true, 'Le téléphone du gérant est requis'],
      validate: {
        validator: function(v) {
          return /^\+261\s?[0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{3}$/.test(v);
        },
        message: 'Format de téléphone invalide (+261 XX XXX XX XXX)'
      }
    }
  },
  
  // ============================================
  // LOCALISATION
  // ============================================
  localisation: {
    zone: {
      type: String,
      required: [true, 'La zone est requise'],
      enum: ['Zone A', 'Zone B', 'Zone C', 'Zone D']
    },
    etage: {
      type: String,
      required: [true, 'L\'étage est requis'],
      enum: ['Rez-de-chaussée', '1er étage', '2ème étage', '3ème étage']
    },
    numero: {
      type: String,
      required: [true, 'Le numéro de boutique est requis']
    },
    emplacement_complet: String,
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    surface: {
      type: Number,
      min: 0
    }
  },
  
// ============================================
// CATÉGORIE & SOUS-CATÉGORIES
// ============================================
    categorie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categorie',
        required: [true, 'La catégorie principale est requise']
    },
    
    sous_categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SousCategorie'
    }],
  
  
  // ============================================
  // CONTACT
  // ============================================
  contact: {
    telephone: {
      type: String,
      required: [true, 'Le téléphone de contact est requis']
    },
    email: {
      type: String,
      required: [true, 'L\'email de contact est requis'],
      lowercase: true
    },
    site_web: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'URL invalide'
      }
    },
    whatsapp: String,
    facebook: String,
    instagram: String,
    twitter: String,
    tiktok: String
  },
  
  // ============================================
  // HORAIRES
  // ============================================
  horaires: {
    lundi: {
      ouvert: { type: Boolean, default: true },
      debut: { type: String, default: '09:00' },
      fin: { type: String, default: '19:00' }
    },
    mardi: {
      ouvert: { type: Boolean, default: true },
      debut: { type: String, default: '09:00' },
      fin: { type: String, default: '19:00' }
    },
    mercredi: {
      ouvert: { type: Boolean, default: true },
      debut: { type: String, default: '09:00' },
      fin: { type: String, default: '19:00' }
    },
    jeudi: {
      ouvert: { type: Boolean, default: true },
      debut: { type: String, default: '09:00' },
      fin: { type: String, default: '19:00' }
    },
    vendredi: {
      ouvert: { type: Boolean, default: true },
      debut: { type: String, default: '09:00' },
      fin: { type: String, default: '21:00' }
    },
    samedi: {
      ouvert: { type: Boolean, default: true },
      debut: { type: String, default: '10:00' },
      fin: { type: String, default: '21:00' }
    },
    dimanche: {
      ouvert: { type: Boolean, default: true },
      debut: { type: String, default: '10:00' },
      fin: { type: String, default: '18:00' }
    }
  },
  
  horaires_speciaux: [{
    date: Date,
    ferme: { type: Boolean, default: false },
    ouvert: { type: Boolean, default: true },
    debut: String,
    fin: String,
    motif: String
  }],

  // ============================================
  // STATUT
  // ============================================
  statut: {
    actif: {
      type: Boolean,
      default: false
    },
    valide_par_admin: {
      type: Boolean,
      default: false
    },
    en_attente_validation: {
      type: Boolean,
      default: true
    },
    suspendu: {
      type: Boolean,
      default: false
    },
    motif_suspension: String,
    date_validation: Date,
    date_suspension: Date
  }  
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// ============================================
// EXPORT
// ============================================
const Boutique = mongoose.model('Boutique', boutiqueSchema);

module.exports = Boutique;