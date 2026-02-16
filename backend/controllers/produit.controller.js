const Produit = require('../models/Produit');
const MouvementStock = require('../models/MouvementStock');

exports.getMesProduits = async (req, res) => {
    try {
  
      // Vérifier rôle
      if (req.user.role !== 'BOUTIQUE') {
        return res.status(403).json({ message: 'Accès réservé aux boutiques' });
      }
  
      if (!req.user.boutiqueId) {
        return res.status(400).json({ message: 'Boutique non liée à cet utilisateur' });
      }
  
      const produits = await Produit.find({
        boutique: req.user.boutiqueId
      })
        .populate('categorie', 'nom')
        .populate('sous_categorie', 'nom')
        .sort({ createdAt: -1 });
  
      res.json(produits);
  
    } catch (error) {
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
        reference,
        prix,
        prix_promo,
        quantite,
        categorie,
        sous_categorie,
        actif
      } = req.body;
  
      // Validation
      if (!nom || !reference || !prix || quantite == null || !categorie) {
        return res.status(400).json({
          message: 'Champs obligatoires manquants'
        });
      }
  
      // Vérifier référence unique
      const referenceExist = await Produit.findOne({ reference });
      if (referenceExist) {
        return res.status(400).json({
          message: 'Cette référence existe déjà'
        });
      }
  
      // Récupérer le chemin de l'image uploadée
      const images = [];
      if (req.file) {
        images.push(req.file.path); // ou req.file.filename selon votre besoin
      }
  
      // Création produit
      const produit = new Produit({
        nom,
        description,
        reference,
        prix,
        prix_promo,
        quantite,
        categorie,
        sous_categorie,
        actif: actif !== undefined ? actif : true,
        images, // Tableau d'images
        boutique: req.user.boutiqueId
      });
  
      await produit.save();
  
      // Création mouvement stock initial
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
      res.status(500).json({ message: error.message });
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
  
      // Mettre à jour la quantité du produit
      produit.quantite += quantite;
      await produit.save();
  
      // Créer un mouvement de stock
      await MouvementStock.create({
        produit: produit._id,
        type: 'ENTREE',
        quantite,
        motif: 'Ajout stock',
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
  

  exports.updateProduit = async (req, res) => {
    try {
      const produitId = req.params.id;
      const {
        nom,
        description,
        reference,
        prix,
        prix_promo,
        quantite,
        categorie,
        sous_categorie,
        actif,
        images
      } = req.body;
  
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
  
      // Vérifier si la référence est unique (si elle est modifiée)
      if (reference && reference !== produit.reference) {
        const referenceExist = await Produit.findOne({ reference });
        if (referenceExist) {
          return res.status(400).json({ message: 'Cette référence existe déjà' });
        }
      }
  
      // Mise à jour des champs
      produit.nom = nom !== undefined ? nom : produit.nom;
      produit.description = description !== undefined ? description : produit.description;
      produit.reference = reference !== undefined ? reference : produit.reference;
      produit.prix = prix !== undefined ? prix : produit.prix;
      produit.prix_promo = prix_promo !== undefined ? prix_promo : produit.prix_promo;
      produit.quantite = quantite !== undefined ? quantite : produit.quantite;
      produit.categorie = categorie !== undefined ? categorie : produit.categorie;
      produit.sous_categorie = sous_categorie !== undefined ? sous_categorie : produit.sous_categorie;
      produit.actif = actif !== undefined ? actif : produit.actif;
      produit.images = images !== undefined ? images : produit.images;
  
      await produit.save();
  
      const produitPopulate = await Produit.findById(produit._id)
        .populate('categorie', 'nom')
        .populate('sous_categorie', 'nom');
  
      res.json(produitPopulate);
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  