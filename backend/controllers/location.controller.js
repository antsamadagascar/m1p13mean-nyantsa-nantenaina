const locationService = require('../services/location.service');

exports.getAll = async (req, res) => {
  try {
    res.json(await locationService.getAll());
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    res.json(await locationService.getById(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await locationService.create(req.body));
  } catch (err) {
    const status = err.code === 11000 ? 400 : (err.status || 500);
    const message = err.code === 11000 ? 'Cette boutique a déjà un contrat actif' : err.message;
    res.status(status).json({ message });
  }
};

exports.update = async (req, res) => {
  try {
    res.json(await locationService.update(req.params.id, req.body));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    res.json(await locationService.remove(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};