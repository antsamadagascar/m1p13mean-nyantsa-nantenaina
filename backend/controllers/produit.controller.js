const Produit = require('../models/Produit');

const MouvementStock = require('../models/MouvementStock'); 
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
      admin = 'false'  //  if admin
    } = req.query;

    // Construction du filtre
    const filtre = {};

    // Si admin=true, on affiche tous les statuts (sauf si statut spécifique demandé)
    // Sinon, uniquement ACTIF
    if (admin === 'true') {
      if (statut) {
        filtre.statut = statut;
      }
      // Si admin et pas de filtre statut, on affiche tout
    } else {
      // Public : uniquement ACTIF
      filtre.statut = 'ACTIF';
    }

    // Recherche textuelle
    if (recherche) {
      filtre.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { reference: { $regex: recherche, $options: 'i' } },
        { tags: { $in: [new RegExp(recherche, 'i')] } }
      ];
    }

    if (categorie) filtre.categorie = categorie;
    if (sous_categorie) filtre.sous_categorie = sous_categorie;
    if (boutique) filtre.boutique = boutique;

    if (marque) {
      const marques = marque.split(',');
      filtre.marque = { $in: marques };
    }

    if (prix_min || prix_max) {
      filtre.prix = {};
      if (prix_min) filtre.prix.$gte = parseFloat(prix_min);
      if (prix_max) filtre.prix.$lte = parseFloat(prix_max);
    }

    if (condition) {
      const conditions = condition.split(',');
      filtre.condition = { $in: conditions };
    }

    if (en_promotion === 'true') {
      filtre.prix_promo = { $exists: true, $ne: null };
      filtre.$expr = {
        $and: [
          { $ne: ['$prix_promo', null] },
          { $lt: ['$prix_promo', '$prix'] }
        ]
      };
    }

    if (tags) {
      const tagsList = tags.split(',');
      filtre.tags = { $in: tagsList };
    }

    // Options de tri
    let sortOptions = {};
    switch (tri) {
      case 'prix_asc':
        sortOptions = { prix: 1 };
        break;
      case 'prix_desc':
        sortOptions = { prix: -1 };
        break;
      case 'populaire':
        sortOptions = { ventes: -1, vues: -1 };
        break;
      case 'meilleures_notes':
        sortOptions = { note_moyenne: -1, nombre_avis: -1 };
        break;
      case 'nouveaute':
      default:
        sortOptions = { date_creation: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limite);

    let query = Produit.find(filtre)
      .populate('boutique', 'nom slug')
      .populate('categorie', 'nom')
      .populate('sous_categorie', 'nom')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limite));

    if (en_stock === 'true') {
      query = query.where('quantite').gt(0);
    }

    const [produits, total] = await Promise.all([
      query.exec(),
      Produit.countDocuments(filtre)
    ]);

    const pages = Math.ceil(total / parseInt(limite));

    res.json({
      produits,
      total,
      page: parseInt(page),
      pages,
      limite: parseInt(limite)
    });

  } catch (error) {
    console.error('Erreur getProduits:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits',
      error: error.message
    });
  }
};

/**
 * Récupère les filtres disponibles
 */
