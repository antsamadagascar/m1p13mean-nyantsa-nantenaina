const Categorie = require('../models/Categorie');
const Boutique = require('../models/Boutique');
const { validationResult } = require('express-validator');

// ============================================
// CRÉER UNE CATÉGORIE
// ============================================
exports.creerCategorie = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nom, description } = req.body;

    // Vérifier si la catégorie existe déjà
    const categorieExistante = await Categorie.findOne({ nom });
    if (categorieExistante) {
      return res.status(400).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà'
      });
    }

    // Créer la catégorie
    const categorie = new Categorie({
      nom,
      description
    });

    await categorie.save();

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: categorie
    });

  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie',
      error: error.message
    });
  }
};

// ============================================
// OBTENIR TOUTES LES CATÉGORIES
// ============================================
exports.obtenirCategories = async (req, res) => {
try {
    const categories = await Categorie.find().sort({ nom: 1 });

    res.status(200).json({
    success: true,
    data: categories
    });

} catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
    success: false,
    message: 'Erreur lors de la récupération des catégories'
    });
}
};

// ============================================
// OBTENIR UNE CATÉGORIE PAR ID
// ============================================
exports.obtenirCategorieParId = async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id);

    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Obtenir les sous-catégories
    const sousCategories = await SousCategorie.find({ categorieId: categorie._id });

    // Compter les boutiques
    const nbBoutiques = await Boutique.countDocuments({ categorie: categorie._id });

    res.json({
      success: true,
      data: {
        ...categorie.toObject(),
        sousCategories,
        nbBoutiques
      }
    });

  } catch (error) {
    console.error('Erreur récupération catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie',
      error: error.message
    });
  }
};
