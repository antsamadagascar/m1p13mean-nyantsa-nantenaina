const Location = require('../models/Location');

const locationService = {

  async getAll() {
    const locations = await Location.find()
      .populate('boutique', 'nom logo statut')
      .populate('zone', 'nom')
      .sort({ date_creation: -1 });

    // Auto-update statut si date_fin dépassée
    const now = new Date();
    for (const loc of locations) {
      if (loc.date_fin && new Date(loc.date_fin) < now && loc.statut === 'actif') {
        loc.statut = 'expire';
        await loc.save();
      }
    }

    const ca_total = locations
      .filter(l => l.statut === 'actif')
      .reduce((sum, l) => sum + (l.loyer_mensuel || 0), 0);

    return { locations, ca_total, total: locations.length };
  },

  async getById(id) {
    const location = await Location.findById(id)
      .populate('boutique', 'nom logo statut')
      .populate('zone', 'nom');
    if (!location) throw { status: 404, message: 'Contrat non trouvé' };
    return location;
  },

  async create(data) {
    const location = await Location.create(data);
    return location.populate(['boutique', 'zone']);
  },

  async update(id, data) {
    const location = await Location.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('boutique', 'nom')
      .populate('zone', 'nom');
    if (!location) throw { status: 404, message: 'Contrat non trouvé' };
    return location;
  },

  async remove(id) {
    const location = await Location.findByIdAndDelete(id);
    if (!location) throw { status: 404, message: 'Contrat non trouvé' };
    return { message: 'Contrat supprimé avec succès' };
  }
};

module.exports = locationService;