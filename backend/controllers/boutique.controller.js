const Boutique = require('../models/Boutique');
const Zone = require('../models/Zone');
const slugify = require('slugify');
const { sendBoutiqueCreationEmail } = require('../services/email.service');
// IMPORT DE L'UTILITAIRE
const HorairesUtils = require('../utils/boutique-horaires.utils');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


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
    // Si l'utilisateur est BOUTIQUE, on vérifie qu'il accède à SA boutique
    if (req.user && req.user.role === 'BOUTIQUE') {
      if (req.user.boutiqueId !== req.params.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Accès refusé' 
        });
      }
    }

    const boutique = await Boutique.findById(req.params.id)
      .populate('categorie')
      .populate('sous_categories')
      .populate('localisation.zone');

    if (!boutique) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

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

// get horaires ByBoutiqueId
const getMesHoraires = async (req, res) => 
{
  try {
    const boutique = await Boutique.findById(req.params.id).select('nom horaires');
    if (!boutique) return res.status(404).json({ message: 'Boutique non trouvée' });
    res.json({ success: true, data: boutique });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//config horaires by role boutique
const updateHoraires = async (req, res) => {
  try {
    const { horaires } = req.body;
    const boutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      { horaires },
      { new: true }
    );
    if (!boutique) return res.status(404).json({ message: 'Boutique non trouvée' });
    res.json({ success: true, data: boutique.horaires });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBoutique = async (req, res) => {
  try {
    const {
      nom,
      description,
      gerant,
      localisation,
      contact,
      categorie,
      sous_categories,
      logo,
      banniere  
    } = req.body;

    const updateData = {};

    if (nom !== undefined) {
      updateData.nom = nom;
      updateData.slug = slugify(nom, { lower: true, strict: true, locale: 'fr' });
    }
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (banniere !== undefined) updateData.banniere = banniere;
    if (categorie !== undefined) updateData.categorie = categorie;
    if (sous_categories !== undefined) updateData.sous_categories = sous_categories;

    // Gérant — mise à jour partielle des sous-champs
    if (gerant) {
      if (gerant.nom !== undefined) updateData['gerant.nom'] = gerant.nom;
      if (gerant.prenom !== undefined) updateData['gerant.prenom'] = gerant.prenom;
      if (gerant.email !== undefined) updateData['gerant.email'] = gerant.email;
      if (gerant.telephone !== undefined) updateData['gerant.telephone'] = gerant.telephone;
    }

    // Localisation -> mise à jour partielle des sous-champs
    if (localisation) {
      if (localisation.zone !== undefined) updateData['localisation.zone'] = localisation.zone;
      if (localisation.adresse_complete !== undefined) updateData['localisation.adresse_complete'] = localisation.adresse_complete;
      if (localisation.latitude !== undefined) updateData['localisation.latitude'] = localisation.latitude;
      if (localisation.longitude !== undefined) updateData['localisation.longitude'] = localisation.longitude;
      if (localisation.surface !== undefined) updateData['localisation.surface'] = localisation.surface;
      if (localisation.emplacement_complet !== undefined) updateData['localisation.emplacement_complet'] = localisation.emplacement_complet;

      // Vérifie que la nouvelle zone existe et est active
      if (localisation.zone) {
        const zone = await Zone.findById(localisation.zone);
        if (!zone) {
          return res.status(404).json({ success: false, message: 'Zone non trouvée' });
        }
        if (!zone.actif) {
          return res.status(400).json({ success: false, message: 'Cette zone n\'est pas active' });
        }
      }
    }

    // Contact — mise à jour partielle des sous-champs
    if (contact) {
      const contactFields = ['telephone', 'email', 'site_web', 'whatsapp', 'facebook', 'instagram', 'twitter', 'tiktok'];
      contactFields.forEach(field => {
        if (contact[field] !== undefined) {
          updateData[`contact.${field}`] = contact[field];
        }
      });
    }

    const boutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('categorie sous_categories localisation.zone');

    if (!boutique) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    res.json({ success: true, message: 'Boutique mise à jour avec succès', data: boutique });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Erreur de validation', errors: messages });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ce nom est déjà utilisé par une autre boutique' });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};


// Config multer pour boutiques
const storageBoutique = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/boutiques';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `boutique-${req.params.id}-${Date.now()}${ext}`);
  }
});

const uploadBoutique = multer({
  storage: storageBoutique,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier non valide'));
  }
});

const uploadImageBoutique = async (req, res) => {
  try {
    const { field } = req.body;
    const champsAutorises = ['logo', 'banniere'];

    if (!champsAutorises.includes(field)) {
      return res.status(400).json({ success: false, message: 'Champ invalide' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/boutiques/${req.file.filename}`;

    // Mettre à jour uniquement le champ image
    const boutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      { $set: { [field]: url } },
      { new: true }
    );

    if (!boutique) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    res.json({ success: true, url, field });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  getAllBoutiques,
  getMesHoraires,
  updateHoraires,
  updateBoutique,
  uploadBoutique,
  uploadImageBoutique
};