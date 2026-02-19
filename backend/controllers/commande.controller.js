const Commande = require('../models/Commande');
const Panier = require('../models/Panier');
const Produit = require('../models/Produit');

/**
 * Crée une commande depuis le panier actif (step by step)
 */
exports.creerCommande = async (req, res) => {
  try {
    const userId = req.user._id;
    const { adresse_livraison } = req.body;

    // 1. Validation adresse
    if (!adresse_livraison || !adresse_livraison.adresse || !adresse_livraison.telephone)
    {   return res.status(400).json({ message: 'Adresse de livraison incomplète' }); }

    // 2. Récupération du  panier actif
    const panier = await Panier.findOne({
      utilisateur: userId,
      statut: 'ACTIF'
    }).populate('articles.produit');

    if (!panier || panier.articles.length === 0) 
    {   return res.status(400).json({ message: 'Panier vide ou introuvable' }); }

    // 3. Vérifie si un panier et en expiration 
    if (panier.date_expiration && new Date() > new Date(panier.date_expiration)) {
      await Panier.deleteOne({ _id: panier._id });
      return res.status(400).json({ message: 'Panier expiré, veuillez recommencer' });
    }

    // 4. Vérifie le stock ET décrémente pour chaque article
    const articlesSnapshot = [];

    for (const article of panier.articles) {
      const produit = await Produit.findById(article.produit._id);

      if (!produit) {
        return res.status(404).json({ message: `Produit introuvable` });
      }

      // stock de type variantes 
      if (article.variante) {
        // Produit avec variante
        const variante = produit.variantes.id(article.variante);
        if (!variante) 
        {  return res.status(404).json({ message: `Variante introuvable pour ${produit.nom}` }); }
       
        if (variante.quantite < article.quantite) {
          return res.status(400).json({
            message: `Stock insuffisant pour ${produit.nom} - ${variante.nom}`,
            stock_disponible: variante.quantite
          });
        }
        //  on Décrémente le stock variante
        variante.quantite -= article.quantite;
      }
      // eto ndray stock simple sans variantes
      else {
        // Produit simple
        if (produit.quantite < article.quantite) {
          return res.status(400).json({
            message: `Stock insuffisant pour ${produit.nom}`,
            stock_disponible: produit.quantite
          });
        }
        // Décrémente le stock simple
        produit.quantite -= article.quantite;
      }

      await produit.save();

      // Snapshot du produit au moment de la commande
      articlesSnapshot.push({
        produit: produit._id,
        variante: article.variante || null,
        nom_produit: produit.nom,
        sku: article.variante ? produit.variantes.id(article.variante)?.sku : produit.reference,
        quantite: article.quantite,
        prix_unitaire: article.prix_unitaire,
        prix_promo_unitaire: article.prix_promo_unitaire || null
      });
    }

    // 5. Génére un référence unique
    const reference = `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 6. Création du  commande (status en  attente)
    const commande = await Commande.create({
      utilisateur: userId,
      panier: panier._id,
      articles: articlesSnapshot,
      adresse_livraison,
      sous_total: panier.sous_total,
      total_remise: panier.total_remise,
      total: panier.total,
      statut: 'EN_ATTENTE',
      reference
    });

    // 7. Passer le panier en CONVERTI
    panier.statut = 'CONVERTI';
    panier.date_conversion = new Date();
    panier.commande = commande._id;
    await panier.save();

    res.status(201).json(commande);

  } catch (error) {
    console.error('Erreur creerCommande:', error);
    res.status(500).json({ message: 'Erreur création commande', error: error.message });
  }
};

/**
 * Récupère les commandes de l'utilisateur connecté
 */
exports.getMesCommandes = async (req, res) => {
  try {
    const userId = req.user._id;

    const commandes = await Commande.find({ utilisateur: userId })
      .sort({ date_creation: -1 })
      .select('reference statut total date_creation articles');

    res.json(commandes);
  } catch (error) {
    console.error('Erreur getMesCommandes:', error);
    res.status(500).json({ message: 'Erreur récupération commandes', error: error.message });
  }
};

/**
 * Récupère le détail d'une commande
 */
exports.getCommandeDetail = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const commande = await Commande.findOne({ _id: id, utilisateur: userId })
      .populate('utilisateur', 'nom email')
      .populate('adresse_livraison.zone');

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    res.json(commande);
  } catch (error) {
    console.error('Erreur getCommandeDetail:', error);
    res.status(500).json({ message: 'Erreur récupération commande', error: error.message });
  }
};

/**
 * Annule une commande et restitue le stock
 */
exports.annulerCommande = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const commande = await Commande.findOne({ _id: id, utilisateur: userId });

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    if (!['EN_ATTENTE'].includes(commande.statut)) {
      return res.status(400).json({ message: 'Cette commande ne peut plus être annulée' });
    }

    // Restituer le stock
    for (const article of commande.articles) {
      const produit = await Produit.findById(article.produit);
      if (!produit) continue;

      if (article.variante) {
        const variante = produit.variantes.id(article.variante);
        if (variante) variante.quantite += article.quantite;
      } else {
        produit.quantite += article.quantite;
      }
      await produit.save();
    }

    commande.statut = 'ANNULEE';
    await commande.save();

    res.json({ message: 'Commande annulée avec succès', commande });

  } catch (error) {
    console.error('Erreur annulerCommande:', error);
    res.status(500).json({ message: 'Erreur annulation commande', error: error.message });
  }
};

module.exports = exports;