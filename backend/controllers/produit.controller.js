const Produit = require('../models/Produit');
const MouvementStock = require('../models/MouvementStock');



/* =========================================================
   =================== PARTIE PUBLIQUE =====================
========================================================= */

/**
 * Récupère la liste des produits avec filtres et pagination
 */
exports.getProduits = async (req, res) => {
  try {
    const {
      recherche,
      categorie,
      sous_categorie,
      boutique,
      statut,
      prix_min,
      prix_max,
      marque,
      condition,
      en_promotion,
      en_stock,
      tags,
      tri = 'nouveaute',
      page = 1,
      limite = 12,
      admin = 'false'
    } = req.query;

    const filtre = { supprime: { $ne: true } };

    if (admin === 'true') {
      if (statut) filtre.statut = statut;
    } else {
      filtre.statut = 'ACTIF';
    }

    if (recherche) {
      filtre.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { reference: { $regex: recherche, $options: 'i' } }
      ];
    }

    if (categorie) filtre.categorie = categorie;
    if (sous_categorie) filtre.sous_categorie = sous_categorie;
    if (boutique) filtre.boutique = boutique;

    if (marque) filtre.marque = { $in: marque.split(',') };

    if (prix_min || prix_max) {
      filtre.prix = {};
      if (prix_min) filtre.prix.$gte = Number(prix_min);
      if (prix_max) filtre.prix.$lte = Number(prix_max);
    }

    if (condition) filtre.condition = { $in: condition.split(',') };
    if (tags) filtre.tags = { $in: tags.split(',') };

    if (en_stock === 'true') filtre.quantite = { $gt: 0 };

    let sortOptions = { date_creation: -1 };
    if (tri === 'prix_asc') sortOptions = { prix: 1 };
    if (tri === 'prix_desc') sortOptions = { prix: -1 };
    if (tri === 'populaire') sortOptions = { ventes: -1 };
    if (tri === 'meilleures_notes') sortOptions = { note_moyenne: -1 };

    const skip = (Number(page) - 1) * Number(limite);

    const [produits, total] = await Promise.all([
      Produit.find(filtre)
        .populate('boutique', 'nom slug')
        .populate('categorie', 'nom')
        .populate('sous_categorie', 'nom')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limite)),
      Produit.countDocuments(filtre)
    ]);

    res.json({
      produits,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limite)),
      limite: Number(limite)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/**
 * Récupère un produit par ID ou slug
 */
exports.getProduit = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

    const query = isValidObjectId
      ? { _id: idOrSlug, statut: 'ACTIF', supprime: { $ne: true } }
      : { slug: idOrSlug, statut: 'ACTIF', supprime: { $ne: true } };

    const produit = await Produit.findOne(query)
      .populate('boutique', 'nom slug')
      .populate('categorie', 'nom')
      .populate('sous_categorie', 'nom');

    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });

    res.json(produit);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/**
 * Produits similaires
 */
exports.getProduitsSimilaires = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 4 } = req.query;

    const produit = await Produit.findById(id);
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });

    const similaires = await Produit.find({
      _id: { $ne: id },
      statut: 'ACTIF',
      supprime: { $ne: true },
      $or: [
        { categorie: produit.categorie },
        { sous_categorie: produit.sous_categorie },
        { tags: { $in: produit.tags || [] } }
      ]
    })
      .limit(Number(limite))
      .sort({ ventes: -1 });

    res.json(similaires);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* =========================================================
   =================== PARTIE BOUTIQUE =====================
========================================================= */

exports.getMesProduits = async (req, res) => {
  try {
    const produits = await Produit.find({
      boutique: req.user.boutiqueId,
      supprime: false
    }).sort({ date_creation: -1 });

    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.createProduit = async (req, res) => {
  try {
    const {
      nom,
      reference,
      prix,
      quantite,
      categorie
    } = req.body;

    if (!nom || !reference || !prix || quantite == null || !categorie) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const produit = new Produit({
      ...req.body,
      boutique: req.user.boutiqueId,
      statut: 'BROUILLON',
      supprime: false
    });

    await produit.save();

    res.status(201).json(produit);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.updateProduit = async (req, res) => {
  try {
    const produit = await Produit.findOne({
      _id: req.params.id,
      boutique: req.user.boutiqueId
    });

    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });

    Object.assign(produit, req.body);
    await produit.save();

    res.json(produit);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.addStock = async (req, res) => {
  try {
    const { quantite } = req.body;

    const produit = await Produit.findOne({
      _id: req.params.id,
      boutique: req.user.boutiqueId
    });

    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });

    produit.quantite += Number(quantite);
    await produit.save();

    await MouvementStock.create({
      produit: produit._id,
      type: 'ENTREE',
      quantite
    });

    res.json(produit);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.updateStatutProduit = async (req, res) => {
  try {
    const { statut } = req.body;

    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    );

    res.json(produit);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.softDeleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });

    produit.supprime = true;
    produit.statut = 'ARCHIVE';
    await produit.save();

    res.json({ message: 'Produit supprimé' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
