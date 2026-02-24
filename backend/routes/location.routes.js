const express = require('express');
const router = express.Router();
const locationService = require('../services/location.service');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    res.json(await locationService.getAll());
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    res.json(await locationService.getById(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    res.status(201).json(await locationService.create(req.body));
  } catch (err) {
    const status = err.code === 11000 ? 400 : (err.status || 500);
    const message = err.code === 11000 ? 'Cette boutique a deja un contrat actif' : err.message;
    res.status(status).json({ message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    res.json(await locationService.update(req.params.id, req.body));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    res.json(await locationService.remove(req.params.id));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;