const mongoose = require('mongoose');
const CART_EXPIRY_MS = (parseInt(process.env.CART_EXPIRY_MINUTES)) * 60 * 1000;

const panierSchema = new mongoose.Schema({
  // ============================================
  // UTILISATEUR
  // ============================================
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ============================================
  // ARTICLES
  // ============================================
  articles: [{
    produit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produit',
      required: true
    },
    
    quantite: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    
    // Si le produit a des variantes
    variante: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    
    // Prix au moment de l'ajout (pour historique)
    prix_unitaire: {
      type: Number,
      required: true
    },
    
    // Prix promo au moment de l'ajout
    prix_promo_unitaire: {
      type: Number,
      default: null
    },
     pourcentage_reduction: { type: Number, default: null },
    // Date d'ajout
    date_ajout: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ============================================
  // TOTAUX (calculés automatiquement)
  // ============================================
  sous_total: {
    type: Number,
    default: 0
  },
  
  total_remise: {
    type: Number,
    default: 0
  },
  
  total: {
    type: Number,
    default: 0
  },
  
  // ============================================
  // STATUT
  // ============================================
  statut: {
    type: String,
    enum: ['ACTIF', 'CONVERTI', 'ABANDONNE'],
    default: 'ACTIF'
  },
  
  date_expiration: {
    type: Date,
    default: () => new Date(Date.now() + CART_EXPIRY_MS) 
  },

  // Date de conversion en commande
  date_conversion: {
    type: Date,
    default: null
  },
  
  // Commande créée depuis ce panier
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande',
    default: null
  }
  
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


panierSchema.index(
  { date_expiration: 1 }, 
  { expireAfterSeconds: 0, partialFilterExpression: { statut: 'ABANDONNE' } }
);

// ============================================
// INDEX
// ============================================
panierSchema.index({ utilisateur: 1, statut: 1 });

// ============================================
// VIRTUALS
// ============================================
panierSchema.virtual('nombre_articles').get(function() {
  return this.articles.reduce((total, article) => total + article.quantite, 0);
});

// ============================================
// MÉTHODES
// ============================================

/**
 * Calcule les totaux du panier
 */
panierSchema.methods.calculerTotaux = function() {
  let sousTotal = 0;
  let totalRemise = 0;
  
  this.articles.forEach(article => {
    const prixUnitaire = article.prix_promo_unitaire || article.prix_unitaire;
    const prixOriginal = article.prix_unitaire;
    
    sousTotal += prixUnitaire * article.quantite;
    
    if (article.prix_promo_unitaire) {
      totalRemise += (prixOriginal - article.prix_promo_unitaire) * article.quantite;
    }
  });
  
  this.sous_total = sousTotal;
  this.total_remise = totalRemise;
  this.total = sousTotal;
};

/**
 * Ajoute un article au panier
 */
panierSchema.methods.ajouterArticle = async function(produit, quantite = 1, varianteId = null) {
  
  //  Calcule le prix réel avec supplément variante
  let prixUnitaire = produit.prix;
  let prixPromoUnitaire = produit.prix_promo || null;

  if (varianteId) {
    const variante = produit.variantes?.id(varianteId);
    if (variante?.prix_supplement) {
      prixUnitaire += variante.prix_supplement;

      if (produit.promotion_active?.valeur) {
        prixPromoUnitaire = Math.round(prixUnitaire * (1 - produit.promotion_active.valeur / 100));
      }
    }
  }
  // Vérifie si l'article existe déjà
  const articleExistant = this.articles.find(
    a => a.produit.toString() === produit._id.toString() && 
         (!varianteId || a.variante?.toString() === varianteId)
  );
  
  if (articleExistant) {
    articleExistant.quantite += quantite;
  } else {
    this.articles.push({
      produit: produit._id,
      quantite,
      variante: varianteId,
      prix_unitaire: prixUnitaire,        
      prix_promo_unitaire: prixPromoUnitaire, 
      pourcentage_reduction: produit.pourcentage_reduction || null,
      date_ajout: new Date()
    });
  }
  
  this.calculerTotaux();
  this.date_expiration = new Date(Date.now() + CART_EXPIRY_MS);
  
  return this.save();
};

/**
 * Met à jour la quantité d'un article
 */
panierSchema.methods.mettreAJourQuantite = async function(articleId, nouvelleQuantite) {
  const article = this.articles.id(articleId);
  
  if (!article) {
    throw new Error('Article non trouvé dans le panier');
  }
  
  if (nouvelleQuantite <= 0) {
    // Supprime l'article
    article.remove();
  } else {
    article.quantite = nouvelleQuantite;
  }
  
  this.calculerTotaux();
  return this.save();
};

/**
 * Supprime un article du panier
 */
panierSchema.methods.supprimerArticle = async function(articleId) {
  const article = this.articles.id(articleId);
  
  if (!article) {
    throw new Error('Article non trouvé dans le panier');
  }
  
  article.remove();
  this.calculerTotaux();
  return this.save();
};

/**
 * Vide le panier
 */
panierSchema.methods.vider = async function() {
  this.articles = [];
  this.calculerTotaux();
  return this.save();
};

// ============================================
// HOOKS
// ============================================
panierSchema.pre('save', function(next) {
  // Recalculer les totaux avant sauvegarde
  this.calculerTotaux();
  next();
});

module.exports = mongoose.model('Panier', panierSchema);