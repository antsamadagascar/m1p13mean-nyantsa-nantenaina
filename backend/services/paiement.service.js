const Paiement = require('../models/Paiement');
const Location = require('../models/Location');

const paiementService = {

  async getAll(query, user) {
    const { statut, annee, mois, boutique } = query;
    const filter = {};
    if (statut) filter.statut = statut;
    if (annee) filter.annee = parseInt(annee);
    if (mois) filter.mois = parseInt(mois);
    if (boutique) filter.boutique = boutique;

    // Restreindre si rôle BOUTIQUE
    if (user?.role === 'BOUTIQUE') {
      filter.boutique = user.boutiqueId;
    }

    const paiements = await Paiement.find(filter)
      .populate('boutique', 'nom')
      .populate('location', 'numero_local zone')
      .sort({ annee: -1, mois: -1 });

    const stats = {
      total_du:    paiements.reduce((s, p) => s + p.montant_du, 0),
      total_percu: paiements.reduce((s, p) => s + p.montant_paye, 0),
      nb_payes:    paiements.filter(p => p.statut === 'paye').length,
      nb_impayes:  paiements.filter(p => p.statut === 'impaye').length,
      nb_retard:   paiements.filter(p => p.statut === 'en_retard').length,
      nb_partiel:  paiements.filter(p => p.statut === 'partiel').length,
    };

    return { paiements, stats };
  },

  async create(body) {
    const { location_id, mois, annee, montant_paye, date_paiement, note } = body;

    const location = await Location.findById(location_id).populate('boutique');
    if (!location) throw { status: 404, message: 'Location non trouvée' };

    const paiement = new Paiement({
      location: location_id,
      boutique: location.boutique._id,
      mois,
      annee,
      montant_du: location.loyer_mensuel,
      montant_paye: montant_paye || 0,
      date_paiement: date_paiement || null,
      date_echeance: new Date(annee, mois - 1, 1),
      note
    });

    await paiement.save();
    return paiement;
  },

  async update(id, body) {
    const paiement = await Paiement.findById(id);
    if (!paiement) throw { status: 404, message: 'Paiement non trouvé' };
    Object.assign(paiement, body);
    await paiement.save(); // déclenche le pre('save') -> recalcul statut
    return paiement;
  },

  async genererMois(mois, annee) {
    const locations = await Location.find({ statut: 'actif' });
    const created = [];

    for (const loc of locations) {
      const existe = await Paiement.findOne({ location: loc._id, mois, annee });
      if (!existe) {
        const p = new Paiement({
          location: loc._id,
          boutique: loc.boutique,
          mois,
          annee,
          montant_du: loc.loyer_mensuel,
          montant_paye: 0,
          date_echeance: new Date(annee, mois, 5) //          // mois suivant, jour 5
        });
        await p.save();
        created.push(p);
      }
    }

    return { message: `${created.length} paiement(s) générés`, created };
  },
  
  async genererAnnee(annee) {
    const locations = await Location.find({ statut: 'actif' });
    let totalCreated = 0;

    for (const loc of locations) {
      for (let mois = 1; mois <= 12; mois++) {
        const existe = await Paiement.findOne({ location: loc._id, mois, annee });
        if (!existe) {
          const p = new Paiement({
            location: loc._id,
            boutique: loc.boutique,
            mois,
            annee,
            montant_du: loc.loyer_mensuel,
            montant_paye: 0,
            date_echeance: new Date(annee, mois, 5)
          });
          await p.save();
          totalCreated++;
        }
      }
    }

    return { message: `${totalCreated} paiement(s) generes pour ${annee}` };
  }
};

module.exports = paiementService;