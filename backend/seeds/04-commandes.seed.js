const mongoose = require('mongoose');
const User = require('../models/User');
const Produit = require('../models/Produit');
const Commande = require('../models/Commande');
const MouvementStock = require('../models/MouvementStock');
const Zone = require('../models/Zone');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ============================================================
// HELPER — construire le snapshot article (même logique que creerCommande)
// ============================================================
const buildArticle = (produit, varianteSku, quantite) => {
  let prix_unitaire = produit.prix;
  let sku           = produit.reference;
  let variante_id   = null;

  if (varianteSku) {
    const v = produit.variantes.find(v => v.sku === varianteSku);
    if (!v) throw new Error(`Variante ${varianteSku} introuvable sur ${produit.reference}`);
    prix_unitaire += (v.prix_supplement || 0);
    sku            = v.sku;
    variante_id    = v._id;
  }

  return {
    doc: {
      produit:             produit._id,
      variante:            variante_id,
      nom_produit:         produit.nom,
      sku,
      quantite,
      prix_unitaire,
      prix_promo_unitaire: null,
    },
    total_ligne: prix_unitaire * quantite,
  };
};

// ============================================================
// HELPER — créer une commande complète
// (même logique que creerCommande + mettreAJourStatut + confirmerPaiement)
// ============================================================
let _refCounter = 0;
const creerCommande = async ({
  utilisateur,
  lignes,           // [{ ref, varianteSku?, quantite }]
  adresse_livraison,
  statut,           // EN_ATTENTE | EN_COURS | LIVREE | ANNULEE
  statut_paiement,  // IMPAYE | PAYE
  date_creation,
  date_livraison  = null,
  date_paiement   = null,
  date_annulation = null,
  remise          = 0,
}, prodMap) => {

  const articlesSnapshot = [];
  let sous_total = 0;

  for (const ligne of lignes) {
    const produit = prodMap[ligne.ref];
    if (!produit) throw new Error(`Produit introuvable : ${ligne.ref}`);
    const { doc, total_ligne } = buildArticle(produit, ligne.varianteSku || null, ligne.quantite);
    articlesSnapshot.push(doc);
    sous_total += total_ligne;
  }

  const total = sous_total - remise;

  // Référence unique reproductible (timestamp + compteur)
  _refCounter++;
  const ts  = date_creation.getTime();
  const ref = `CMD-${ts}-${String(_refCounter).padStart(4, '0')}`;

  // Création de la commande
  const commande = await Commande.create({
    utilisateur:      utilisateur._id,
    panier:           null,
    articles:         articlesSnapshot,
    adresse_livraison,
    sous_total,
    total_remise:     remise,
    total,
    statut,
    statut_paiement,
    reference:        ref,
    date_paiement,
    date_livraison,
    date_annulation,
  });

  // Force date_creation — bypass timestamps via driver MongoDB direct
  await Commande.collection.updateOne(
    { _id: commande._id },
    { $set: { date_creation, date_modification: date_creation } }
  );

  // Mouvements de stock SORTIE (sauf annulées)
  if (statut !== 'ANNULEE') {
    const mouvements = [];
    for (const art of articlesSnapshot) {
      const produit = prodMap[Object.keys(prodMap).find(k => prodMap[k]._id.equals(art.produit))];
      if (!produit) continue;

      if (art.variante) {
        const v = produit.variantes.id(art.variante);
        if (v) {
          const qAvant = v.quantite;
          v.quantite   = Math.max(0, v.quantite - art.quantite); // décrémente le variante
          await produit.save();
          mouvements.push({
            produit:            produit._id,
            type:               'SORTIE',
            quantite:           art.quantite,
            motif:              `Vente — commande ${ref}`,
            boutique:           produit.boutique,
            variante_sku:       v.sku        || null,
            variante_nom:       v.nom        || null,
            variante_attributs: v.attributs  || [],
            quantite_avant:     qAvant,
            quantite_apres:     v.quantite,
            cree_par:           null,
          });
        }
      } else {
        const qAvant     = produit.quantite;
        produit.quantite = Math.max(0, produit.quantite - art.quantite); // décrémente le produit
        await produit.save();
        mouvements.push({
          produit:        produit._id,
          type:           'SORTIE',
          quantite:       art.quantite,
          motif:          `Vente — commande ${ref}`,
          boutique:       produit.boutique,
          quantite_avant: qAvant,
          quantite_apres: produit.quantite,
          cree_par:       null,
        });
      }
    }
    if (mouvements.length) {
      // Force createdAt = date_creation de la commande (bypass timestamps)
      const inserted = await MouvementStock.insertMany(mouvements);
      await MouvementStock.collection.updateMany(
        { _id: { $in: inserted.map(m => m._id) } },
        { $set: { createdAt: date_creation, updatedAt: date_creation } }
      );
    }
  }

  return commande;
};

