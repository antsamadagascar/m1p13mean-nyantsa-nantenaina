const Panier = require('../models/Panier');
const Produit = require('../models/Produit');
const CART_EXPIRY_MS = (parseInt(process.env.CART_EXPIRY_MINUTES)) * 60 * 1000;
/**
 * Récupère le panier de l'utilisateur connecté
 */
exports.getPanier = async (req, res) => {
  try {
    const userId = req.user._id;

    let panier = await Panier.findOne({ 
      utilisateur: userId, 
      statut: 'ACTIF' 
    }).populate({
      path: 'articles.produit',
      select: 'nom slug prix prix_promo images quantite variantes'
    });

    //  Si expiré ->  supprime et retourner null
    if (panier && panier.date_expiration && new Date() > new Date(panier.date_expiration)) {
      await Panier.deleteOne({ _id: panier._id });
      panier = null;
    }

    // Retourne le panier vide sans sauvegarder en base
    if (!panier) {
      return res.json({
        _id: null,
        utilisateur: userId,
        articles: [],
        sous_total: 0,
        total_remise: 0,
        total: 0,
        nombre_articles: 0,
        statut: 'ACTIF',
        date_expiration: null
      });
    }

    res.json(panier);
  } catch (error) {
    console.error('Erreur getPanier:', error);
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

/**
 * Ajoute un article au panier
 */
exports.ajouterArticle = async (req, res) => {
  try {
    const userId = req.user._id;
    const { produit_id, quantite = 1, variante_id } = req.body;

    if (!produit_id) {
      return res.status(400).json({ message: 'ID produit requis' });
    }

    if (quantite < 1) {
      return res.status(400).json({ message: 'Quantité invalide' });
    }

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

    let panier = await Panier.findOne({ utilisateur: userId, statut: 'ACTIF' });

    //  Vérification expiration à l'ajout aussi
    if (panier && panier.date_expiration && new Date() > new Date(panier.date_expiration)) {
      await Panier.deleteOne({ _id: panier._id });
      panier = null;
    }

    if (!panier) {
      panier = new Panier({
        utilisateur: userId,
        articles: [],
        statut: 'ACTIF',
        date_expiration: new Date(Date.now() + CART_EXPIRY_MS)
      });
    } else {
      //  Réinitialise le timer à chaque ajout
      panier.date_expiration = new Date(Date.now() + CART_EXPIRY_MS);
    }

    await panier.ajouterArticle(produit, quantite, variante_id);

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

    let panier = await Panier.findOne({ utilisateur: userId, statut: 'ACTIF' });

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    //  Vérification expiration
    if (panier.date_expiration && new Date() > new Date(panier.date_expiration)) {
      await Panier.deleteOne({ _id: panier._id });
      return res.status(400).json({ message: 'Panier expiré, veuillez recommencer' });
    }

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
      if (variante) stockDisponible = variante.quantite;
    }

    if (quantite > stockDisponible) {
      return res.status(400).json({ 
        message: 'Stock insuffisant',
        stock_disponible: stockDisponible
      });
    }

    //  Réinitialise le timer à chaque activité
    panier.date_expiration = new Date(Date.now() + CART_EXPIRY_MS);
    await panier.mettreAJourQuantite(articleId, quantite);

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

    let panier = await Panier.findOne({ utilisateur: userId, statut: 'ACTIF' });

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    await panier.supprimerArticle(articleId);

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

    let panier = await Panier.findOne({ utilisateur: userId, statut: 'ACTIF' });

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