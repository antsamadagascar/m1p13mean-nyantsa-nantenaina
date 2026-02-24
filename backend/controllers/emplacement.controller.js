const emplacementService = require('../services/emplacement.service');

exports.getAll = async (req, res) => {
  try {
    const emplacements = await emplacementService.getAll(req.query);
    res.json({ emplacements });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getDisponibles = async (req, res) => {
  try {
    const emplacements = await emplacementService.getDisponibles(req.query.zone);
    res.json({ emplacements });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const emplacement = await emplacementService.create(req.body);
    res.status(201).json({ message: 'Emplacement créé avec succès', emplacement });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const emplacement = await emplacementService.update(req.params.id, req.body);
    res.json({ message: 'Emplacement mis à jour', emplacement });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await emplacementService.delete(req.params.id);
    res.json({ message: 'Emplacement supprimé avec succès' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};