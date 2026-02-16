const Produit = require('../models/Produit');

/**
 * Récupère la liste des produits avec filtres et pagination
 */
exports.getProduits = async (req, res) => {
  try {
    const {
      recherche,
      categorie,
      sous_categorie,
      boutique,
      statut,
      prix_min,
      prix_max,
      marque,
      condition,
      en_promotion,
      en_stock,
      tags,
      tri = 'nouveaute',
      page = 1,
      limite = 12,
      admin = 'false'  //  if admin
    } = req.query;

    // Construction du filtre
    const filtre = {};

    // Si admin=true, on affiche tous les statuts (sauf si statut spécifique demandé)
    // Sinon, uniquement ACTIF
    if (admin === 'true') {
      if (statut) {
        filtre.statut = statut;
      }
      // Si admin et pas de filtre statut, on affiche tout
    } else {
      // Public : uniquement ACTIF
      filtre.statut = 'ACTIF';
    }

    // Recherche textuelle
    if (recherche) {
      filtre.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { reference: { $regex: recherche, $options: 'i' } },
        { tags: { $in: [new RegExp(recherche, 'i')] } }
      ];
    }

    if (categorie) filtre.categorie = categorie;
    if (sous_categorie) filtre.sous_categorie = sous_categorie;
    if (boutique) filtre.boutique = boutique;

    if (marque) {
      const marques = marque.split(',');
      filtre.marque = { $in: marques };
    }

    if (prix_min || prix_max) {
      filtre.prix = {};
      if (prix_min) filtre.prix.$gte = parseFloat(prix_min);
      if (prix_max) filtre.prix.$lte = parseFloat(prix_max);
    }

    if (condition) {
      const conditions = condition.split(',');
      filtre.condition = { $in: conditions };
    }

    if (en_promotion === 'true') {
      filtre.prix_promo = { $exists: true, $ne: null };
      filtre.$expr = {
        $and: [
          { $ne: ['$prix_promo', null] },
          { $lt: ['$prix_promo', '$prix'] }
        ]
      };
    }

    if (tags) {
      const tagsList = tags.split(',');
      filtre.tags = { $in: tagsList };
    }

    // Options de tri
    let sortOptions = {};
    switch (tri) {
      case 'prix_asc':
        sortOptions = { prix: 1 };
        break;
      case 'prix_desc':
        sortOptions = { prix: -1 };
        break;
      case 'populaire':
        sortOptions = { ventes: -1, vues: -1 };
        break;
      case 'meilleures_notes':
        sortOptions = { note_moyenne: -1, nombre_avis: -1 };
        break;
      case 'nouveaute':
      default:
        sortOptions = { date_creation: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limite);

    let query = Produit.find(filtre)
      .populate('boutique', 'nom slug')
      .populate('categorie', 'nom')
      .populate('sous_categorie', 'nom')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limite));

    if (en_stock === 'true') {
      query = query.where('quantite').gt(0);
    }

    const [produits, total] = await Promise.all([
      query.exec(),
      Produit.countDocuments(filtre)
    ]);

    const pages = Math.ceil(total / parseInt(limite));

    res.json({
      produits,
      total,
      page: parseInt(page),
      pages,
      limite: parseInt(limite)
    });

  } catch (error) {
    console.error('Erreur getProduits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits',
      error: error.message
    });
  }
};

/**
 * Récupère les filtres disponibles
 */
