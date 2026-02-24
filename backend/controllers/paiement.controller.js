const paiementService = require('../services/paiement.service');

exports.getAll = async (req, res) => {
  try {
    res.json(await paiementService.getAll(req.query, req.user));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await paiementService.create(req.body));
  } catch (err) {
    const status = err.code === 11000 ? 400 : (err.status || 500);
    const message = err.code === 11000 ? 'Paiement déjà enregistré pour ce mois' : err.message;
    res.status(status).json({ message });
  }
};

exports.update = async (req, res) => {
  try {
    res.json(await paiementService.update(req.params.id, req.body));
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

exports.annuler = async (req, res) => {
  try {
    const paiement = await paiementService.annuler(req.params.id);
    res.json({ message: 'Paiement annulé avec succès', paiement });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.genererMois = async (req, res) => {
  try {
    res.json(await paiementService.genererMois(req.body.mois, req.body.annee, req.body.locations));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.genererAnnee = async (req, res) => {
  try {
    res.json(await paiementService.genererAnnee(req.body.annee, req.body.locations));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};