const Panier = require('../models/Panier');
const Produit = require('../models/Produit');

/**
 * Récupère le panier de l'utilisateur connecté
 */
exports.getPanier = async (req, res) => {
  try {
    const userId = req.user._id; // Depuis le middleware auth

    let panier = await Panier.findOne({ 
      utilisateur: userId, 
      statut: 'ACTIF' 
    }).populate({
      path: 'articles.produit',
      select: 'nom slug prix prix_promo images quantite variantes'
    });

    // Crée  un panier vide si n'existe pas
    if (!panier) {
      panier = await Panier.create({
        utilisateur: userId,
        articles: [],
        statut: 'ACTIF'
      });
    }

    res.json(panier);
  } catch (error) {
    console.error('Erreur getPanier:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du panier',
      error: error.message
    });
  }
};

/**
 * Ajoute un article au panier
 */
exports.ajouterArticle = async (req, res) => {
  try {
    const userId = req.user._id;
    const { produit_id, quantite = 1, variante_id } = req.body;

    // Valider les données
    if (!produit_id) {
      return res.status(400).json({ message: 'ID produit requis' });
    }

    if (quantite < 1) {
      return res.status(400).json({ message: 'Quantité invalide' });
    }

    // Récupérer le produit
    const produit = await Produit.findById(produit_id);
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Vérifier le stock
    let stockDisponible = produit.quantite;
    if (variante_id && produit.gestion_stock === 'VARIANTES') {
      const variante = produit.variantes.id(variante_id);
      if (!variante) {
        return res.status(404).json({ message: 'Variante non trouvée' });
      }
      stockDisponible = variante.quantite;
    }

    if (stockDisponible < quantite) {
      return res.status(400).json({ 
        message: 'Stock insuffisant',
        stock_disponible: stockDisponible
      });
    }

    // Récupérer ou créer le panier
    let panier = await Panier.findOne({ 
      utilisateur: userId, 
      statut: 'ACTIF' 
    });

    if (!panier) {
      panier = new Panier({
        utilisateur: userId,
        articles: [],
        statut: 'ACTIF'
      });
    }

    // Ajoute l'article
    await panier.ajouterArticle(produit, quantite, variante_id);

    // Recharge avec populate
    panier = await Panier.findById(panier._id).populate({
      path: 'articles.produit',
      select: 'nom slug prix prix_promo images quantite variantes'
    });

    res.json(panier);
  } catch (error) {
    console.error('Erreur ajouterArticle:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout au panier',
      error: error.message
    });
  }
};

/**
 * Met à jour la quantité d'un article
 */
exports.mettreAJourQuantite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { articleId } = req.params;
    const { quantite } = req.body;

    if (quantite < 0) {
      return res.status(400).json({ message: 'Quantité invalide' });
    }

    let panier = await Panier.findOne({ 
      utilisateur: userId, 
      statut: 'ACTIF' 
    });

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    // Vérifier le stock
    const article = panier.articles.id(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }

    const produit = await Produit.findById(article.produit);
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    let stockDisponible = produit.quantite;
    if (article.variante && produit.gestion_stock === 'VARIANTES') {
      const variante = produit.variantes.id(article.variante);
      if (variante) {
        stockDisponible = variante.quantite;
      }
    }

    if (quantite > stockDisponible) {
      return res.status(400).json({ 
        message: 'Stock insuffisant',
        stock_disponible: stockDisponible
      });
    }

    // Mettre à jour
    await panier.mettreAJourQuantite(articleId, quantite);

    // Recharger avec populate
    panier = await Panier.findById(panier._id).populate({
      path: 'articles.produit',
      select: 'nom slug prix prix_promo images quantite variantes'
    });

    res.json(panier);
  } catch (error) {
    console.error('Erreur mettreAJourQuantite:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

/**
 * Supprime un article du panier
 */
exports.supprimerArticle = async (req, res) => {
  try {
    const userId = req.user._id;
    const { articleId } = req.params;

    let panier = await Panier.findOne({ 
      utilisateur: userId, 
      statut: 'ACTIF' 
    });

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    await panier.supprimerArticle(articleId);

    // Recharger avec populate
    panier = await Panier.findById(panier._id).populate({
      path: 'articles.produit',
      select: 'nom slug prix prix_promo images quantite variantes'
    });

    res.json(panier);
  } catch (error) {
    console.error('Erreur supprimerArticle:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

/**
 * Vide le panier
 */
exports.viderPanier = async (req, res) => {
  try {
    const userId = req.user._id;

    let panier = await Panier.findOne({ 
      utilisateur: userId, 
      statut: 'ACTIF' 
    });

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    await panier.vider();

    res.json(panier);
  } catch (error) {
    console.error('Erreur viderPanier:', error);
    res.status(500).json({
      message: 'Erreur lors du vidage du panier',
      error: error.message
    });
  }
};

module.exports = exports;