exports.getFiltresDisponibles = async (req, res) => {
  try {
    const { categorie, sous_categorie } = req.query;

    const filtre = { statut: 'ACTIF' };
    
    if (categorie) filtre.categorie = categorie;
    if (sous_categorie) filtre.sous_categorie = sous_categorie;

    const [categoriesAgg, sousCategories, marques, prixRange, boutiques] = await Promise.all([
      Produit.aggregate([
        { $match: filtre },
        { $group: { _id: '$categorie', count: { $sum: 1 } }},
        { $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categorie'
        }},
        { $unwind: '$categorie' },
        { $project: {
          _id: '$categorie._id',
          nom: '$categorie.nom',
          count: 1
        }},
        { $sort: { nom: 1 } }
      ]),

      Produit.aggregate([
        { $match: { ...filtre, sous_categorie: { $exists: true } } },
        { $group: { _id: '$sous_categorie', count: { $sum: 1 } }},
        { $lookup: {
          from: 'souscategories',
          localField: '_id',
          foreignField: '_id',
          as: 'sous_categorie'
        }},
        { $unwind: '$sous_categorie' },
        { $project: {
          _id: '$sous_categorie._id',
          nom: '$sous_categorie.nom',
          count: 1
        }},
        { $sort: { nom: 1 } }
      ]),

      Produit.aggregate([
        { $match: { ...filtre, marque: { $exists: true, $ne: null } } },
        { $group: { _id: '$marque', count: { $sum: 1 } }},
        { $project: { _id: 0, nom: '$_id', count: 1 }},
        { $sort: { nom: 1 } }
      ]),

      Produit.aggregate([
        { $match: filtre },
        { $group: {
          _id: null,
          prix_min: { $min: '$prix' },
          prix_max: { $max: '$prix' }
        }}
      ]),

      Produit.aggregate([
        { $match: filtre },
        { $group: { _id: '$boutique', count: { $sum: 1 } }},
        { $lookup: {
          from: 'boutiques',
          localField: '_id',
          foreignField: '_id',
          as: 'boutique'
        }},
        { $unwind: '$boutique' },
        { $project: {
          _id: '$boutique._id',
          nom: '$boutique.nom',
          count: 1
        }},
        { $sort: { nom: 1 } }
      ])
    ]);

    res.json({
      categories: categoriesAgg,
      sous_categories: sousCategories,
      marques: marques.filter(m => m.nom), 
      prix_min: prixRange[0]?.prix_min || 0,
      prix_max: prixRange[0]?.prix_max || 0,
      boutiques: boutiques
    });

  } catch (error) {
    console.error('Erreur getFiltresDisponibles:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des filtres',
      error: error.message
    });
  }
};

/**
 * Récupère un produit par ID ou slug
 */
exports.getProduit = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isValidObjectId 
      ? { _id: idOrSlug, statut: 'ACTIF' }
      : { slug: idOrSlug, statut: 'ACTIF' };

    const produit = await Produit.findOne(query)
      .populate('boutique', 'nom slug logo contact horaires')
      .populate('categorie', 'nom slug')
      .populate('sous_categorie', 'nom slug');

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json(produit);

  } catch (error) {
    console.error('Erreur getProduit:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du produit',
      error: error.message
    });
  }
};

/**
 * Récupère les produits similaires
 */
exports.getProduitsSimilaires = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 4 } = req.query;

    const produit = await Produit.findById(id);

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const produitsSimilaires = await Produit.find({
      _id: { $ne: id },
      $or: [
        { categorie: produit.categorie },
        { sous_categorie: produit.sous_categorie },
        { tags: { $in: produit.tags || [] } }
      ],
      statut: 'ACTIF'
    })
      .populate('boutique', 'nom slug')
      .populate('categorie', 'nom')
      .limit(parseInt(limite))
      .sort({ ventes: -1, note_moyenne: -1 });

    res.json(produitsSimilaires);

  } catch (error) {
    console.error('Erreur getProduitsSimilaires:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits similaires',
      error: error.message
    });
  }
};

/**
 * Met à jour le statut d'un produit
 */
exports.updateStatutProduit = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const statutsValides = ['BROUILLON', 'ACTIF', 'RUPTURE', 'ARCHIVE'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const updateData = { statut };
    if (statut === 'RUPTURE') updateData.quantite = 0;

    const produit = await Produit.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('boutique', 'nom slug')
    .populate('categorie', 'nom')
    .populate('sous_categorie', 'nom');

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({
      message: 'Statut mis à jour avec succès',
      produit
    });

  } catch (error) {
    console.error('Erreur updateStatutProduit:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

module.exports = exports;