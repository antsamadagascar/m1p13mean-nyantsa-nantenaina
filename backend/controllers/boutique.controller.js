const Boutique = require('../models/Boutique');

// Obtenir toutes les boutiques (avec filtres)
const getBoutiques = async (req, res) => {
  try {
    const { statut, categorie, zone, search } = req.query;
    let filters = {};

    if (statut) {
      if (statut === 'actif') {
        filters['statut.actif'] = true;
        filters['statut.valide_par_admin'] = true;
      } else if (statut === 'en_attente') {
        filters['statut.en_attente_validation'] = true;
      } else if (statut === 'suspendu') {
        filters['statut.suspendu'] = true;
      }
    }

    if (categorie) filters.categorie = categorie;
    if (zone) filters['localisation.zone'] = zone;
    if (search) filters.nom = { $regex: search, $options: 'i' };

    const boutiques = await Boutique.find(filters)
      .populate('categorie')
      .populate('sous_categories')
      .sort({ 'date_creation': -1 });

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

      return { ...boutique.toObject(), estOuverte };
    });

    res.json(boutiquesAvecStatut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir UNE boutique par ID
const getBoutiqueById = async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate('categorie')
      .populate('sous_categories');

    if (!boutique) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    // Ajouter statut ouvert/fermé
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

    res.json({ ...boutique.toObject(), estOuverte });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Validation d' une boutique
const validerBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findByIdAndUpdate(
      req.params.id,
      {
        'statut.actif': true,
        'statut.valide_par_admin': true,
        'statut.en_attente_validation': false,
        'statut.date_validation': new Date()
      },
      { new: true }
    );

    if (!boutique) {
      return res.status(404).json({ message: 'Boutique non trouvée' });
    }

    res.json({ message: 'Boutique validée avec succès', boutique });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Suspendre une boutique
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

//  Réactiver une boutique suspendue
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

module.exports = {
  getBoutiques,
  getBoutiqueById,     
  validerBoutique,     
  suspendreBoutique,   
  reactiverBoutique    
};