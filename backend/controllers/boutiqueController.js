const Boutique = require('../models/Boutique');
const slugify = require('slugify');
const { sendBoutiqueCreationEmail } = require('../services/emailService');
// @desc    Créer une nouvelle boutique
// @route   POST /api/boutiques
// @access  Private
exports.createBoutique = async (req, res) => {
  try {
    const { nom, description, gerant, localisation, contact, categorie, sous_categories } = req.body;

    // Générer le slug
    const slug = slugify(nom, { 
      lower: true, 
      strict: true,
      locale: 'fr'
    });

    // Construire l'emplacement complet
    const emplacement_complet = `${localisation.zone}, ${localisation.etage}, N°${localisation.numero}`;

    // Créer la boutique
    const boutique = await Boutique.create({
      nom,
      slug,
      description,
      gerant,
      localisation: {
        ...localisation,
        emplacement_complet
      },
      contact,
      categorie,
      sous_categories: sous_categories || []
    });

    // Peupler les références
    await boutique.populate('categorie sous_categories');
    // 🎯 ENVOYER L'EMAIL AU GÉRANT
    try {
        await sendBoutiqueCreationEmail(boutique);
        console.log('✅ Email envoyé au gérant');
        } catch (emailError) {
        // On log l'erreur mais on ne fait pas échouer la création
        console.error('⚠️ Erreur envoi email (boutique créée quand même):', emailError.message);
        }
    res.status(201).json({
      success: true,
      message: 'Boutique créée avec succès',
      data: boutique
    });

  } catch (error) {
    console.error('❌ Erreur création:', error);

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
exports.getBoutiqueById = async (req, res) => {
    try {
      const boutique = await Boutique
        .findById(req.params.id)
        .populate('categorie sous_categories gerant');
  
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
      console.error('❌ Erreur récupération boutique:', error);
  
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      });
    }
  };
  