// ============================================================
// HELPER — adresse livraison
// ============================================================
const adresse = (client, rue, ville = 'Antananarivo') => ({
  nom:       `${client.prenom} ${client.nom}`,
  telephone: client.telephone || '+261 34 00 000 00',
  adresse:   rue,
  ville,
  zone:      null,
});

// ============================================================
// SEED PRINCIPAL
// ============================================================
const seedCommandes = async () => {
  try {
    console.log('🔹 MONGO_URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
      useFindAndModify:   false,
    });
    console.log(' MongoDB connecté\n');

    // ── Nettoyage
    await Commande.deleteMany({});
    await MouvementStock.deleteMany({ type: 'SORTIE' }); // garde les ENTREE initiales
    console.log('  Commandes et mouvements de stock supprimés');

    // ── Reset stock produits aux quantités initiales
    // Évite le stock négatif si seedCommandes est relancé sans relancer seedProduits
    const stockInitial = {
      'VET-NIKE-TS-01':    { qte: 50,  var: { 'VET-NIKE-TS-S': 12, 'VET-NIKE-TS-M': 15, 'VET-NIKE-TS-L': 13, 'VET-NIKE-TS-XL': 10 } },
      'VET-ADI-TF-01':     { qte: 40,  var: { 'VET-ADI-TF-S': 10, 'VET-ADI-TF-M': 12, 'VET-ADI-TF-L': 10, 'VET-ADI-TF-XL': 8 } },
      'VET-LEV-501':       { qte: 30,  var: { 'VET-LEV-3032': 8, 'VET-LEV-3232': 8, 'VET-LEV-3432': 8, 'VET-LEV-3234': 6 } },
      'VET-VEST-CUIR-H':   { qte: 15 },
      'VET-POLO-RL':       { qte: 35,  var: { 'VET-POLO-RL-S': 8, 'VET-POLO-RL-M': 10, 'VET-POLO-RL-L': 10, 'VET-POLO-RL-XL': 7 } },
      'VET-ROBE-SOIREE':   { qte: 20 },
      'VET-SAC-CUIR-F':    { qte: 18 },
      'VET-ESCA-8CM':      { qte: 25,  var: { 'VET-ESC-37': 5, 'VET-ESC-38': 7, 'VET-ESC-39': 7, 'VET-ESC-40': 6 } },
      'VET-BLAZ-F':        { qte: 22 },
      'ELEC-WATCH-GW6':    { qte: 20 },
      'ELEC-AIRPODS-PRO2': { qte: 15 },
      'ELEC-RB-AVIAT':     { qte: 30 },
      'DECO-MIR-DORE':     { qte: 20 },
      'DECO-CHAN-N5':       { qte: 12 },
      'KID-PYJA-COT':      { qte: 60 },
      'KID-VEST-IMP':      { qte: 35 },
      'KID-ROBE-ETE':      { qte: 45 },
      'KID-BASKET-SP':     { qte: 40 },
      'ELEC-IPHONE-15':    { qte: 12 },
      'ELEC-GALAXY-S24':   { qte: 15 },
      'ELEC-PS5-SLIM':     { qte: 10 },
      'ELEC-ECOUT-BT':     { qte: 25 },
      'ELEC-MBP-M3':       { qte: 5  },
      'ELEC-DELL-XPS':     { qte: 8  },
      'ELEC-CHARG-65W':    { qte: 50 },
      'DECO-CANAPE-SCANDI':{ qte: 4  },
      'DECO-TABLE-CHENE':  { qte: 8  },
      'DECO-LAMPE-ARC':    { qte: 12 },
      'DECO-TAPIS-BERB':   { qte: 6  },
    };

    let resetCount = 0;
    for (const [ref, stock] of Object.entries(stockInitial)) {
      const prod = await Produit.findOne({ reference: ref });
      if (!prod) continue;
      prod.quantite = stock.qte;
      if (stock.var) {
        for (const v of prod.variantes) {
          if (stock.var[v.sku] !== undefined) v.quantite = stock.var[v.sku];
        }
      }
      await prod.save();
      resetCount++;
    }
    console.log(` Stock de ${resetCount} produits réinitialisé`);

    // ── Force la date des ENTREE initiales au 01/01/2025
    // (avant toutes les commandes) pour cohérence chronologique
    const dateStockInitial = new Date('2025-01-01');
    const entreesMaj = await MouvementStock.collection.updateMany(
      { type: 'ENTREE' },
      { $set: { createdAt: dateStockInitial, updatedAt: dateStockInitial } }
    );
    console.log(` ${entreesMaj.modifiedCount} mouvements ENTREE redatés au 01/01/2025\n`);

    // ── Chargement clients ACHETEUR
    const clients = await User.find({ role: 'ACHETEUR' });
    if (!clients.length) throw new Error('Aucun client ACHETEUR — lancez le seed users d\'abord');

    const u = {};
    clients.forEach(c => { u[c.email] = c; });

    // Raccourcis
    const pierre  = u['client@mail.mg'];
    const aina    = u['antsamadagascar@gmail.com'];
    const nanten  = u['nantenaina@gmail.com'];
    const antoine = u['antoine.randria@mail.mg'];
    const lalaina = u['lalaina.rabe@mail.mg'];
    const mickael = u['mickael.razafy@mail.mg'];
    const hery    = u['hery.ratsimba@mail.mg'];
    const fara    = u['fara.randriamanana@mail.mg'];
    const tahina  = u['tahina.rakoto@mail.mg'];
    const rina    = u['rina.raveloson@mail.mg'];
    const toky    = u['toky.andriamihaja@mail.mg'];
    const mahefa  = u['mahefa.rakotomalala@mail.mg'];
    const nirina  = u['nirina.rasoanaivo@mail.mg'];
    const andry   = u['andry.ramanantsoa@mail.mg'];
    const mialy   = u['mialy.randrianarisoa@mail.mg'];
    const fenitra = u['fenitra.ravelomanana@mail.mg'];
    const tiana   = u['tiana.rabemananjara@mail.mg'];
    const hasina  = u['hasina.rakotonirina@mail.mg'];
    const joel    = u['joel.randriatsiferana@mail.mg'];

    console.log(` ${clients.length} clients chargés`);

    // ── Chargement produits par référence
    const tousLesProduits = await Produit.find();
    if (!tousLesProduits.length) throw new Error('Aucun produit — lancez le seed produits d\'abord');

    const p = {};
    tousLesProduits.forEach(prod => { p[prod.reference] = prod; });
    console.log(` ${tousLesProduits.length} produits chargés\n`);

    // ============================================================
    // COMMANDES
    // Scénario réaliste :
    // 2025 (jan → déc) : ~28 commandes, mix LIVREE+PAYE, ANNULEE
    // Jan 2026         : ~4 commandes LIVREE+PAYE
    // Fév 2026         : ~5 commandes dont EN_COURS, EN_ATTENTE,
    //                    LIVREE+IMPAYE (livreur pas encore revenu)
    // ============================================================
    console.log(' Création des commandes...\n');

    const cmds = [];
    let debut;

    // ═══════════════════════════════════════════════
    // JANVIER 2025
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: pierre,
      lignes: [
        { ref: 'VET-NIKE-TS-01', varianteSku: 'VET-NIKE-TS-M', quantite: 2 },
        { ref: 'VET-ADI-TF-01',  varianteSku: 'VET-ADI-TF-L',  quantite: 1 },
      ],
      adresse_livraison: adresse(pierre, 'Lot IVR 12, Ankadifotsy'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-01-08'),
      date_livraison: new Date('2025-01-10'),
      date_paiement:  new Date('2025-01-10'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: aina,
      lignes: [
        { ref: 'VET-ROBE-SOIREE', quantite: 1 },
        { ref: 'VET-SAC-CUIR-F',  quantite: 1 },
      ],
      adresse_livraison: adresse(aina, 'Cité Ampefiloha, Apt 4B'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-01-12'),
      date_livraison: new Date('2025-01-14'),
      date_paiement:  new Date('2025-01-14'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: nanten,
      lignes: [
        { ref: 'ELEC-IPHONE-15', quantite: 1 },
      ],
      adresse_livraison: adresse(nanten, 'Ankadimbahoaka, Villa 7'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-01-15'),
      date_livraison: new Date('2025-01-17'),
      date_paiement:  new Date('2025-01-17'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: antoine,
      lignes: [
        { ref: 'KID-PYJA-COT',  quantite: 2 },
        { ref: 'KID-ROBE-ETE',  quantite: 1 },
        { ref: 'KID-BASKET-SP', quantite: 1 },
      ],
      adresse_livraison: adresse(antoine, 'Mahamasina, Rue des Fleurs 3'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-01-20'),
      date_livraison: new Date('2025-01-22'),
      date_paiement:  new Date('2025-01-22'),
    }, p));

    // Annulée — client a changé d'avis
    cmds.push(await creerCommande({
      utilisateur: lalaina,
      lignes: [
        { ref: 'DECO-CANAPE-SCANDI', quantite: 1 },
      ],
      adresse_livraison: adresse(lalaina, 'Tsiadana, Immeuble Ny Tanintsika'),
      statut: 'ANNULEE', statut_paiement: 'IMPAYE',
      date_creation:   new Date('2025-01-25'),
      date_annulation: new Date('2025-01-26'),
    }, p));

    console.log(`   Janvier 2025   — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // FÉVRIER 2025
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: mickael,
      lignes: [
        { ref: 'ELEC-GALAXY-S24', quantite: 1 },
        { ref: 'ELEC-ECOUT-BT',   quantite: 1 },
      ],
      adresse_livraison: adresse(mickael, 'Andrefan\'Ambohijanahary, Lot 18'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-02-03'),
      date_livraison: new Date('2025-02-05'),
      date_paiement:  new Date('2025-02-05'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: hery,
      lignes: [
        { ref: 'DECO-TABLE-CHENE', quantite: 1 },
        { ref: 'DECO-LAMPE-ARC',   quantite: 1 },
      ],
      adresse_livraison: adresse(hery, 'Ampasanimalo, Résidence Verts'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-02-10'),
      date_livraison: new Date('2025-02-13'),
      date_paiement:  new Date('2025-02-13'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: fara,
      lignes: [
        { ref: 'VET-BLAZ-F',    quantite: 1 },
        { ref: 'VET-ESCA-8CM',  varianteSku: 'VET-ESC-38', quantite: 1 },
      ],
      adresse_livraison: adresse(fara, 'Antanimena, Cité Soleil 4'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-02-14'),
      date_livraison: new Date('2025-02-16'),
      date_paiement:  new Date('2025-02-16'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: tahina,
      lignes: [
        { ref: 'ELEC-MBP-M3', quantite: 1 },
      ],
      adresse_livraison: adresse(tahina, 'Ankorondrano, Blue Tower B'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-02-18'),
      date_livraison: new Date('2025-02-20'),
      date_paiement:  new Date('2025-02-20'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: rina,
      lignes: [
        { ref: 'VET-LEV-501',  varianteSku: 'VET-LEV-3232', quantite: 1 },
        { ref: 'VET-POLO-RL',  varianteSku: 'VET-POLO-RL-M', quantite: 2 },
      ],
      adresse_livraison: adresse(rina, 'Isotry, Rue Principale 12'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-02-22'),
      date_livraison: new Date('2025-02-24'),
      date_paiement:  new Date('2025-02-24'),
    }, p));

    console.log(`   Février 2025   — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // MARS 2025
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: toky,
      lignes: [{ ref: 'ELEC-PS5-SLIM', quantite: 1 }],
      adresse_livraison: adresse(toky, 'Analakely, Rue de la Réunion 8'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-03-05'),
      date_livraison: new Date('2025-03-07'),
      date_paiement:  new Date('2025-03-07'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: mahefa,
      lignes: [
        { ref: 'DECO-TAPIS-BERB', quantite: 1 },
        { ref: 'DECO-MIR-DORE',   quantite: 1 },
      ],
      adresse_livraison: adresse(mahefa, 'Ambohimanarina, Lot IB 44'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-03-12'),
      date_livraison: new Date('2025-03-15'),
      date_paiement:  new Date('2025-03-15'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: nirina,
      lignes: [
        { ref: 'ELEC-WATCH-GW6', quantite: 1 },
        { ref: 'ELEC-RB-AVIAT',  quantite: 1 },
      ],
      adresse_livraison: adresse(nirina, 'Andavamamba, Villa Rosa'),
      statut: 'ANNULEE', statut_paiement: 'IMPAYE',
      date_creation:   new Date('2025-03-18'),
      date_annulation: new Date('2025-03-19'),
    }, p));

    console.log(`   Mars 2025      — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // AVRIL — JUIN 2025
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: andry,
      lignes: [
        { ref: 'ELEC-DELL-XPS',  quantite: 1 },
        { ref: 'ELEC-CHARG-65W', quantite: 2 },
      ],
      adresse_livraison: adresse(andry, 'Behoririka, Cité Universitaire 3'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-04-08'),
      date_livraison: new Date('2025-04-11'),
      date_paiement:  new Date('2025-04-11'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: mialy,
      lignes: [
        { ref: 'VET-VEST-CUIR-H', quantite: 1 },
        { ref: 'VET-NIKE-TS-01',  varianteSku: 'VET-NIKE-TS-S', quantite: 2 },
      ],
      adresse_livraison: adresse(mialy, 'Faravohitra, Résidence Lac 6'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-04-22'),
      date_livraison: new Date('2025-04-25'),
      date_paiement:  new Date('2025-04-25'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: fenitra,
      lignes: [
        { ref: 'DECO-CHAN-N5',   quantite: 1 },
        { ref: 'VET-SAC-CUIR-F', quantite: 1 },
      ],
      adresse_livraison: adresse(fenitra, 'Faravohitra, Maison Verte'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-05-10'),
      date_livraison: new Date('2025-05-13'),
      date_paiement:  new Date('2025-05-13'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: tiana,
      lignes: [
        { ref: 'KID-VEST-IMP',  quantite: 2 },
        { ref: 'KID-BASKET-SP', quantite: 2 },
      ],
      adresse_livraison: adresse(tiana, 'Andohatapenaka, Bloc B 12'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-05-20'),
      date_livraison: new Date('2025-05-22'),
      date_paiement:  new Date('2025-05-22'),
    }, p));

    // Annulée par le client
    cmds.push(await creerCommande({
      utilisateur: hasina,
      lignes: [
        { ref: 'ELEC-AIRPODS-PRO2', quantite: 1 },
      ],
      adresse_livraison: adresse(hasina, 'Ivandry, Cité Jardin 9'),
      statut: 'ANNULEE', statut_paiement: 'IMPAYE',
      date_creation:   new Date('2025-06-03'),
      date_annulation: new Date('2025-06-04'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: joel,
      lignes: [
        { ref: 'DECO-CANAPE-SCANDI', quantite: 1 },
        { ref: 'DECO-TABLE-CHENE',   quantite: 1 },
      ],
      adresse_livraison: adresse(joel, 'Ambohidratrimo, Villa Jacaranda'),
      statut: 'ANNULEE', statut_paiement: 'IMPAYE',
      date_creation:   new Date('2025-06-18'),
      date_annulation: new Date('2025-06-20'),
    }, p));

    console.log(`    Avr–Juin 2025  — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // JUILLET — SEPTEMBRE 2025
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: pierre,
      lignes: [{ ref: 'ELEC-DELL-XPS', quantite: 1 }],
      adresse_livraison: adresse(pierre, 'Lot IVR 12, Ankadifotsy'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-07-10'),
      date_livraison: new Date('2025-07-13'),
      date_paiement:  new Date('2025-07-13'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: aina,
      lignes: [
        { ref: 'VET-ROBE-SOIREE', quantite: 1 },
        { ref: 'VET-ESCA-8CM',    varianteSku: 'VET-ESC-39', quantite: 1 },
        { ref: 'DECO-CHAN-N5',    quantite: 1 },
      ],
      adresse_livraison: adresse(aina, 'Cité Ampefiloha, Apt 4B'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-07-25'),
      date_livraison: new Date('2025-07-28'),
      date_paiement:  new Date('2025-07-28'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: mickael,
      lignes: [
        { ref: 'ELEC-CHARG-65W', quantite: 3 },
        { ref: 'ELEC-ECOUT-BT',  quantite: 1 },
      ],
      adresse_livraison: adresse(mickael, 'Andrefan\'Ambohijanahary, Lot 18'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-08-05'),
      date_livraison: new Date('2025-08-07'),
      date_paiement:  new Date('2025-08-07'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: hery,
      lignes: [
        { ref: 'DECO-LAMPE-ARC', quantite: 1 },
        { ref: 'DECO-MIR-DORE',  quantite: 2 },
      ],
      adresse_livraison: adresse(hery, 'Ampasanimalo, Résidence Verts'),
      statut: 'ANNULEE', statut_paiement: 'IMPAYE',
      date_creation:   new Date('2025-08-20'),
      date_annulation: new Date('2025-08-21'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: nanten,
      lignes: [
        { ref: 'ELEC-IPHONE-15',     quantite: 1 },
        { ref: 'ELEC-AIRPODS-PRO2',  quantite: 1 },
      ],
      adresse_livraison: adresse(nanten, 'Ankadimbahoaka, Villa 7'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-09-12'),
      date_livraison: new Date('2025-09-15'),
      date_paiement:  new Date('2025-09-15'),
    }, p));

    console.log(`    Juil–Sep 2025  — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // OCTOBRE — DÉCEMBRE 2025
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: fara,
      lignes: [
        { ref: 'VET-POLO-RL',   varianteSku: 'VET-POLO-RL-L', quantite: 2 },
        { ref: 'VET-ADI-TF-01', varianteSku: 'VET-ADI-TF-M',  quantite: 1 },
      ],
      adresse_livraison: adresse(fara, 'Antanimena, Cité Soleil 4'),
      statut: 'ANNULEE', statut_paiement: 'IMPAYE',
      date_creation:   new Date('2025-10-08'),
      date_annulation: new Date('2025-10-09'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: tahina,
      lignes: [
        { ref: 'ELEC-PS5-SLIM',   quantite: 1 },
        { ref: 'ELEC-WATCH-GW6',  quantite: 1 },
      ],
      adresse_livraison: adresse(tahina, 'Ankorondrano, Blue Tower B'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-10-22'),
      date_livraison: new Date('2025-10-25'),
      date_paiement:  new Date('2025-10-25'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: toky,
      lignes: [
        { ref: 'KID-PYJA-COT', quantite: 3 },
        { ref: 'KID-VEST-IMP', quantite: 2 },
        { ref: 'KID-ROBE-ETE', quantite: 2 },
      ],
      adresse_livraison: adresse(toky, 'Analakely, Rue de la Réunion 8'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-11-05'),
      date_livraison: new Date('2025-11-08'),
      date_paiement:  new Date('2025-11-08'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: andry,
      lignes: [{ ref: 'ELEC-MBP-M3', quantite: 1 }],
      adresse_livraison: adresse(andry, 'Behoririka, Cité Universitaire 3'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-11-20'),
      date_livraison: new Date('2025-11-23'),
      date_paiement:  new Date('2025-11-23'),
    }, p));

    // Décembre — période de fêtes
    cmds.push(await creerCommande({
      utilisateur: mialy,
      lignes: [
        { ref: 'DECO-TAPIS-BERB',    quantite: 1 },
        { ref: 'DECO-CANAPE-SCANDI', quantite: 1 },
      ],
      adresse_livraison: adresse(mialy, 'Faravohitra, Résidence Lac 6'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-12-05'),
      date_livraison: new Date('2025-12-08'),
      date_paiement:  new Date('2025-12-08'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: fenitra,
      lignes: [
        { ref: 'DECO-CHAN-N5',    quantite: 2 },
        { ref: 'VET-ROBE-SOIREE', quantite: 1 },
        { ref: 'VET-SAC-CUIR-F',  quantite: 1 },
      ],
      adresse_livraison: adresse(fenitra, 'Faravohitra, Maison Verte'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2025-12-18'),
      date_livraison: new Date('2025-12-21'),
      date_paiement:  new Date('2025-12-21'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: tiana,
      lignes: [
        { ref: 'KID-BASKET-SP', quantite: 3 },
        { ref: 'KID-PYJA-COT',  quantite: 2 },
      ],
      adresse_livraison: adresse(tiana, 'Andohatapenaka, Bloc B 12'),
      statut: 'ANNULEE', statut_paiement: 'IMPAYE',
      date_creation:   new Date('2025-12-22'),
      date_annulation: new Date('2025-12-23'),
    }, p));

    console.log(`    Oct–Déc 2025   — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // JANVIER 2026
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: hasina,
      lignes: [
        { ref: 'ELEC-GALAXY-S24', quantite: 1 },
        { ref: 'ELEC-CHARG-65W',  quantite: 1 },
      ],
      adresse_livraison: adresse(hasina, 'Ivandry, Cité Jardin 9'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2026-01-07'),
      date_livraison: new Date('2026-01-09'),
      date_paiement:  new Date('2026-01-09'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: joel,
      lignes: [
        { ref: 'ELEC-DELL-XPS',  quantite: 1 },
        { ref: 'ELEC-CHARG-65W', quantite: 2 },
      ],
      adresse_livraison: adresse(joel, 'Ambohidratrimo, Villa Jacaranda'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2026-01-14'),
      date_livraison: new Date('2026-01-16'),
      date_paiement:  new Date('2026-01-16'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: rina,
      lignes: [
        { ref: 'VET-BLAZ-F',      quantite: 1 },
        { ref: 'VET-VEST-CUIR-H', quantite: 1 },
      ],
      adresse_livraison: adresse(rina, 'Isotry, Rue Principale 12'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2026-01-20'),
      date_livraison: new Date('2026-01-22'),
      date_paiement:  new Date('2026-01-22'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: nirina,
      lignes: [
        { ref: 'DECO-TABLE-CHENE', quantite: 1 },
        { ref: 'DECO-MIR-DORE',    quantite: 1 },
      ],
      adresse_livraison: adresse(nirina, 'Andavamamba, Villa Rosa'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2026-01-25'),
      date_livraison: new Date('2026-01-28'),
      date_paiement:  new Date('2026-01-28'),
    }, p));

    console.log(`    Janvier 2026   — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // FÉVRIER 2026
    // Mix réaliste : LIVREE+PAYE, EN_COURS, EN_ATTENTE,
    //               LIVREE+IMPAYE (livreur pas encore revenu)
    // ═══════════════════════════════════════════════
    debut = cmds.length;

    cmds.push(await creerCommande({
      utilisateur: mahefa,
      lignes: [
        { ref: 'ELEC-IPHONE-15',     quantite: 1 },
        { ref: 'ELEC-AIRPODS-PRO2',  quantite: 1 },
      ],
      adresse_livraison: adresse(mahefa, 'Ambohimanarina, Lot IB 44'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2026-02-03'),
      date_livraison: new Date('2026-02-05'),
      date_paiement:  new Date('2026-02-05'),
    }, p));

    cmds.push(await creerCommande({
      utilisateur: pierre,
      lignes: [
        { ref: 'DECO-TAPIS-BERB', quantite: 1 },
      ],
      adresse_livraison: adresse(pierre, 'Lot IVR 12, Ankadifotsy'),
      statut: 'LIVREE', statut_paiement: 'PAYE',
      date_creation: new Date('2026-02-10'),
      date_livraison: new Date('2026-02-12'),
      date_paiement:  new Date('2026-02-12'),
    }, p));

    // EN_COURS — livreur en route
    cmds.push(await creerCommande({
      utilisateur: antoine,
      lignes: [
        { ref: 'KID-PYJA-COT', quantite: 2 },
        { ref: 'KID-VEST-IMP', quantite: 1 },
      ],
      adresse_livraison: adresse(antoine, 'Mahamasina, Rue des Fleurs 3'),
      statut: 'EN_COURS', statut_paiement: 'IMPAYE',
      date_creation: new Date('2026-02-20'),
    }, p));

    // EN_ATTENTE — vient d'être passée ce matin
    cmds.push(await creerCommande({
      utilisateur: lalaina,
      lignes: [
        { ref: 'ELEC-PS5-SLIM',  quantite: 1 },
        { ref: 'ELEC-WATCH-GW6', quantite: 1 },
      ],
      adresse_livraison: adresse(lalaina, 'Tsiadana, Immeuble Ny Tanintsika'),
      statut: 'EN_ATTENTE', statut_paiement: 'IMPAYE',
      date_creation: new Date('2026-02-26'),
    }, p));

    // LIVREE mais IMPAYE — livreur rentré mais pas encore confirmé
    cmds.push(await creerCommande({
      utilisateur: toky,
      lignes: [
        { ref: 'ELEC-RB-AVIAT', quantite: 1 },
        { ref: 'ELEC-ECOUT-BT', quantite: 1 },
      ],
      adresse_livraison: adresse(toky, 'Analakely, Rue de la Réunion 8'),
      statut: 'LIVREE', statut_paiement: 'IMPAYE',
      date_creation:  new Date('2026-02-25'),
      date_livraison: new Date('2026-02-26'),
    }, p));

    console.log(`    Février 2026   — ${cmds.length - debut} commandes`);

    // ═══════════════════════════════════════════════
    // RÉSUMÉ
    // ═══════════════════════════════════════════════
    const stats = {
      livrees_payees:   cmds.filter(c => c.statut === 'LIVREE'     && c.statut_paiement === 'PAYE').length,
      livrees_impayees: cmds.filter(c => c.statut === 'LIVREE'     && c.statut_paiement === 'IMPAYE').length,
      en_cours:         cmds.filter(c => c.statut === 'EN_COURS').length,
      en_attente:       cmds.filter(c => c.statut === 'EN_ATTENTE').length,
      annulees:         cmds.filter(c => c.statut === 'ANNULEE').length,
      ca:               cmds.filter(c => c.statut_paiement === 'PAYE').reduce((s, c) => s + c.total, 0),
    };

    console.log('\n' + '═'.repeat(58));
    console.log(' SEED COMMANDES TERMINÉ — prêt pour démo 03/03/2026');
    console.log('═'.repeat(58));
    console.log(`    Total             : ${cmds.length} commandes`);
    console.log(`    Livrées + payées  : ${stats.livrees_payees}`);
    console.log(`    Livrées impayées  : ${stats.livrees_impayees}  ← livreur pas confirmé`);
    console.log(`     En cours          : ${stats.en_cours}          ← livreur en route`);
    console.log(`    En attente        : ${stats.en_attente}         ← pas encore traitée`);
    console.log(`    Annulées          : ${stats.annulees}`);
    console.log(`    CA encaissé       : ${stats.ca.toLocaleString('fr-FR')} Ar`);
    console.log('═'.repeat(58));

    // process.exit(0);
  } catch (err) {
    console.error('\n Erreur:', err.message);
    if (err.errors) Object.keys(err.errors).forEach(k =>
      console.error(`   - ${k}: ${err.errors[k].message}`)
    );
    process.exit(1);
  }
};

module.exports = seedCommandes