exports.getFiltresDisponibles = async (req, res) => {
  try {
    const { categorie, sous_categorie } = req.query;

    const filtre = { statut: 'ACTIF' };
    
    if (categorie) filtre.categorie = categorie;
    if (sous_categorie) filtre.sous_categorie = sous_categorie;

    const [categoriesAgg, sousCategories, marques, prixRange, boutiques] = await Promise.all([
      Produit.aggregate([
        { $match: filtre },
        { $group: { _id: '$categorie', count: { $sum: 1 } }},
        { $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categorie'
        }},
        { $unwind: '$categorie' },
        { $project: {
          _id: '$categorie._id',
          nom: '$categorie.nom',
          count: 1
        }},
        { $sort: { nom: 1 } }
      ]),

      Produit.aggregate([
        { $match: { ...filtre, sous_categorie: { $exists: true } } },
        { $group: { _id: '$sous_categorie', count: { $sum: 1 } }},
        { $lookup: {
          from: 'souscategories',
          localField: '_id',
          foreignField: '_id',
          as: 'sous_categorie'
        }},
        { $unwind: '$sous_categorie' },
        { $project: {
          _id: '$sous_categorie._id',
          nom: '$sous_categorie.nom',
          count: 1
        }},
        { $sort: { nom: 1 } }
      ]),

      Produit.aggregate([
        { $match: { ...filtre, marque: { $exists: true, $ne: null } } },
        { $group: { _id: '$marque', count: { $sum: 1 } }},
        { $project: { _id: 0, nom: '$_id', count: 1 }},
        { $sort: { nom: 1 } }
      ]),

      Produit.aggregate([
        { $match: filtre },
        { $group: {
          _id: null,
          prix_min: { $min: '$prix' },
          prix_max: { $max: '$prix' }
        }}
      ]),

      Produit.aggregate([
        { $match: filtre },
        { $group: { _id: '$boutique', count: { $sum: 1 } }},
        { $lookup: {
          from: 'boutiques',
          localField: '_id',
          foreignField: '_id',
          as: 'boutique'
        }},
        { $unwind: '$boutique' },
        { $project: {
          _id: '$boutique._id',
          nom: '$boutique.nom',
          count: 1
        }},
        { $sort: { nom: 1 } }
      ])
    ]);

    res.json({
      categories: categoriesAgg,
      sous_categories: sousCategories,
      marques: marques.filter(m => m.nom), 
      prix_min: prixRange[0]?.prix_min || 0,
      prix_max: prixRange[0]?.prix_max || 0,
      boutiques: boutiques
    });

  } catch (error) {
    console.error('Erreur getFiltresDisponibles:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des filtres',
      error: error.message
    });
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
      ? { _id: idOrSlug, statut: 'ACTIF' }
      : { slug: idOrSlug, statut: 'ACTIF' };

    const produit = await Produit.findOne(query)
      .populate('boutique', 'nom slug logo contact horaires')
      .populate('categorie', 'nom slug')
      .populate('sous_categorie', 'nom slug');

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json(produit);

  } catch (error) {
    console.error('Erreur getProduit:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du produit',
      error: error.message
    });
  }
};

/**
 * Récupère les produits similaires
 */
exports.getProduitsSimilaires = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 4 } = req.query;

    const produit = await Produit.findById(id);

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    const produitsSimilaires = await Produit.find({
      _id: { $ne: id },
      $or: [
        { categorie: produit.categorie },
        { sous_categorie: produit.sous_categorie },
        { tags: { $in: produit.tags || [] } }
      ],
      statut: 'ACTIF'
    })
      .populate('boutique', 'nom slug')
      .populate('categorie', 'nom')
      .limit(parseInt(limite))
      .sort({ ventes: -1, note_moyenne: -1 });

    res.json(produitsSimilaires);

  } catch (error) {
    console.error('Erreur getProduitsSimilaires:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des produits similaires',
      error: error.message
    });
  }
};

/**
 * Met à jour le statut d'un produit
 */
