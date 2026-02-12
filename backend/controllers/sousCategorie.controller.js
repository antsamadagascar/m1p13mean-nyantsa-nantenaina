const SousCategorie = require('../models/SousCategorie');
const Categorie = require('../models/Categorie');
const Boutique = require('../models/Boutique');
const { validationResult } = require('express-validator');

// ============================================
// CRÉER UNE SOUS-CATÉGORIE
// ============================================
exports.creerSousCategorie = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nom, description, categorieId } = req.body;

    // Vérifier que la catégorie parente existe
    const categorieParente = await Categorie.findById(categorieId);
    if (!categorieParente) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie parente non trouvée'
      });
    }

    // Vérifier si la sous-catégorie existe déjà
    const sousCategorieExistante = await SousCategorie.findOne({ nom });
    if (sousCategorieExistante) {
      return res.status(400).json({
        success: false,
        message: 'Une sous-catégorie avec ce nom existe déjà'
      });
    }

    // Créer la sous-catégorie
    const sousCategorie = new SousCategorie({
      nom,
      description,
      categorieId
    });

    await sousCategorie.save();

    // Peupler la catégorie parente
    await sousCategorie.populate('categorieId', 'nom');

    res.status(201).json({
      success: true,
      message: 'Sous-catégorie créée avec succès',
      data: sousCategorie
    });

  } catch (error) {
    console.error('Erreur création sous-catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la sous-catégorie',
      error: error.message
    });
  }
};

// ============================================
// OBTENIR TOUTES LES SOUS-CATÉGORIES
// ============================================
exports.obtenirSousCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      categorieId,
      recherche,
      tri = 'nom'
    } = req.query;

    // Construire la requête
    const query = {};

    // Filtrer par catégorie
    if (categorieId) {
      query.categorieId = categorieId;
    }

    // Recherche
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } }
      ];
    }

    // Options de tri
    let sortOptions = {};
    switch (tri) {
      case 'nom':
        sortOptions = { nom: 1 };
        break;
      case 'date':
        sortOptions = { dateCreation: -1 };
        break;
      default:
        sortOptions = { nom: 1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Exécuter la requête
    const sousCategories = await SousCategorie.find(query)
      .populate('categorieId', 'nom')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total
    const total = await SousCategorie.countDocuments(query);

    // Ajouter le nombre de boutiques pour chaque sous-catégorie
    const sousCategoriesAvecStats = await Promise.all(
      sousCategories.map(async (sc) => {
        const nbBoutiques = await Boutique.countDocuments({ 
          sous_categories: sc._id 
        });
        
        return {
          ...sc.toObject(),
          nbBoutiques
        };
      })
    );

    res.json({
      success: true,
      data: sousCategoriesAvecStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération sous-catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sous-catégories',
      error: error.message
    });
  }
};

// ============================================
// OBTENIR SOUS-CATÉGORIES PAR CATÉGORIE
// ============================================
exports.obtenirSousCategoriesParCategorie = async (req, res) => {
    try {
      const { categorieId } = req.params;
  
      // Vérifier que la catégorie existe
      const categorie = await Categorie.findById(categorieId);
      if (!categorie) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }
  
      // Récupérer uniquement les sous-catégories liées à cette catégorie
      const sousCategories = await SousCategorie.find({ categorieId })
        .sort({ nom: 1 })  // tri alphabétique
        .select('_id nom description'); // ne renvoyer que les champs nécessaires
  
      res.json({
        success: true,
        data: sousCategories
      });
  
    } catch (error) {
      console.error('Erreur récupération sous-catégories:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des sous-catégories',
        error: error.message
      });
    }
  };
  


