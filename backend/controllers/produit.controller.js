const Produit = require('../models/Produit');
const MouvementStock = require('../models/MouvementStock');
const path = require('path');

exports.getMesProduits = async (req, res) => {
    try {
      if (req.user.role !== 'BOUTIQUE') {
        return res.status(403).json({ message: 'Accès réservé aux boutiques' });
      }
  
      if (!req.user.boutiqueId) {
        return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
      }
  
      const produits = await Produit.find({
        boutique: req.user.boutiqueId,
        supprime: false,
        statut: { $in: ['ACTIF', 'BROUILLON', 'RUPTURE'] } // Exclure ARCHIVE
      })
        .populate('categorie', 'nom')
        .populate('sous_categorie', 'nom')
        .sort({ date_creation: -1 });
  
      res.json(produits);
  
    } catch (error) {
      console.error('❌ Erreur getMesProduits:', error);
      res.status(500).json({ message: error.message });
    }
  };

exports.createProduit = async (req, res) => {
  try {
    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    if (!req.user.boutiqueId) {
      return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
    }

    const {
      nom,
      description,
      description_courte,
      reference,
      marque,
      prix,
      prix_promo,
      quantite,
      stock_minimum,
      categorie,
      sous_categorie,
      condition,
      tags,
      caracteristiques
    } = req.body;

    // ✅ Validation minimale
    if (!nom || !reference || !prix || quantite == null || !categorie) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants (nom, référence, prix, quantité, catégorie)'
      });
    }

    // 🔎 Vérifier référence unique
    const referenceExist = await Produit.findOne({ reference });
    if (referenceExist) {
      return res.status(400).json({
        message: 'Cette référence existe déjà'
      });
    }

    // 📷 Gérer l'image uploadée avec la nouvelle structure
    const images = [];
    if (req.file) {
      images.push({
        url: req.file.path, // ou req.file.filename selon config
        principale: true, // La première image est principale
        alt: nom,
        ordre: 0
      });
    }

    // 🏗 Création produit
    const produit = new Produit({
      nom,
      description,
      description_courte,
      reference,
      marque,
      prix,
      prix_promo,
      quantite,
      stock_minimum: stock_minimum || 0,
      categorie,
      sous_categorie: sous_categorie || null,
      statut: 'BROUILLON',
      condition: condition || 'NEUF',
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      caracteristiques: caracteristiques ? (Array.isArray(caracteristiques) ? caracteristiques : JSON.parse(caracteristiques)) : [],
      images,
      boutique: req.user.boutiqueId,
      gestion_stock: 'SIMPLE'
    });

    await produit.save();

    // 🔄 Création mouvement stock initial
    if (quantite > 0) {
      await MouvementStock.create({
        produit: produit._id,
        type: 'ENTREE',
        quantite: quantite,
        motif: 'Stock initial',
        boutique: req.user.boutiqueId
      });
    }

    const produitPopulate = await Produit.findById(produit._id)
      .populate('categorie', 'nom')
      .populate('sous_categorie', 'nom');

    res.status(201).json(produitPopulate);

  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduit = async (req, res) => {
    try {
      const produitId = req.params.id;
      
      console.log('🔄 Mise à jour produit:', produitId);
      console.log('📦 Body reçu:', req.body);
      console.log('📎 Fichier reçu:', req.file);
  
      // Vérifier rôle
      if (req.user.role !== 'BOUTIQUE') {
        return res.status(403).json({ message: 'Accès réservé aux boutiques' });
      }
  
      if (!req.user.boutiqueId) {
        return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
      }
  
      // Récupérer le produit
      const produit = await Produit.findOne({
        _id: produitId,
        boutique: req.user.boutiqueId
      });
  
      if (!produit) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
  
      const {
        nom,
        description,
        description_courte,
        reference,
        marque,
        prix,
        prix_promo,
        stock_minimum,
        categorie,
        sous_categorie,
        statut,
        condition,
        tags
      } = req.body;
  
      // Vérifier référence unique (si modifiée)
      if (reference && reference !== produit.reference) {
        const referenceExist = await Produit.findOne({ reference });
        if (referenceExist) {
          return res.status(400).json({ message: 'Cette référence existe déjà' });
        }
      }
  
      // Mise à jour des champs de base
      if (nom !== undefined) produit.nom = nom;
      if (description !== undefined) produit.description = description;
      if (description_courte !== undefined) produit.description_courte = description_courte;
      if (reference !== undefined) produit.reference = reference;
      if (marque !== undefined) produit.marque = marque;
      if (prix !== undefined) produit.prix = Number(prix);
      if (prix_promo !== undefined) {
        produit.prix_promo = prix_promo ? Number(prix_promo) : null;
      }
      if (stock_minimum !== undefined) produit.stock_minimum = Number(stock_minimum);
      if (categorie !== undefined) produit.categorie = categorie;
      if (sous_categorie !== undefined) {
        produit.sous_categorie = sous_categorie || null;
      }
      if (statut !== undefined) produit.statut = statut;
      if (condition !== undefined) produit.condition = condition;
  
      // Gérer les tags
      if (tags !== undefined) {
        try {
          produit.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          console.log('⚠️ Erreur parsing tags:', e);
          produit.tags = [];
        }
      }
  
      // Gérer la nouvelle image
      if (req.file) {
        const imagePath = `uploads/produits/${req.file.filename}`;
        console.log('🖼️ Nouvelle image:', imagePath);
        
        const newImage = {
          url: imagePath,
          principale: produit.images.length === 0, // Principale si c'est la première
          alt: nom || produit.nom,
          ordre: produit.images.length
        };
        
        produit.images.push(newImage);
      }
  
      await produit.save();
      console.log('✅ Produit mis à jour avec succès');
  
      const produitPopulate = await Produit.findById(produit._id)
        .populate('categorie', 'nom')
        .populate('sous_categorie', 'nom');
  
      res.json(produitPopulate);
  
    } catch (error) {
      console.error('❌ Erreur mise à jour produit:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

exports.addStock = async (req, res) => {
  try {
    const produitId = req.params.id;
    const { quantite } = req.body;

    // Vérifier rôle
    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    if (!req.user.boutiqueId) {
      return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
    }

    if (!quantite || quantite <= 0) {
      return res.status(400).json({ message: 'Quantité invalide' });
    }

    // Récupérer le produit
    const produit = await Produit.findOne({
      _id: produitId,
      boutique: req.user.boutiqueId
    });

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Mettre à jour la quantité
    produit.quantite += quantite;
    await produit.save();

    // Créer mouvement de stock
    await MouvementStock.create({
      produit: produit._id,
      type: 'ENTREE',
      quantite,
      motif: 'Ajout stock manuel',
      boutique: req.user.boutiqueId
    });

    const produitPopulate = await Produit.findById(produit._id)
      .populate('categorie', 'nom')
      .populate('sous_categorie', 'nom');

    res.json(produitPopulate);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🆕 Supprimer une image spécifique
exports.deleteImage = async (req, res) => {
  try {
    const { produitId, imageId } = req.params;

    if (req.user.role !== 'BOUTIQUE') {
      return res.status(403).json({ message: 'Accès réservé aux boutiques' });
    }

    const produit = await Produit.findOne({
      _id: produitId,
      boutique: req.user.boutiqueId
    });

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Retirer l'image
    produit.images = produit.images.filter(img => img._id.toString() !== imageId);
    
    // Si l'image supprimée était principale, mettre la première comme principale
    if (produit.images.length > 0 && !produit.images.some(img => img.principale)) {
      produit.images[0].principale = true;
    }

    await produit.save();

    res.json({ message: 'Image supprimée avec succès', produit });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.softDeleteProduit = async (req, res) => {
    try {
      const produitId = req.params.id;
      const { motif } = req.body; // Motif optionnel de suppression
  
      console.log('🗑️ Suppression logique du produit:', produitId);
  
      // Vérifier rôle
      if (req.user.role !== 'BOUTIQUE') {
        return res.status(403).json({ message: 'Accès réservé aux boutiques' });
      }
  
      if (!req.user.boutiqueId) {
        return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
      }
  
      // Récupérer le produit
      const produit = await Produit.findOne({
        _id: produitId,
        boutique: req.user.boutiqueId,
        supprime: false // Seulement les produits non supprimés
      });
  
      if (!produit) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }
  
      // Marquer comme supprimé
      produit.supprime = true;
      produit.date_suppression = new Date();
      produit.supprime_par = req.user._id;
      produit.statut = 'ARCHIVE'; // Changer le statut aussi
  
      await produit.save();
  
      console.log('✅ Produit marqué comme supprimé');
  
      res.json({ 
        message: 'Produit supprimé avec succès',
        produit 
      });
  
    } catch (error) {
      console.error('❌ Erreur suppression produit:', error);
      res.status(500).json({ message: error.message });
    }
  };