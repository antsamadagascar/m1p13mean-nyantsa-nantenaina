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

   // new
  description_courte: {
    type: String,
    maxlength: 300
  },

  reference: {
    type: String,
    unique: true,
    required: true
  },
 // new
  marque: {
    type: String,
    trim: true
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

  //new
  pourcentage_reduction: {
    type: Number,
    min: 0,
    max: 100
  },

  // update
  images: [{
    url: { type: String, required: true },
    principale: { type: Boolean, default: false },
    alt: String,
    ordre: { type: Number, default: 0 }
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
  
  //new
  statut: {
    type: String,
    enum: ['BROUILLON', 'ACTIF', 'RUPTURE', 'ARCHIVE'],
    default: 'ACTIF'
  },

  //new 
  condition: {
    type: String,
    enum: ['NEUF', 'OCCASION', 'RECONDITIONNE'],
    default: 'NEUF'
  },
  //updated
 quantite: {
    type: Number,
    default: 0,
    min: 0
  },

  // new 
  tags: [String],

   // ============================================
  //  new STOCK
  // ============================================
  gestion_stock: {
    type: String,
    enum: ['SIMPLE', 'VARIANTES'],
    default: 'SIMPLE' // un seul produit = ohatra oe T-shirt Nike
  },

    
  // new  (ohatra oe:stock par combinaison (taille/couleur/etc))
  variantes: [{
    nom: String,
    sku: String,
    attributs: [{
      nom: String,
      valeur: String
    }],
    prix_supplement: { type: Number, default: 0 },
    quantite: { type: Number, default: 0 },
    image: String
  }],


  quantite: {
    type: Number,
    default: 0,
    min: 0
  },
  
  stock_minimum: {
    type: Number,
    default: 0
  },

  // ============================================
  //  new CARACTÉRISTIQUES & SPÉCIFICATIONS
  // ============================================
  caracteristiques: [{
    nom: { type: String, required: true },
    valeur: { type: String, required: true },
    unite: String,
    ordre: { type: Number, default: 0 }
  }],


   // ============================================
  // new STATISTIQUES
  // ============================================
  vues: {
    type: Number,
    default: 0
  },
  
  ventes: 
  { type: Number,  default: 0  },
  
  note_moyenne: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  nombre_avis: {
    type: Number,
    default: 0
  },

    // ============================================
  // SUPPRESSION LOGIQUE
  // ============================================
  supprime: {
    type: Boolean,
    default: false
  },
  
  date_suppression: {
    type: Date,
    default: null
  },
}, {
  // new - updated
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

produitSchema.pre('save', function(next) {
  // Génération du slug
  if (!this.slug && this.nom) {
    this.slug = slugify(this.nom, { lower: true, strict: true });
  }

  // vao2
  // Calcul automatique du pourcentage de réduction
  if (this.prix_promo && this.prix && this.prix_promo < this.prix)
  { this.pourcentage_reduction = Math.round(((this.prix - this.prix_promo) / this.prix) * 100); }
  
  // Mise à jour du statut selon le stock
  if (this.stock_total === 0 && this.statut === 'ACTIF') 
  {   this.statut = 'RUPTURE'; }

  next();
});

// ============================================
// VIRTUALS
// ============================================
produitSchema.virtual('en_promotion').get(function() {
  return !!(this.prix_promo && this.prix_promo < this.prix);
});

produitSchema.virtual('prix_final').get(function() {
  return this.en_promotion ? this.prix_promo : this.prix;
});

produitSchema.virtual('en_rupture').get(function() {
  if (this.gestion_stock === 'SIMPLE') 
  {   return this.quantite === 0; }
  return this.variantes.every(v => v.quantite === 0);
});

produitSchema.virtual('stock_total').get(function() {
  if (this.gestion_stock === 'SIMPLE') 
  {  return this.quantite; 

  }
  return this.variantes.reduce((total, v) => total + v.quantite, 0);
});

module.exports = mongoose.model('Produit', produitSchema);
