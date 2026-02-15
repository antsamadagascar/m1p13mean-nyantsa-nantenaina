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
      prix_min,
      prix_max,
      marque,
      condition,
      en_promotion,
      en_stock,
      tags,
      tri = 'nouveaute',
      page = 1,
      limite = 12
    } = req.query;

    // Construction du filtre
    const filtre = 
    {   statut: 'ACTIF' };

    // Recherche textuelle
    if (recherche) {
      filtre.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { tags: { $in: [new RegExp(recherche, 'i')] } }
      ];
    }

    // Catégorie
    if (categorie) 
    {   filtre.categorie = categorie;  }

    // Sous-catégorie
    if (sous_categorie) 
    {   filtre.sous_categorie = sous_categorie;}

    // Boutique
    if (boutique) 
    {   filtre.boutique = boutique; }

    // Marque(s)
    if (marque) 
    {
      const marques = marque.split(',');
      filtre.marque = { $in: marques };
    }

    // Prix
    if (prix_min || prix_max) {
      filtre.prix = {};
      if (prix_min) filtre.prix.$gte = parseFloat(prix_min);
      if (prix_max) filtre.prix.$lte = parseFloat(prix_max);
    }


    // Condition(s)
    if (condition) {
      const conditions = condition.split(',');
      filtre.condition = { $in: conditions };
    }

    // En promotion
    if (en_promotion === 'true') {
      filtre.prix_promo = { $exists: true, $ne: null };
      filtre.$expr = {
        $and: [
          { $ne: ['$prix_promo', null] },
          { $lt: ['$prix_promo', '$prix'] }
        ]
      };
    }

    // Tags
    if (tags)
    {
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

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limite);

    // Requête avec population
    let query = Produit.find(filtre)
      .populate('boutique', 'nom slug')
      .populate('categorie', 'nom')
      .populate('sous_categorie', 'nom')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limite));

    // En stock uniquement (miankina @ gesions stock)
    if (en_stock === 'true') 
    {   query = query.where('quantite').gt(0); }

    // Exécution de la requête
    const [produits, total] = await Promise.all([
      query.exec(),
      Produit.countDocuments(filtre)
    ]);

    // Calcul du nombre de pages
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
    
    if (categorie) 
    {   filtre.categorie = categorie; }
    
    if (sous_categorie) 
    {  filtre.sous_categorie = sous_categorie; }

    // Aggrégation pour obtenir les filtres disponibles
    const [categoriesAgg, sousCategories, marques, prixRange, boutiques] = await Promise.all([
      // Catégories avec comptage
      Produit.aggregate([
        { $match: filtre },
        { $group: { 
          _id: '$categorie', 
          count: { $sum: 1 } 
        }},
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

      // Sous-catégories avec comptage
      Produit.aggregate([
        { $match: { ...filtre, sous_categorie: { $exists: true } } },
        { $group: { 
          _id: '$sous_categorie', 
          count: { $sum: 1 } 
        }},
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

      // Marques avec comptage
      Produit.aggregate([
        { $match: { ...filtre, marque: { $exists: true, $ne: null } } },
        { $group: { 
          _id: '$marque', 
          count: { $sum: 1 } 
        }},
        { $project: {
          _id: 0,
          nom: '$_id',
          count: 1
        }},
        { $sort: { nom: 1 } }
      ]),

      // Prix min/max
      Produit.aggregate([
        { $match: filtre },
        { $group: {
          _id: null,
          prix_min: { $min: '$prix' },
          prix_max: { $max: '$prix' }
        }}
      ]),

      // Boutiques avec comptage
      Produit.aggregate([
        { $match: filtre },
        { $group: { 
          _id: '$boutique', 
          count: { $sum: 1 } 
        }},
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

    // Vérifie si c'est un ObjectId MongoDB valide
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    // Recherche par ID ou slug
    const query = isValidObjectId 
      ? { _id: idOrSlug, statut: 'ACTIF' }
      : { slug: idOrSlug, statut: 'ACTIF' };

    const produit = await Produit.findOne(query)
      .populate('boutique', 'nom slug logo contact horaires')
      .populate('categorie', 'nom slug')
      .populate('sous_categorie', 'nom slug');

    if (!produit) {
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
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
      return res.status(404).json({
        message: 'Produit non trouvé'
      });
    }

    // Produits similaires : même catégorie ou sous-catégorie
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

module.exports = exports;