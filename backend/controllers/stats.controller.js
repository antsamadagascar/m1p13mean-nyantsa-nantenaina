const Produit  = require('../models/Produit');
const Commande = require('../models/Commande');

// ============================================
// GET /api/boutiques/:id/chiffre-affaires
// Query: debut, fin, periode, annee
// ============================================
exports.getChiffreAffaires = async (req, res) => {
  try {
    const { id } = req.params;
    const { debut, fin, periode = 'annee', annee } = req.query;

    let dateDebut, dateFin;
    if (annee) {
      dateDebut = new Date(`${annee}-01-01T00:00:00.000Z`);
      dateFin   = new Date(`${annee}-12-31T23:59:59.999Z`);
    } else if (debut || fin) {
      dateDebut = debut ? new Date(debut) : getDebutPeriode(periode);
      dateFin   = fin   ? new Date(fin)   : new Date();
      dateFin.setHours(23, 59, 59, 999);
    } else {
      dateDebut = getDebutPeriode(periode);
      dateFin   = new Date();
      dateFin.setHours(23, 59, 59, 999);
    }

    const produitsBoutique = await Produit.find({ boutique: id }).select('_id');
    const produitIds = produitsBoutique.map(p => p._id);

    const groupBy = annee ? getGroupByPeriode('annee') : getGroupByPeriode(periode);

    // Pipeline commun (articles de la boutique uniquement)
    const buildPipeline = (matchExtra) => [
      {
        $match: {
          ...matchExtra,
          date_creation: { $gte: dateDebut, $lte: dateFin },
          'articles.produit': { $in: produitIds }
        }
      },
      { $unwind: '$articles' },
      { $match: { 'articles.produit': { $in: produitIds } } },
      {
        $addFields: {
          prix_effectif: { $ifNull: ['$articles.prix_promo_unitaire', '$articles.prix_unitaire'] }
        }
      }
    ];

    // ---- CA RÉEL : LIVREE + PAYE ----
    const pipelineReel = buildPipeline({ statut: 'LIVREE', statut_paiement: 'PAYE' });

    const [totauxReel, evolutionReel] = await Promise.all([
      Commande.aggregate([
        ...pipelineReel,
        {
          $group: {
            _id: null,
            total_ca:        { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            total_commandes: { $addToSet: '$_id' },
            total_articles:  { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, total_ca: 1, total_commandes: { $size: '$total_commandes' }, total_articles: 1 } }
      ]),
      Commande.aggregate([
        ...pipelineReel,
        {
          $group: {
            _id:              groupBy,
            chiffre_affaires: { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            nb_commandes:     { $addToSet: '$_id' },
            nb_articles:      { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, periode: '$_id', chiffre_affaires: 1, nb_commandes: { $size: '$nb_commandes' }, nb_articles: 1 } },
        { $sort: { 'periode.annee': 1, 'periode.mois': 1, 'periode.jour': 1 } }
      ])
    ]);

    // ---- CA PRÉVISIONNEL : EN_COURS ----
    const pipelinePrev = buildPipeline({ statut: 'EN_COURS' });

    const [totauxPrev, evolutionPrev] = await Promise.all([
      Commande.aggregate([
        ...pipelinePrev,
        {
          $group: {
            _id: null,
            total_ca:        { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            total_commandes: { $addToSet: '$_id' },
            total_articles:  { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, total_ca: 1, total_commandes: { $size: '$total_commandes' }, total_articles: 1 } }
      ]),
      Commande.aggregate([
        ...pipelinePrev,
        {
          $group: {
            _id:              groupBy,
            chiffre_affaires: { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            nb_commandes:     { $addToSet: '$_id' },
            nb_articles:      { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, periode: '$_id', chiffre_affaires: 1, nb_commandes: { $size: '$nb_commandes' }, nb_articles: 1 } },
        { $sort: { 'periode.annee': 1, 'periode.mois': 1, 'periode.jour': 1 } }
      ])
    ]);

    // ---- Années disponibles ----
    const anneesDispos = await Commande.aggregate([
      { $match: { 'articles.produit': { $in: produitIds }, statut: { $in: ['EN_COURS', 'LIVREE'] } } },
      { $group: { _id: { $year: '$date_creation' } } },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, annee: '$_id' } }
    ]);

    res.json({
      success: true,
      periode: { debut: dateDebut, fin: dateFin },
      // CA réel (encaissé)
      reel: {
        totaux:    totauxReel[0]  || { total_ca: 0, total_commandes: 0, total_articles: 0 },
        evolution: evolutionReel
      },
      // CA prévisionnel (en cours)
      previsionnel: {
        totaux:    totauxPrev[0]  || { total_ca: 0, total_commandes: 0, total_articles: 0 },
        evolution: evolutionPrev
      },
      annees_dispos: anneesDispos.map(a => a.annee)
    });

  } catch (err) {
    console.error('[StatsController]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// GET /api/admin/chiffre-affaires
// ============================================
exports.getChiffreAffairesAdmin = async (req, res) => {
  try {
    const { debut, fin, periode = 'annee', annee } = req.query;

    let dateDebut, dateFin;
    if (annee) {
      dateDebut = new Date(`${annee}-01-01T00:00:00.000Z`);
      dateFin   = new Date(`${annee}-12-31T23:59:59.999Z`);
    } else if (debut || fin) {
      dateDebut = debut ? new Date(debut) : getDebutPeriode(periode);
      dateFin   = fin   ? new Date(fin)   : new Date();
      dateFin.setHours(23, 59, 59, 999);
    } else {
      dateDebut = getDebutPeriode(periode);
      dateFin   = new Date();
      dateFin.setHours(23, 59, 59, 999);
    }

    const groupBy = annee ? getGroupByPeriode('annee') : getGroupByPeriode(periode);

    // 🔥 PIPELINE GLOBAL (AUCUN FILTRE PRODUIT)
    const buildPipeline = (matchExtra) => [
      {
        $match: {
          ...matchExtra,
          date_creation: { $gte: dateDebut, $lte: dateFin }
        }
      },
      { $unwind: '$articles' },
      {
        $addFields: {
          prix_effectif: { $ifNull: ['$articles.prix_promo_unitaire', '$articles.prix_unitaire'] }
        }
      }
    ];

    // CA RÉEL
    const pipelineReel = buildPipeline({ statut: 'LIVREE', statut_paiement: 'PAYE' });

    const [totauxReel, evolutionReel] = await Promise.all([
      Commande.aggregate([
        ...pipelineReel,
        {
          $group: {
            _id: null,
            total_ca:        { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            total_commandes: { $addToSet: '$_id' },
            total_articles:  { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, total_ca: 1, total_commandes: { $size: '$total_commandes' }, total_articles: 1 } }
      ]),
      Commande.aggregate([
        ...pipelineReel,
        {
          $group: {
            _id: groupBy,
            chiffre_affaires: { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            nb_commandes: { $addToSet: '$_id' },
            nb_articles: { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, periode: '$_id', chiffre_affaires: 1, nb_commandes: { $size: '$nb_commandes' }, nb_articles: 1 } },
        { $sort: { 'periode.annee': 1, 'periode.mois': 1, 'periode.jour': 1 } }
      ])
    ]);

    // CA PRÉVISIONNEL
    const pipelinePrev = buildPipeline({ statut: 'EN_COURS' });

    const [totauxPrev, evolutionPrev] = await Promise.all([
      Commande.aggregate([
        ...pipelinePrev,
        {
          $group: {
            _id: null,
            total_ca:        { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            total_commandes: { $addToSet: '$_id' },
            total_articles:  { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, total_ca: 1, total_commandes: { $size: '$total_commandes' }, total_articles: 1 } }
      ]),
      Commande.aggregate([
        ...pipelinePrev,
        {
          $group: {
            _id: groupBy,
            chiffre_affaires: { $sum: { $multiply: ['$prix_effectif', '$articles.quantite'] } },
            nb_commandes: { $addToSet: '$_id' },
            nb_articles: { $sum: '$articles.quantite' }
          }
        },
        { $project: { _id: 0, periode: '$_id', chiffre_affaires: 1, nb_commandes: { $size: '$nb_commandes' }, nb_articles: 1 } },
        { $sort: { 'periode.annee': 1, 'periode.mois': 1, 'periode.jour': 1 } }
      ])
    ]);

    // Années disponibles (GLOBAL)
    const anneesDispos = await Commande.aggregate([
      { $match: { statut: { $in: ['EN_COURS', 'LIVREE'] } } },
      { $group: { _id: { $year: '$date_creation' } } },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, annee: '$_id' } }
    ]);

    res.json({
      success: true,
      periode: { debut: dateDebut, fin: dateFin },
      reel: {
        totaux: totauxReel[0] || { total_ca: 0, total_commandes: 0, total_articles: 0 },
        evolution: evolutionReel
      },
      previsionnel: {
        totaux: totauxPrev[0] || { total_ca: 0, total_commandes: 0, total_articles: 0 },
        evolution: evolutionPrev
      },
      annees_dispos: anneesDispos.map(a => a.annee)
    });

  } catch (err) {
    console.error('[StatsAdminController]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

function getDebutPeriode(periode) {
  const now = new Date();
  switch (periode) {
    case 'jour':    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    case 'semaine': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case 'mois':    return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'annee':   return new Date(now.getFullYear() - 1, 0, 1);
    default:        return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

function getGroupByPeriode(periode) {
  switch (periode) {
    case 'jour':
      return { annee: { $year: '$date_creation' }, mois: { $month: '$date_creation' }, jour: { $dayOfMonth: '$date_creation' }, heure: { $hour: '$date_creation' } };
    case 'semaine':
    case 'mois':
      return { annee: { $year: '$date_creation' }, mois: { $month: '$date_creation' }, jour: { $dayOfMonth: '$date_creation' } };
    case 'annee':
    default:
      return { annee: { $year: '$date_creation' }, mois: { $month: '$date_creation' } };
  }
}