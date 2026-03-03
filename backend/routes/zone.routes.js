const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zone.controller');

/**
 * @route   POST /api/zones
 * @desc    Créer une nouvelle zone
 * @access  Private/Admin
 */
router.post('/', 
  zoneController.createZone
);

/**
 * @route   GET /api/zones
 * @desc    Obtenir toutes les zones (avec filtre actif optionnel)
 * @access  Public
 */
router.get('/', zoneController.getAllZones);

/**
 * @route   GET /api/zones/:id
 * @desc    Obtenir une zone par ID
 * @access  Public
 */
router.get('/:id', zoneController.getZoneById);

/**
 * @route   PUT /api/zones/:id
 * @desc    Mettre à jour une zone
 * @access  Private/Admin
 */
router.put('/:id', 
  zoneController.updateZone
);

/**
 * @route   DELETE /api/zones/:id
 * @desc    Supprimer une zone
 * @access  Private/Admin
 */
router.delete('/:id', 
  zoneController.deleteZone
);

/**
 * @route   PATCH /api/zones/:id/toggle-actif
 * @desc    Activer/Désactiver une zone
 * @access  Private/Admin
 */
router.patch('/:id/toggle-actif', 
  zoneController.toggleZoneActif
);

module.exports = router;