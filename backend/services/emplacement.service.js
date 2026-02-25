const Emplacement = require('../models/Emplacement');
const Location = require('../models/Location');

const emplacementService = {

  async getAll(query) {
    const { zone, actif } = query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (actif !== undefined) filter.actif = actif === 'true';
    
    const emplacements = await Emplacement.find(filter)
      // .populate('zone', 'nom')
      .sort({ numero_local: 1 });

    // Récupére les emplacements occupés via contrats actifs
    const occupes = await Location.find({ statut: 'actif' }).distinct('emplacement');
    const occupesStr = occupes.map(id => id.toString());

    // Ajoute le champ virtuel 'occupe'
    return emplacements.map(e => ({
      ...e.toObject(),
      occupe: occupesStr.includes(e._id.toString())
    }));
  },

  // async getDisponibles(zone) {
  //   // chearch les emplacements qui ont un contrat actif
  //   const occupes = await Location.find({ statut: 'actif' }).distinct('emplacement');
  //   const filter = { actif: true, _id: { $nin: occupes } };
  //   if (zone) filter.zone = zone;
  //   return await Emplacement.find(filter)
  //     // .populate('zone', 'nom')
  //     .sort({ numero_local: 1 });
  // },
  async getDisponibles() {
    // chercher les emplacements qui ont un contrat actif
    const occupes = await Location.find({ statut: 'actif' })
      .distinct('emplacement');
  
    const filter = {
      actif: true,
      _id: { $nin: occupes }
    };
  
    return await Emplacement.find(filter)
      .sort({ numero_local: 1 });
  },  

  async create(body) {
    const emplacement = new Emplacement(body);
    await emplacement.save();
    return emplacement;
  },

  async update(id, body) {
    const emplacement = await Emplacement.findById(id);
    if (!emplacement) throw { status: 404, message: 'Emplacement non trouvé' };
    Object.assign(emplacement, body);
    await emplacement.save();
    return emplacement;
  },

  async delete(id) {
    // Vérifie si un contrat actif utilise cet emplacement
    const contratActif = await Location.findOne({ emplacement: id, statut: 'actif' });
    if (contratActif) throw { status: 400, message: 'Impossible de supprimer, un contrat actif utilise cet emplacement' };
    await Emplacement.findByIdAndDelete(id);
  }
};

module.exports = emplacementService;