exports.updateStatutProduit = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const statutsValides = ['BROUILLON', 'ACTIF', 'RUPTURE', 'ARCHIVE'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const updateData = { statut };
    if (statut === 'RUPTURE') updateData.quantite = 0;

    const produit = await Produit.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('boutique', 'nom slug')
    .populate('categorie', 'nom')
    .populate('sous_categorie', 'nom');

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({
      message: 'Statut mis à jour avec succès',
      produit
    });

  } catch (error) {
    console.error('Erreur updateStatutProduit:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// nante 
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
      console.error(' Erreur getMesProduits:', error);
      res.status(500).json({ message: error.message });
    }
  };

  exports.createProduit = async (req, res) => {
    try {
      // 🔐 Vérification rôle
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
        gestion_stock,
        tags,
        caracteristiques,
        variantes
      } = req.body;
  
      console.log('📦 Body reçu:', req.body);
      console.log('📎 Fichier reçu:', req.file);
  
      //  Validation minimale
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
  
      // ─── Parser les champs JSON ───────────────────────────────
  
      // Tags
      let tagsParsed = [];
      if (tags) {
        try {
          tagsParsed = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          console.error(' Erreur parsing tags:', e);
          tagsParsed = [];
        }
      }
  
      // Caractéristiques
      let caracsParsed = [];
      if (caracteristiques) {
        try {
          caracsParsed = typeof caracteristiques === 'string'
            ? JSON.parse(caracteristiques)
            : caracteristiques;
  
          // Filtrer les caractéristiques invalides
          caracsParsed = caracsParsed
            .filter(c => c.nom?.trim() && c.valeur?.trim())
            .map((c, index) => ({
              nom:    c.nom.trim(),
              valeur: c.valeur.trim(),
              unite:  c.unite?.trim() || '',
              ordre:  index
            }));
  
        } catch (e) {
          console.error(' Erreur parsing caractéristiques:', e);
          caracsParsed = [];
        }
      }
  
      // Variantes
      let variantesParsed = [];
      const modeGestionStock = gestion_stock || 'SIMPLE';
  
      if (modeGestionStock === 'VARIANTES' && variantes) {
        try {
          variantesParsed = typeof variantes === 'string'
            ? JSON.parse(variantes)
            : variantes;
  
          // Nettoyer et valider chaque variante
          variantesParsed = variantesParsed.map(v => ({
            nom:             v.nom?.trim()           || '',
            sku:             v.sku?.trim()            || '',
            prix_supplement: Number(v.prix_supplement) || 0,
            quantite:        Number(v.quantite)        || 0,
            image:           v.image                   || '',
            attributs: (v.attributs || [])
              .filter(a => a.nom?.trim() && a.valeur?.trim())
              .map(a => ({
                nom:    a.nom.trim(),
                valeur: a.valeur.trim()
              }))
          }));
  
          // Validation : chaque variante doit avoir un stock >= 0
          const variantesInvalides = variantesParsed.filter(
            v => v.quantite === null || v.quantite === undefined || v.quantite < 0
          );
          if (variantesInvalides.length > 0) {
            return res.status(400).json({
              message: 'Le stock de chaque variante doit être >= 0'
            });
          }
  
        } catch (e) {
          console.error(' Erreur parsing variantes:', e);
          return res.status(400).json({ message: 'Format des variantes invalide' });
        }
      }
  
      // 📷 Gérer l'image uploadée
      const images = [];
      if (req.file) {
        // Normaliser le chemin (remplacer les backslashes Windows)
         const baseUrl = `${req.protocol}://${req.get('host')}`;
          const imagePath = `${baseUrl}/uploads/produits/${req.file.filename}`;
          
        images.push({
          url:       imagePath,
          principale: true,
          alt:        nom,
          ordre:      0
        });
        console.log(' Image sauvegardée:', imagePath);
      }
  
      // ─── Calcul de la quantité totale ────────────────────────
      // En mode VARIANTES, la quantité totale = somme des variantes
      let quantiteTotale = Number(quantite) || 0;
      if (modeGestionStock === 'VARIANTES' && variantesParsed.length > 0) {
        quantiteTotale = variantesParsed.reduce((sum, v) => sum + v.quantite, 0);
      }
  
      // 🏗 Création produit
      const produit = new Produit({
        nom,
        description:       description        || '',
        description_courte: description_courte || '',
        reference,
        marque:            marque             || '',
        prix:              Number(prix),
        prix_promo:        prix_promo ? Number(prix_promo) : null,
        quantite:          quantiteTotale,
        stock_minimum:     Number(stock_minimum) || 0,
        categorie,
        sous_categorie:    sous_categorie || null,
        statut:            'BROUILLON',
        condition:         condition || 'NEUF',
        gestion_stock:     modeGestionStock,
        tags:              tagsParsed,
        caracteristiques:  caracsParsed,
        variantes:         modeGestionStock === 'VARIANTES' ? variantesParsed : [],
        images,
        boutique:          req.user.boutiqueId
      });
  
      await produit.save();
      console.log(' Produit créé:', produit._id);
  
      // Création mouvement stock initial
      if (quantiteTotale > 0) {
        await MouvementStock.create({
          produit:  produit._id,
          type:     'ENTREE',
          quantite: quantiteTotale,
          motif:    modeGestionStock === 'VARIANTES'
                      ? 'Stock initial (variantes)'
                      : 'Stock initial',
          boutique: req.user.boutiqueId
        });
      }
  
      //  Retourner le produit populé
      const produitPopulate = await Produit.findById(produit._id)
        .populate('categorie',     'nom')
        .populate('sous_categorie', 'nom');
  
      res.status(201).json(produitPopulate);
  
    } catch (error) {
      console.error(' Erreur création produit:', error);
      res.status(500).json({ message: error.message });
    }
  };

