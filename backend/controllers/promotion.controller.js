// controllers/promotionController.js
const Promotion = require('../models/Promotion');
const Produit = require('../models/Produit');

// Créer une promotion pour un produit
exports.createPromotionProduit = async (req, res) => {
  try {
    const { produitId } = req.params;

    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    if (!req.user.boutiqueId) {
      return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
    }

    // Vérifier que le produit existe et appartient à la boutique
    const produit = await Produit.findOne({
      _id: produitId,
      boutique: req.user.boutiqueId
    });

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const {
      nom,
      description,
      type,
      valeur,
      prix_fixe,
      date_debut,
      date_fin,
      actif,
      priorite,
      afficher_badge,
      badge_couleur,
      badge_texte
    } = req.body;

    // Validation
    if (!nom || !type || !valeur || !date_debut || !date_fin) {
      return res.status(400).json({ 
        message: 'Champs obligatoires manquants' 
      });
    }

    // Vérifier que date_fin > date_debut
    if (new Date(date_fin) <= new Date(date_debut)) {
      return res.status(400).json({ 
        message: 'La date de fin doit être après la date de début' 
      });
    }

    // Validation selon le type
    if (type === 'POURCENTAGE' && (valeur < 0 || valeur > 100)) {
      return res.status(400).json({ 
        message: 'Le pourcentage doit être entre 0 et 100' 
      });
    }

    if (type === 'PRIX_FIXE' && (!prix_fixe || prix_fixe >= produit.prix)) {
      return res.status(400).json({ 
        message: 'Le prix fixe doit être inférieur au prix actuel' 
      });
    }

    // Créer la promotion
    const promotion = new Promotion({
      nom,
      description: description || '',
      type,
      valeur: Number(valeur),
      prix_fixe: prix_fixe ? Number(prix_fixe) : null,
      date_debut: new Date(date_debut),
      date_fin: new Date(date_fin),
      produit: produitId,
      actif: actif !== undefined ? actif : true,
      priorite: priorite || 0,
      afficher_badge: afficher_badge !== undefined ? afficher_badge : true,
      badge_couleur: badge_couleur || '#ff6b6b',
      badge_texte: badge_texte || null,
      boutique: req.user.boutiqueId
    });

    await promotion.save();
    // Désactiver ancienne promotion active
    if (produit.promotion_active) {
        await Promotion.findByIdAndUpdate(
        produit.promotion_active,
        { actif: false }
        );
    }
  
    // Calculer et appliquer le prix promo au produit
    const prixPromo = promotion.calculerPrixPromo(produit.prix);
    produit.prix_promo = prixPromo;
    produit.promotion_active = promotion._id;
    await produit.save();

    const promotionPopulate = await Promotion.findById(promotion._id)
      .populate('produit', 'nom reference prix');

    res.status(201).json(promotionPopulate);

  } catch (error) {
    console.error('Erreur createPromotionProduit:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une promotion
exports.updatePromotionProduit = async (req, res) => {
  try {
    const { produitId, promotionId } = req.params;

    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    const promotion = await Promotion.findOne({
      _id: promotionId,
      produit: produitId,
      boutique: req.user.boutiqueId
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion non trouvée' });
    }

    const produit = await Produit.findById(produitId);

    // Mise à jour des champs
    const fieldsToUpdate = [
      'nom', 'description', 'type', 'valeur', 'prix_fixe',
      'date_debut', 'date_fin', 'actif', 'priorite', 
      'afficher_badge', 'badge_couleur', 'badge_texte'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (['date_debut', 'date_fin'].includes(field)) {
          promotion[field] = new Date(req.body[field]);
        } else {
          promotion[field] = req.body[field];
        }
      }
    });

    await promotion.save();

    // Recalculer le prix promo
    const prixPromo = promotion.calculerPrixPromo(produit.prix);
    produit.prix_promo = prixPromo;
    await produit.save();

    const promotionPopulate = await Promotion.findById(promotion._id)
      .populate('produit', 'nom reference prix');

    res.json(promotionPopulate);

  } catch (error) {
    console.error('Erreur updatePromotionProduit:', error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une promotion (et retirer du produit)
exports.deletePromotionProduit = async (req, res) => {
    try {
      const { promotionId } = req.params;
  
      const promotion = await Promotion.findById(promotionId);
      if (!promotion) return res.status(404).json({ message: 'Promotion non trouvée' });
  
      // Soft delete avec date
      promotion.supprime = true;
      promotion.actif = false;
      promotion.date_suppression = new Date();
      await promotion.save();
  
      // Mettre à jour le produit si la promotion était active
      const produit = await Produit.findById(promotion.produit);
      if (produit && produit.promotion_active?.toString() === promotion._id.toString()) {
        produit.promotion_active = null;
        produit.prix_promo = null;
        await produit.save();
      }
  
      res.status(200).json({ message: 'Promotion supprimée avec succès (soft delete)' });
  
    } catch (error) {
      console.error('Erreur deletePromotionProduit:', error);
      res.status(500).json({ message: error.message });
    }
  };
  

// Obtenir la promotion d'un produit
exports.getPromotionProduit = async (req, res) => {
  try {
    const { produitId } = req.params;

    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    const promotion = await Promotion.findOne({
      produit: produitId,
      boutique: req.user.boutiqueId,
      actif: true
    }).populate('produit', 'nom reference prix');

    if (!promotion) {
      return res.status(404).json({ message: 'Aucune promotion active pour ce produit' });
    }

    res.json(promotion);

  } catch (error) {
    console.error('Erreur getPromotionProduit:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtenir toutes les promotions de la boutique
exports.getMesPromotions = async (req, res) => {
  try {
    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    if (!req.user.boutiqueId) {
      return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
    }

    const { actif, expire } = req.query;
    
    const filter = { boutique: req.user.boutiqueId };
    
    if (actif !== undefined) {
      filter.actif = actif === 'true';
    }

    const promotions = await Promotion.find(filter)
      .populate('produit', 'nom reference prix images')
      .sort({ date_creation: -1 });

    // Filtrer les promotions expirées si demandé
    let result = promotions;
    if (expire === 'false') {
      result = promotions.filter(p => !p.est_expiree);
    } else if (expire === 'true') {
      result = promotions.filter(p => p.est_expiree);
    }

    res.json(result);

  } catch (error) {
    console.error('Erreur getMesPromotions:', error);
    res.status(500).json({ message: error.message });
  }
};

// module.exports = {
//   createPromotionProduit,
//   updatePromotionProduit,
//   deletePromotionProduit,
//   getPromotionProduit,
//   getMesPromotions
// };