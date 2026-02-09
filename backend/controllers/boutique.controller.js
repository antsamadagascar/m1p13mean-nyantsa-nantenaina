const mongoose = require('mongoose');
const Boutique = require('../models/Boutique');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');

// Obtenir toutes les boutiques (avec filtres et status)
const getBoutiques = async (req, res) => {
  try {
    const { 
      statut,      // "actif", "en_attente", "suspendu"
      categorie,   // ID de catégorie
      zone,        // "Zone A", "Zone B", etc.
      search       // Recherche par nom
    } = req.query;

    // COnstrution  des filtres
    let filters = {};

    if (statut) {
      if (statut === 'actif') 
      { filters['statut.actif'] = true;   filters['statut.valide_par_admin'] = true;  } 
      
      else if (statut === 'en_attente') 
     { filters['statut.en_attente_validation'] = true;  }
       else if (statut === 'suspendu')
      {   filters['statut.suspendu'] = true; }
    }

    if (categorie) {
      filters.categorie = categorie;
    }

    if (zone) {
      filters['localisation.zone'] = zone;
    }

    if (search) {
      filters.nom = { $regex: search, $options: 'i' };
    }

    const boutiques = await Boutique.find(filters)
      .populate('categorie')
      .populate('sous_categories')
      .sort({ 'date_creation': -1 });

    // Ajoute le statut ouvert/fermé
    const boutiquesAvecStatut = boutiques.map(boutique => {
      const maintenant = new Date();
      const jour = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][maintenant.getDay()];
      const horaireJour = boutique.horaires[jour];
      
      let estOuverte = false;
      if (horaireJour.ouvert) {
        const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
        const [hD, mD] = horaireJour.debut.split(':').map(Number);
        const [hF, mF] = horaireJour.fin.split(':').map(Number);
        const debut = hD * 60 + mD;
        const fin = hF * 60 + mF;
        estOuverte = heureActuelle >= debut && heureActuelle <= fin;
      }

      return {
        ...boutique.toObject(),
        estOuverte
      };
    });

    res.json(boutiquesAvecStatut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBoutiques
};