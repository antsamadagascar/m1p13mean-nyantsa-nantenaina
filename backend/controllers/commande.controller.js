const Commande = require('../models/Commande');
const Panier = require('../models/Panier');
const Produit = require('../models/Produit');

const PDFDocument = require('pdfkit');
const path = require('path');
// ============================================
// CRÉER COMMANDE
// ============================================
exports.creerCommande = async (req, res) => {
  try {
    const userId = req.user._id;
    const { adresse_livraison } = req.body;

    if (!adresse_livraison?.adresse || !adresse_livraison?.telephone) {
      return res.status(400).json({ message: 'Adresse de livraison incomplète' });
    }

    const panier = await Panier.findOne({ utilisateur: userId, statut: 'ACTIF' }).populate('articles.produit');
    if (!panier || panier.articles.length === 0) {
      return res.status(400).json({ message: 'Panier vide ou introuvable' });
    }

    if (panier.date_expiration && new Date() > new Date(panier.date_expiration)) {
      await Panier.deleteOne({ _id: panier._id });
      return res.status(400).json({ message: 'Panier expiré, veuillez recommencer' });
    }

    const articlesSnapshot = [];
    for (const article of panier.articles) {
      const produit = await Produit.findById(article.produit._id);
      if (!produit) return res.status(404).json({ message: 'Produit introuvable' });

      if (article.variante) {
        const variante = produit.variantes.id(article.variante);
        if (!variante) return res.status(404).json({ message: `Variante introuvable pour ${produit.nom}` });
        if (variante.quantite < article.quantite) {
          return res.status(400).json({ message: `Stock insuffisant pour ${produit.nom} - ${variante.nom}` });
        }
        variante.quantite -= article.quantite;
      } else {
        if (produit.quantite < article.quantite) {
          return res.status(400).json({ message: `Stock insuffisant pour ${produit.nom}` });
        }
        produit.quantite -= article.quantite;
      }
      await produit.save();

      articlesSnapshot.push({
        produit: produit._id,
        variante: article.variante || null,
        nom_produit: produit.nom,
        sku: article.variante ? produit.variantes.id(article.variante)?.sku : produit.reference,
        quantite: article.quantite,
        prix_unitaire: article.prix_unitaire,
        prix_promo_unitaire: article.prix_promo_unitaire || null
      });
    }

    const commande = await Commande.create({
      utilisateur: userId,
      panier: panier._id,
      articles: articlesSnapshot,
      adresse_livraison,
      sous_total: panier.sous_total,
      total_remise: panier.total_remise,
      total: panier.total,
      statut: 'EN_ATTENTE',
      statut_paiement: 'IMPAYE',   // toujours impayé à la création
      reference: `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    });

    panier.statut = 'CONVERTI';
    panier.date_conversion = new Date();
    panier.commande = commande._id;
    await panier.save();

    res.status(201).json(commande);
  } catch (error) {
    console.error('Erreur creerCommande:', error);
    res.status(500).json({ message: 'Erreur création commande', error: error.message });
  }
};

// ============================================
// MES COMMANDES (client)
// ============================================

exports.getMesCommandes = async (req, res) => {
  try {
    const commandes = await Commande.find({ utilisateur: req.user._id })
      .sort({ date_creation: -1 })
      .populate('utilisateur', 'nom prenom email')
      .populate({
        path: 'articles.produit',
        select: 'nom variantes reference',
        populate: { path: 'variantes' } 
      });


    const commandesEnrichies = commandes.map(commande => {
      const obj = commande.toObject();
      obj.articles = obj.articles.map(article => {
        if (article.variante && article.produit?.variantes) {
          const varianteDetails = article.produit.variantes.find(
            v => v._id.toString() === article.variante.toString()
          );
          article.variante_details = varianteDetails || null;
        }
        return article;
      });
      return obj;
    });

    res.json(commandesEnrichies);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// DÉTAIL COMMANDE
// ============================================
exports.getCommandeDetail = async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, utilisateur: req.user._id })
      .populate('utilisateur', 'nom prenom email')
      .populate('adresse_livraison.zone');
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// COMMANDES BOUTIQUE
// ============================================
exports.getCommandesBoutique = async (req, res) => {
  try {
    const boutiqueId = req.user.boutiqueId;
    const produitIds = await Produit.find({ boutique: boutiqueId }).distinct('_id');

    const commandes = await Commande.find({
      'articles.produit': { $in: produitIds }
    })
    .sort({ date_creation: -1 })
    .populate('utilisateur', 'nom prenom email')
    .populate({
      path: 'articles.produit',
      select: 'nom variantes reference'
    });

    const commandesEnrichies = commandes.map(cmd => {
      const obj = cmd.toObject();

      obj.articles = obj.articles.map(article => {
        if (article.variante && article.produit?.variantes) {
          const variante = article.produit.variantes.find(
            v => v._id.toString() === article.variante.toString()
          );

          if (variante) {
            article.variante_details = variante;
          }
        }
        return article;
      });

      return obj;
    });

    res.json(commandesEnrichies);

  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// ANNULER COMMANDE (client)
// ============================================
exports.annulerCommande = async (req, res) => {
  try {
    const commande = await Commande.findOne({ _id: req.params.id, utilisateur: req.user._id });
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });
    if (commande.statut !== 'EN_ATTENTE') {
      return res.status(400).json({ message: 'Cette commande ne peut plus être annulée' });
    }

    // Restituer le stock
    for (const article of commande.articles) {
      const produit = await Produit.findById(article.produit);
      if (!produit) continue;
      if (article.variante) {
        const v = produit.variantes.id(article.variante);
        if (v) v.quantite += article.quantite;
      } else {
        produit.quantite += article.quantite;
      }
      await produit.save();
    }

    commande.statut = 'ANNULEE';
    commande.date_annulation = new Date();
    await commande.save();
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
};

// ============================================
// METTRE À JOUR STATUT (boutique)
// Gère séparément : statut livraison ET statut paiement
// ============================================
exports.mettreAJourStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsAutorises = ['EN_COURS', 'LIVREE', 'ANNULEE'];

    if (!statutsAutorises.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const commande = await Commande.findById(req.params.id);
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });

    //  Règle simple : impossible d'annuler si déjà payé
    if (statut === 'ANNULEE' && commande.statut_paiement === 'PAYE') {
      return res.status(400).json({ message: 'Impossible d\'annuler une commande déjà payée' });
    }

    //  Transitions normales restent bloquées
    if (statut === 'LIVREE' && !['EN_ATTENTE', 'EN_COURS'].includes(commande.statut)) {
      return res.status(400).json({ message: 'Transition invalide' });
    }
    if (statut === 'EN_COURS' && commande.statut !== 'EN_ATTENTE') {
      return res.status(400).json({ message: 'Transition invalide' });
    }

    commande.statut = statut;

    if (statut === 'LIVREE') {
      commande.date_livraison = new Date();
      commande.statut_paiement = 'IMPAYE';
    }

    if (statut === 'ANNULEE') {
      commande.date_annulation = new Date();
      for (const article of commande.articles) {
        const produit = await Produit.findById(article.produit);
        if (!produit) continue;
        if (article.variante) {
          const v = produit.variantes.id(article.variante);
          if (v) v.quantite += article.quantite;
        } else {
          produit.quantite += article.quantite;
        }
        await produit.save();
      }
    }

    await commande.save();
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour statut', error: error.message });
  }
};

// ============================================
// CONFIRMER PAIEMENT (boutique — livreur revenu)
// ============================================
exports.confirmerPaiement = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);
    if (!commande) return res.status(404).json({ message: 'Commande introuvable' });

    if (commande.statut !== 'LIVREE') {
      return res.status(400).json({ message: 'Le colis doit être livré avant de confirmer le paiement' });
    }

    if (commande.statut_paiement === 'PAYE') {
      return res.status(400).json({ message: 'Paiement déjà confirmé' });
    }

    commande.statut_paiement = 'PAYE';
    commande.date_paiement = new Date();
    await commande.save();

    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur confirmation paiement', error: error.message });
  }
};

// ============================================
// STATS BOUTIQUE — calculées côté backend
// ============================================
exports.getStatsBoutique = async (req, res) => {
  try {
    const boutiqueId = req.user.boutiqueId;
    const produitIds = await Produit.find({ boutique: boutiqueId }).distinct('_id');
    const { mode, dateDebut, dateFin, statutHistorique } = req.query;

    let filtre = { 'articles.produit': { $in: produitIds } };

    if (mode === 'temps-reel') {
      // Tout sauf annulées et livrées+payées
      filtre.$nor = [
        { statut: 'ANNULEE' },
        { statut: 'LIVREE', statut_paiement: 'PAYE' }
      ];
    } else {
      // Historique
      switch(statutHistorique) {
        case 'EN_ATTENTE':
        case 'EN_COURS':
          filtre.statut = statutHistorique;
          break;
        case 'LIVREE':
          filtre.statut = 'LIVREE';
          filtre.statut_paiement = 'PAYE';
          break;
        case 'ANNULEE':
          filtre.statut = 'ANNULEE';
          break;
        default: // TOUS
          filtre.$or = [
            { statut: 'EN_ATTENTE' },
            { statut: 'EN_COURS' },
            { statut: 'LIVREE', statut_paiement: 'PAYE' },
            { statut: 'ANNULEE' }
          ];
      }

      if (dateDebut) filtre.date_creation = { ...filtre.date_creation, $gte: new Date(dateDebut) };
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        filtre.date_creation = { ...filtre.date_creation, $lte: fin };
      }
    }

    const commandes = await Commande.find(filtre);

    const stats = {
      total: commandes.length,
      enAttente: commandes.filter(c => c.statut === 'EN_ATTENTE').length,
      enCours: commandes.filter(c => c.statut === 'EN_COURS').length,
      livreesImpayees: commandes.filter(c => c.statut === 'LIVREE' && c.statut_paiement === 'IMPAYE').length,
      annulees: commandes.filter(c => c.statut === 'ANNULEE').length,
      chiffreAffaires: commandes.filter(c => c.statut_paiement === 'PAYE').reduce((sum, c) => sum + c.total, 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats', error: error.message });
  }
};

// ============================================
// STATS CLIENT — calculées côté backend
// ============================================
exports.getStatsClient = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mode, dateDebut, dateFin, statut } = req.query;

    let filtre = { utilisateur: userId };

    if (mode === 'temps-reel') {
      filtre.$nor = [
        { statut: 'ANNULEE' },
        { statut: 'LIVREE', statut_paiement: 'PAYE' }
      ];
    } else if (mode === 'historique') {
      filtre.$or = [
        { statut: 'ANNULEE' },
        { statut: 'LIVREE', statut_paiement: 'PAYE' }
      ];
      if (statut && statut !== 'TOUS') filtre.statut = statut;
      if (dateDebut) filtre.date_creation = { ...filtre.date_creation, $gte: new Date(dateDebut) };
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        filtre.date_creation = { ...filtre.date_creation, $lte: fin };
      }
    }

    const commandes = await Commande.find(filtre);

    res.json({
      total:        commandes.length,
      enCours:      commandes.filter(c =>
                      c.statut === 'EN_ATTENTE' ||
                      c.statut === 'EN_COURS' ||
                      (c.statut === 'LIVREE' && c.statut_paiement === 'IMPAYE')
                    ).length,
      totalDepense: commandes
                      .filter(c => c.statut_paiement === 'PAYE')
                      .reduce((sum, c) => sum + c.total, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur stats', error: error.message });
  }
};

exports.exportFacture = async (req, res) => {
  try {
    const commande = await Commande.findOne({
      _id: req.params.id,
      utilisateur: req.user._id
    })
    .populate('adresse_livraison.zone');

    if (!commande) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    if (!commande.est_terminee) {
      return res.status(400).json({ message: 'Facture disponible uniquement pour commande livrée et payée' });
    }

    const doc = new PDFDocument({ margin: 50 });

    // ==============================
    // HEADERS HTTP
    // ==============================
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Facture_${commande.reference}.pdf`
    );

    doc.pipe(res);

    // ==============================
    // LOGO + TITRE
    // ==============================
    const logoPath = path.join(__dirname, '../logos/logo-lacity-mall.png');
    doc.image(logoPath, 50, 45, { width: 120 });

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('FACTURE', 400, 50, { align: 'right' });

    doc.moveDown(2);

    // ==============================
    // INFO CLIENT & COMMANDE
    // ==============================
    doc.font('Helvetica').fontSize(12);
    doc.text(`Référence : ${commande.reference}`);
    doc.text(`Date : ${new Date(commande.date_creation).toLocaleDateString()}`);
    doc.moveDown(0.5);

    doc.text(`Client : ${commande.adresse_livraison.nom}`);
    doc.text(`Téléphone : ${commande.adresse_livraison.telephone}`);
    doc.text(`Adresse : ${commande.adresse_livraison.adresse}, ${commande.adresse_livraison.ville}`);
    if (commande.adresse_livraison.zone) {
      doc.text(`Zone : ${commande.adresse_livraison.zone.nom}`);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown(1);

    // ==============================
    // TABLEAU ARTICLES
    // ==============================
    doc.font('Helvetica-Bold').fontSize(14).text(`Articles (${commande.nombre_articles}) :`);
    doc.moveDown(0.5);

    commande.articles.forEach(article => {
      const prix = article.prix_promo_unitaire || article.prix_unitaire;
      const totalLigne = prix * article.quantite;

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`${article.nom_produit}`);

      if (article.variante) {
        doc.font('Helvetica').text(`   Variante : ${article.variante}`);
      }

      doc.font('Helvetica')
        .text(`   Quantité : ${article.quantite}`)
        .text(`   Prix unitaire : ${prix.toFixed(2)} DH`)
        .text(`   Total ligne : ${totalLigne.toFixed(2)} DH`);

      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // ==============================
    // TOTAUX
    // ==============================
    const yTotaux = doc.y;
    doc.font('Helvetica-Bold').fontSize(12).text('Sous-total :', 400, yTotaux);
    doc.font('Helvetica').text(`${commande.sous_total.toFixed(2)} DH`, 500, yTotaux, { align: 'right' });

    doc.font('Helvetica-Bold').text('Remise :', 400, doc.y);
    doc.font('Helvetica').text(`-${commande.total_remise.toFixed(2)} DH`, 500, doc.y, { align: 'right' });

    doc.font('Helvetica-Bold').text('Total payé :', 400, doc.y);
    doc.font('Helvetica').text(`${commande.total.toFixed(2)} DH`, 500, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.font('Helvetica').text(`Paiement confirmé le : ${new Date(commande.date_paiement).toLocaleDateString()}`);

    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(12).text('Merci pour votre confiance.', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Erreur exportFacture:', error);
    res.status(500).json({ message: 'Erreur génération facture', error: error.message });
  }
};
module.exports = exports;