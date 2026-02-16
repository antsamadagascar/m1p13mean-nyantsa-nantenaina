const Boutique = require('../models/Boutique');
const Zone = require('../models/Zone');
const slugify = require('slugify');
const { sendBoutiqueCreationEmail } = require('../services/email.service');
// IMPORT DE L'UTILITAIRE
const HorairesUtils = require('../utils/boutique-horaires.utils');

// @desc    Créer une nouvelle boutique
// @route   POST /api/boutiques
// @access  Private
const createBoutique = async (req, res) => {
  try {
    const { 
      nom, 
      description, 
      gerant, 
      localisation, 
      contact, 
      categorie, 
      sous_categories,
      horaires 
    } = req.body;

    // Vérifier que la zone existe et est active
    const zone = await Zone.findById(localisation.zone);
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone non trouvée'
      });
    }

    if (!zone.actif) {
      return res.status(400).json({
        success: false,
        message: 'Cette zone n\'est pas active actuellement'
      });
    }

    // Générer le slug
    const slug = slugify(nom, { 
      lower: true, 
      strict: true,
      locale: 'fr'
    });

    // Données de localisation
    const localisationData = {
      zone: localisation.zone,
      numero: localisation.numero,
      surface: localisation.surface || null,
      latitude: localisation.latitude || null,
      longitude: localisation.longitude || null,
      adresse_complete: localisation.adresse_complete || null
    };

    // Création de boutique avec horaires personnalisés ou par défaut
    const boutiqueData = {
      nom,
      slug,
      description,
      gerant,
      localisation: localisationData,
      contact,
      categorie,
      sous_categories: sous_categories || []
    };

    // Si des horaires personnalisés sont fournis, les utiliser
    if (horaires) {
      boutiqueData.horaires = horaires;
    }

    const boutique = await Boutique.create(boutiqueData);

    // Peupler les références
    await boutique.populate('categorie sous_categories localisation.zone');

    // ENVOYER L'EMAIL AU GÉRANT
    try {
      await sendBoutiqueCreationEmail(boutique);
      console.log('Email envoyé au gérant');
    } catch (emailError) {
      console.error('Erreur envoi email (boutique créée quand même):', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Boutique créée avec succès',
      data: boutique
    });

  } catch (error) {
    // Erreur de validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }

    // Erreur de duplication
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Une boutique avec ce ${field} existe déjà`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Obtenir une boutique par ID
// @route   GET /api/boutiques/:id
// @access  Private
const getBoutiqueById = async (req, res) => {
  try {
    const boutique = await Boutique
      .findById(req.params.id)
      .populate('categorie sous_categories localisation.zone');

    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: boutique
    });

  } catch (error) {
    console.error('Erreur récupération boutique:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Obtenir toutes les boutiques (avec filtres)
const getBoutiques = async (req, res) => {
  try {
    const { statut, categorie, zone, search } = req.query;
    let filters = {};

    // Filtrage par statut
    if (statut) {
      if (statut === 'actif') filters['statut.actif'] = true;
      else if (statut === 'en_attente') filters['statut.en_attente_validation'] = true;
      else if (statut === 'suspendu') filters['statut.suspendu'] = true;
    }

    // Filtrage par catégorie
    if (categorie) filters.categorie = categorie;

    // Filtrage par zone (sécurisé)
    if (zone) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(zone)) {
        filters['localisation.zone'] = zone;
      } else {
        return res.status(400).json({
          success: false,
          message: 'ID de zone invalide'
        });
      }
    }

    // Filtrage par recherche
    if (search) filters.nom = { $regex: search, $options: 'i' };

    const boutiques = await Boutique.find(filters)
      .populate('categorie')
      .populate('sous_categories')
      .populate('localisation.zone')
      .sort({ date_creation: -1 });

    // UTILISATION DE L'UTILITAIRE pour ajouter le statut
    const boutiquesAvecStatut = HorairesUtils.ajouterStatutOuvertureBatch(boutiques);

    res.json({ success: true, data: boutiquesAvecStatut });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir UNE boutique par ID
const getBoutiqueDetailsById = async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate('categorie')
      .populate('sous_categories')
      .populate('localisation.zone'); 

    if (!boutique) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    // UTILISATION DE L'UTILITAIRE pour ajouter le statut
    const boutiqueAvecStatut = HorairesUtils.ajouterStatutOuverture(boutique);

    res.json(boutiqueAvecStatut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suspendre une boutique
const suspendreBoutique = async (req, res) => {
  try {
    const { motif } = req.body;

    if (!motif) {
      return res.status(400).json({ message: 'Motif de suspension requis' });
    }

    const boutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      {
        'statut.actif': false,
        'statut.suspendu': true,
        'statut.motif_suspension': motif,
        'statut.date_suspension': new Date()
      },
      { new: true }
    );

    if (!boutique) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    res.json({ message: 'Boutique suspendue', boutique });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Réactiver une boutique suspendue
const reactiverBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      {
        'statut.actif': true,
        'statut.suspendu': false,
        'statut.motif_suspension': null,
        'statut.date_suspension': null
      },
      { new: true }
    );

    if (!boutique) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    res.json({ message: 'Boutique réactivée', boutique });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BOUTIQUES PUBLIQUES - UTILISE L'UTILITAIRE
const getBoutiquesPublic = async (req, res) => {
  try {
    const { categorie, zone, search } = req.query;
    
    // Filtres de base : UNIQUEMENT boutiques actives et validées
    let filters = {
      'statut.actif': true,
      'statut.suspendu': false
    };

    if (categorie) filters.categorie = categorie;
    if (zone) filters['localisation.zone'] = zone;
    if (search) filters.nom = { $regex: search, $options: 'i' };

    const boutiques = await Boutique.find(filters)
      .populate('categorie')
      .populate('sous_categories')
      .populate('localisation.zone')
      .sort({ 'date_creation': -1 });

    // UTILISATION DE L'UTILITAIRE pour ajouter le statut
    const boutiquesAvecStatut = HorairesUtils.ajouterStatutOuvertureBatch(boutiques);

    res.json(boutiquesAvecStatut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/boutiques/all
const getAllBoutiques = async (req, res) => {
  try {
    const boutiques = await Boutique.find()
      .select('_id nom slug') // récupère uniquement ces champs
      .sort({ date_creation: -1 });

    res.json(boutiques);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createBoutique,
  getBoutiqueById,
  getBoutiques,
  getBoutiqueDetailsById,     
  suspendreBoutique,   
  reactiverBoutique,
  getBoutiquesPublic,
  getAllBoutiques
};