exports.updateProduit = async (req, res) => {
    try {
      const produitId = req.params.id;
      console.log(' Mise à jour produit:', produitId);
      console.log(' Body reçu:', req.body);
      console.log(' Fichier reçu:', req.file);

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
        tags,
        caracteristiques,    
        variantes,           
        gestion_stock        
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
          produit.tags = [];
        }
      }

      //  Géstions  caractéristiques
      if (caracteristiques !== undefined) {
        try {
          let caracsParsed = typeof caracteristiques === 'string' 
            ? JSON.parse(caracteristiques) 
            : caracteristiques;
          
          // Filtrer et nettoyer
          caracsParsed = (caracsParsed || [])
            .filter(c => c.nom?.trim() && c.valeur?.trim())
            .map((c, index) => ({
              nom:    c.nom.trim(),
              valeur: c.valeur.trim(),
              unite:  c.unite?.trim() || '',
              ordre:  index
            }));

          //  Remplacer complètement (pas de push)
          produit.caracteristiques = caracsParsed;
          console.log(' Caractéristiques mises à jour:', caracsParsed.length, 'éléments');
        } catch (e) {
          console.error(' Erreur parsing caracteristiques:', e);
        }
      }

      //  Gérer les variantes (remplacer même si vide)
            if (variantes !== undefined) {
              try {
                let variantesParsed = typeof variantes === 'string' 
                  ? JSON.parse(variantes) 
                  : variantes;

                // Nettoyer et valider
                variantesParsed = (variantesParsed || []).map(v => ({
                  nom:             v.nom?.trim()           || '',
                  sku:             v.sku?.trim()           || '',
                  prix_supplement: Number(v.prix_supplement) || 0,
                  quantite:        Number(v.quantite)        || 0,
                  image:           v.image                   || '',
                  attributs: (v.attributs || [])
                    .filter(a => a.nom?.trim() && a.valeur?.trim())
                    .map(a => ({
                      nom:    a.nom.trim(),
                      valeur: a.valeur.trim()
                    }))
                }));

                // Remplace complètement
                produit.variantes = variantesParsed;

                //  Recalcule quantité totale si mode VARIANTES
                if (produit.gestion_stock === 'VARIANTES' && variantesParsed.length > 0) {
                  const quantiteTotale = variantesParsed.reduce((sum, v) => sum + v.quantite, 0);
                  produit.quantite = quantiteTotale;

                }
              } catch (e) {
              
              }
            }

            //  Gérer gestion_stock
            if (gestion_stock !== undefined) {
              produit.gestion_stock = gestion_stock;
              console.log(' Mode gestion stock:', gestion_stock);
            }

            //  Gérer les variantes
            if (variantes !== undefined) {
              try {
                let variantesParsed = typeof variantes === 'string' 
                  ? JSON.parse(variantes) 
                  : variantes;

                // Nettoyer et valider
                variantesParsed = variantesParsed.map(v => ({
                  nom:             v.nom?.trim()           || '',
                  sku:             v.sku?.trim()           || '',
                  prix_supplement: Number(v.prix_supplement) || 0,
                  quantite:        Number(v.quantite)        || 0,
                  image:           v.image                   || '',
                  attributs: (v.attributs || [])
                    .filter(a => a.nom?.trim() && a.valeur?.trim())
                    .map(a => ({
                      nom:    a.nom.trim(),
                      valeur: a.valeur.trim()
                    }))
                }));

                produit.variantes = variantesParsed;
                console.log(' Variantes mises à jour:', variantesParsed);

                //  Recalculer quantité totale si mode VARIANTES
                if (produit.gestion_stock === 'VARIANTES' && variantesParsed.length > 0) {
                  const quantiteTotale = variantesParsed.reduce((sum, v) => sum + v.quantite, 0);
                  produit.quantite = quantiteTotale;
                  console.log(' Quantité totale recalculée:', quantiteTotale);
                }
              } catch (e) {
                console.error(' Erreur parsing variantes:', e);
                // Ne pas modifier si erreur
              }
            }

      // Gérer la nouvelle image
      if (req.file) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imagePath = `${baseUrl}/uploads/produits/${req.file.filename}`;
        console.log(' Nouvelle image:', imagePath);

        const newImage = {
          url: imagePath,
          principale: produit.images.length === 0,
          alt: nom || produit.nom,
          ordre: produit.images.length
        };

        produit.images.push(newImage);
      }

      await produit.save();
      console.log(' Produit mis à jour avec succès');

      const produitPopulate = await Produit.findById(produit._id)
        .populate('categorie', 'nom')
        .populate('sous_categorie', 'nom');

      res.json(produitPopulate);

    } catch (error) {
      console.error(' Erreur mise à jour produit:', error);
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

//  Supprimer une image spécifique
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
      const { motif } = req.body;
  
      console.log(' Suppression logique du produit:', produitId);
  
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
  
  
      res.json({ 
        message: 'Produit supprimé avec succès',
        produit 
      });
  
    } catch (error) {

      res.status(500).json({ message: error.message });
    }
  };

module.exports = exports;