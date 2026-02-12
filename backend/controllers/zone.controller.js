const Zone = require('../models/Zone');

// @desc    Créer une nouvelle zone
// @route   POST /api/zones
// @access  Private/Admin
const createZone = async (req, res) => {
  try {
    const { nom, description, code, coordonnees, ordre } = req.body;

    // Vérifier si la zone existe déjà
    const zoneExiste = await Zone.findOne({ 
      $or: [
        { nom: nom },
        { code: code }
      ]
    });

    if (zoneExiste) {
      return res.status(400).json({
        success: false,
        message: 'Une zone avec ce nom ou ce code existe déjà'
      });
    }

    const zone = await Zone.create({
      nom,
      description,
      code,
      coordonnees,
      ordre
    });

    res.status(201).json({
      success: true,
      message: 'Zone créée avec succès',
      data: zone
    });

  } catch (error) {
    console.error('❌ Erreur création zone:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Obtenir toutes les zones
// @route   GET /api/zones
// @access  Public
const getAllZones = async (req, res) => {
  try {
    const { actif } = req.query;
    
    let filter = {};
    if (actif !== undefined) {
      filter.actif = actif === 'true';
    }

    const zones = await Zone.find(filter).sort({ ordre: 1, nom: 1 });

    res.json({
      success: true,
      data: zones,
      count: zones.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération zones:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Obtenir une zone par ID
// @route   GET /api/zones/:id
// @access  Public
const getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone non trouvée'
      });
    }

    res.json({
      success: true,
      data: zone
    });

  } catch (error) {
    console.error('❌ Erreur récupération zone:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une zone
// @route   PUT /api/zones/:id
// @access  Private/Admin
const updateZone = async (req, res) => {
  try {
    const { nom, description, code, coordonnees, ordre, actif } = req.body;

    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone non trouvée'
      });
    }

    // Vérifier l'unicité si nom ou code modifiés
    if (nom && nom !== zone.nom) {
      const nomExiste = await Zone.findOne({ nom });
      if (nomExiste) {
        return res.status(400).json({
          success: false,
          message: 'Une zone avec ce nom existe déjà'
        });
      }
    }

    if (code && code !== zone.code) {
      const codeExiste = await Zone.findOne({ code });
      if (codeExiste) {
        return res.status(400).json({
          success: false,
          message: 'Une zone avec ce code existe déjà'
        });
      }
    }

    // Mise à jour
    zone.nom = nom || zone.nom;
    zone.description = description !== undefined ? description : zone.description;
    zone.code = code || zone.code;
    zone.coordonnees = coordonnees || zone.coordonnees;
    zone.ordre = ordre !== undefined ? ordre : zone.ordre;
    zone.actif = actif !== undefined ? actif : zone.actif;

    await zone.save();

    res.json({
      success: true,
      message: 'Zone mise à jour avec succès',
      data: zone
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour zone:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Supprimer une zone
// @route   DELETE /api/zones/:id
// @access  Private/Admin
const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone non trouvée'
      });
    }

    // Vérifier si des boutiques utilisent cette zone
    const Boutique = require('../models/Boutique');
    const boutiquesCount = await Boutique.countDocuments({ 'localisation.zone': req.params.id });

    if (boutiquesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette zone. ${boutiquesCount} boutique(s) l'utilisent.`,
        count: boutiquesCount
      });
    }

    await Zone.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Zone supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression zone:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Activer/Désactiver une zone
// @route   PATCH /api/zones/:id/toggle-actif
// @access  Private/Admin
const toggleZoneActif = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone non trouvée'
      });
    }

    zone.actif = !zone.actif;
    await zone.save();

    res.json({
      success: true,
      message: `Zone ${zone.actif ? 'activée' : 'désactivée'} avec succès`,
      data: zone
    });

  } catch (error) {
    console.error('❌ Erreur toggle zone:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

module.exports = {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
  deleteZone,
  toggleZoneActif
};