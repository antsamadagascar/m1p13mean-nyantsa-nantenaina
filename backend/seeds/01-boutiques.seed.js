const mongoose = require('mongoose');
const Zone = require('../models/Zone');
const Boutique = require('../models/Boutique');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');
const Emplacement = require('../models/Emplacement');
const Location = require('../models/Location');
const Paiement = require('../models/Paiement');
const slugify = require('slugify');
const path = require('path');
const { zonesInitiales } = require('./initZones');

const env = process.env.NODE_ENV || 'local';
const envFile = env === 'production' ? '.env.production' : '.env';

require('dotenv').config({ 
  path: path.join(__dirname, '..', envFile) 
});

// ============================================================
// HELPER — même logique que createBoutique() dans le controller
// ============================================================
const creerBoutiqueAvecContrat = async ({ boutiqueData, contrat, localisationRaw }) => {
  const slug = slugify(boutiqueData.nom, { lower: true, strict: true, locale: 'fr' });

  const boutique = await Boutique.create({
    ...boutiqueData,
    slug,
    localisation: {
      emplacement:      localisationRaw.emplacement || null,
      numero:           localisationRaw.numero,
      surface:          localisationRaw.surface || null,
      latitude:         localisationRaw.latitude || null,
      longitude:        localisationRaw.longitude || null,
      adresse_complete: localisationRaw.adresse_complete || null,
    },
  });

  let location = null;
  if (contrat && contrat.loyer_mensuel && contrat.date_debut) {
    location = await Location.create({
      boutique:      boutique._id,
      emplacement:   localisationRaw.emplacement,
      numero_local:  localisationRaw.numero,
      surface:       localisationRaw.surface,
      loyer_mensuel: contrat.loyer_mensuel,
      date_debut:    contrat.date_debut,
      date_fin:      contrat.date_fin || null,
      statut:        contrat.statut || 'actif',
      notes:         contrat.notes || '',
    });

    // Bloquer emplacement UNIQUEMENT s'il était actif (même logique que le controller)
    if (localisationRaw.emplacement) {
      const result = await Emplacement.findOneAndUpdate(
        { _id: localisationRaw.emplacement, actif: true },
        { $set: { actif: false } },
        { new: true }
      );
      console.log(result
        ? `       Emplacement ${localisationRaw.numero} bloqué`
        : `        Emplacement ${localisationRaw.numero} déjà bloqué`
      );
    }
  }

  return { boutique, location };
};

// ============================================================
// HELPER — créer un paiement (même logique que paiementService.create)
// ============================================================
const creerPaiement = async ({ location, mois, annee, montant_paye, montant_du, date_paiement, note, statut_force }) => {
  // Vérifie doublon (même logique que le service)
  const existe = await Paiement.findOne({ location: location._id, mois, annee });
  if (existe) return existe;

  const paiement = new Paiement({
    location:      location._id,
    boutique:      location.boutique,
    mois,
    annee,
    montant_du:    montant_du || location.loyer_mensuel,
    montant_paye:  montant_paye || 0,
    date_paiement: date_paiement || null,
    date_echeance: new Date(annee, mois - 1, 5), // le 5 du mois
    note:          note || '',
  });

  // Calcul statut (même logique que paiementService.update)
  if (statut_force) {
    paiement.statut = statut_force;
  } else if (paiement.montant_paye <= 0) {
    paiement.statut = 'impaye';
  } else if (paiement.montant_paye >= paiement.montant_du) {
    paiement.statut = 'paye';
  } else {
    paiement.statut = 'partiel';
  }

  await paiement.save();
  return paiement;
};

// ============================================================
// SEED PRINCIPAL
// ============================================================
const seedAll = async () => {
  try {
    console.log(' MONGO_URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,        
      useFindAndModify: false,  
    });
    console.log(' MongoDB connecté\n');

    // Suppression dans le bon ordre (références)
    await Paiement.deleteMany({});
    await Location.deleteMany({});
    await Boutique.deleteMany({});
    await Emplacement.deleteMany({});
    await SousCategorie.deleteMany({});
    await Categorie.deleteMany({});
    await Zone.deleteMany({});
    console.log('Anciennes données supprimées\n');

    // ──────────────────────────────────────────────────────
    // 1. ZONES
    // ──────────────────────────────────────────────────────
    const zones = await Zone.insertMany(zonesInitiales);
    const zoneMap = {};
    zones.forEach((z) => (zoneMap[z.nom] = z._id));
    console.log(` ${zones.length} zone(s)\n`);

    // ──────────────────────────────────────────────────────
    // 2. EMPLACEMENTS (tous actif:true au départ)
    // G01 reste libre intentionnellement pour tester "disponible"
    // ──────────────────────────────────────────────────────
    const emplacementsData = [
      { numero_local: 'A12', type: 'box',    surface: 45, latitude: -18.9100, longitude: 47.5264, description: 'Box A12 – Galerie Analakely, rez-de-chaussée',         actif: true },
      { numero_local: 'B05', type: 'box',    surface: 60, latitude: -18.9086, longitude: 47.5292, description: 'Box B05 – Analakely Business Center, 1er étage',       actif: true },
      { numero_local: 'C03', type: 'box',    surface: 75, latitude: -18.9132, longitude: 47.5238, description: 'Box C03 – Centre Commercial Analakely, aile ouest',    actif: true },
      { numero_local: 'E11', type: 'box',    surface: 40, latitude: -18.9080, longitude: 47.5286, description: 'Box E11 – Analakely Shopping Park, niveau 1',          actif: true },
      { numero_local: 'F02', type: 'bureau', surface: 65, latitude: -18.9072, longitude: 47.5247, description: 'Bureau F02 – Analakely Tech Plaza, rez-de-chaussée',   actif: true },
      { numero_local: 'G01', type: 'box',    surface: 35, latitude: -18.9095, longitude: 47.5270, description: 'Box G01 – Galerie Analakely, niveau 2 (disponible)',   actif: true },
    ];
    const emplacements = await Emplacement.insertMany(emplacementsData);
    const empMap = {};
    emplacements.forEach((e) => (empMap[e.numero_local] = e));
    console.log(` ${emplacements.length} emplacement(s) (G01 libre)\n`);

    // ──────────────────────────────────────────────────────
    // 3. CATÉGORIES + SOUS-CATÉGORIES
    // ──────────────────────────────────────────────────────
    const categoriesData = [
      { nom: 'Vêtements',     description: 'Vêtements pour hommes, femmes et enfants, styles modernes et traditionnels, qualité supérieure' },
      { nom: 'Électronique',  description: 'Téléphones, ordinateurs, accessoires électroniques, dernières technologies' },
      { nom: 'Maison et Déco', description: 'Meubles, décoration intérieure, objets design pour embellir votre espace de vie' },
    ];
    const categories = [];
    for (const cat of categoriesData) categories.push(await new Categorie(cat).save());

    const sousCategoriesData = [
      { nom: 'Homme',       categorieId: categories[0]._id }, // 0
      { nom: 'Femme',       categorieId: categories[0]._id }, // 1
      { nom: 'Enfant',      categorieId: categories[0]._id }, // 2
      { nom: 'Tous',        categorieId: categories[0]._id }, // 3
      { nom: 'Téléphones',  categorieId: categories[1]._id }, // 4
      { nom: 'Ordinateurs', categorieId: categories[1]._id }, // 5
      { nom: 'Accessoires', categorieId: categories[1]._id }, // 6
      { nom: 'Meubles',     categorieId: categories[2]._id }, // 7
      { nom: 'Décoration',  categorieId: categories[2]._id }, // 8
      { nom: 'Cuisine',     categorieId: categories[2]._id }, // 9
    ];
    const sc = [];
    for (const s of sousCategoriesData) sc.push(await new SousCategorie(s).save());
    console.log(` ${categories.length} catégories / ${sc.length} sous-catégories\n`);

    console.log(' Création boutiques + contrats...\n');

    // ── Fashion Shop
    // Logique actuelle : 1 boutique = 1 contrat courant (unique:true)
    // Le contrat est créé directement avec les dates 2026 (contrat renouvelé)
    // Les paiements 2025 sont rattachés à ce même contrat avec montant_du: 450000
    // (loyer d'origine avant renouvellement) passé explicitement
    const { boutique: fashionBoutique, location: fashionLoc } = await creerBoutiqueAvecContrat({
      boutiqueData: {
        nom: 'Fashion Shop',
        description: 'Boutique de vêtements tendance pour hommes et femmes. Collection de saison avec styles variés et tissus de qualité pour tous les goûts.',
        logo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1200&h=300&fit=crop',
        gerant: { nom: 'Rakoto', prenom: 'Jean', email: 'jean@fashion.mg', telephone: '+261 34 12 345 67' },
        categorie: categories[0]._id,
        sous_categories: [sc[0]._id, sc[1]._id],
        contact: { telephone: '+261 34 12 345 67', email: 'contact@fashion.mg' },
        horaires: {
          lundi:    { ouvert: true,  debut: '09:00', fin: '18:00' },
          mardi:    { ouvert: true,  debut: '09:00', fin: '18:00' },
          mercredi: { ouvert: true,  debut: '09:00', fin: '18:00' },
          jeudi:    { ouvert: true,  debut: '09:00', fin: '18:00' },
          vendredi: { ouvert: true,  debut: '09:00', fin: '19:00' },
          samedi:   { ouvert: true,  debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' },
        },
        statut: { actif: true, en_attente_validation: false, suspendu: false, date_validation: new Date('2025-01-01') },
      },
      localisationRaw: {
        emplacement: empMap['A12']._id, numero: 'A12', surface: 45,
        latitude: -18.9100, longitude: 47.5264,
        adresse_complete: 'Galerie Analakely, Box A12, Antananarivo',
      },
      contrat: {
        loyer_mensuel: 450000,
        date_debut:    new Date('2025-01-01'),
        date_fin:      new Date('2026-12-01'),  
        statut:        'actif',
        notes:         'Bail annuel 2025. Historique résiliation à implémenter.',
      },
    });
    console.log(`    Fashion Shop — contrat 2025→2026\n`);

    // ── Tech Store
    const { boutique: techBoutique, location: techLoc } = await creerBoutiqueAvecContrat({
      boutiqueData: {
        nom: 'Tech Store',
        description: 'Vente de téléphones, tablettes et accessoires électroniques. Nous proposons les dernières marques avec garantie et service après-vente.',
        logo: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=300&fit=crop',
        gerant: { nom: 'Rabe', prenom: 'Sarah', email: 'sarah@tech.mg', telephone: '+261 33 11 222 33' },
        categorie: categories[1]._id,
        sous_categories: [sc[4]._id, sc[6]._id],
        contact: { telephone: '+261 33 11 222 33', email: 'info@tech.mg' },
        horaires: {
          lundi:    { ouvert: true, debut: '09:00', fin: '19:00' },
          mardi:    { ouvert: true, debut: '09:00', fin: '19:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          jeudi:    { ouvert: true, debut: '09:00', fin: '19:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '20:00' },
          samedi:   { ouvert: true, debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: true, debut: '10:00', fin: '17:00' },
        },
        statut: { actif: true, en_attente_validation: false, suspendu: false, date_validation: new Date('2025-01-01') },
      },
      localisationRaw: {
        emplacement: empMap['B05']._id, numero: 'B05', surface: 60,
        latitude: -18.9086, longitude: 47.5292,
        adresse_complete: 'Analakely Business Center, Box B05, Antananarivo',
      },
      contrat: {
        loyer_mensuel: 600000,
        date_debut: new Date('2025-01-01'),
        date_fin:   new Date('2026-02-28'), 
        notes: 'Bail annuel mars 2025. Expiré le 28/02/2026 — renouvellement en cours.',
      },
    });
    console.log(`   Tech Store — contrat expiré 28/02/2026\n`);

    // ── Home Decor
    const { boutique: homeBoutique, location: homeLoc } = await creerBoutiqueAvecContrat({
      boutiqueData: {
        nom: 'Home Decor',
        description: 'Meubles modernes et objets de décoration pour embellir votre maison. Design contemporain et matériaux de qualité pour un intérieur unique.',
        logo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1561773922-7b9a5d4d3c1b?w=1200&h=300&fit=crop',
        gerant: { nom: 'Razafy', prenom: 'Paul', email: 'paul@home.mg', telephone: '+261 32 44 555 66' },
        categorie: categories[2]._id,
        sous_categories: [sc[7]._id, sc[8]._id],
        contact: { telephone: '+261 32 44 555 66', email: 'contact@home.mg' },
        horaires: {
          lundi:    { ouvert: true,  debut: '09:00', fin: '17:30' },
          mardi:    { ouvert: true,  debut: '09:00', fin: '17:30' },
          mercredi: { ouvert: true,  debut: '09:00', fin: '17:30' },
          jeudi:    { ouvert: true,  debut: '09:00', fin: '17:30' },
          vendredi: { ouvert: true,  debut: '09:00', fin: '18:30' },
          samedi:   { ouvert: true,  debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' },
        },
        statut: { actif: true, en_attente_validation: false, suspendu: false, date_validation: new Date('2025-01-01') },
      },
      localisationRaw: {
        emplacement: empMap['C03']._id, numero: 'C03', surface: 75,
        latitude: -18.9132, longitude: 47.5238,
        adresse_complete: 'Centre Commercial Analakely, Box C03, Antananarivo',
      },
      contrat: {
        loyer_mensuel: 750000,
        date_debut: new Date('2025-01-01'),
        date_fin:   new Date('2026-12-31'), // ← ACTIF — bail 2 ans
        notes: 'Bail 2 ans ferme. Tarif préférentiel accordé pour durée longue.',
      },
    });
    console.log(`    Home Decor — contrat actif (2 ans)\n`);

    // ── Kids Fashion (contrat expiré, non renouvelé)
    const { boutique: kidsBoutique, location: kidsLoc } = await creerBoutiqueAvecContrat({
      boutiqueData: {
        nom: 'Kids Fashion',
        description: 'Vêtements colorés et confortables pour enfants de tous âges. Sélection de qualité pour habiller vos petits avec style et praticité.',
        logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=300&fit=crop',
        gerant: { nom: 'Randria', prenom: 'Sophie', email: 'sophie@kids.mg', telephone: '+261 33 66 777 88' },
        categorie: categories[0]._id,
        sous_categories: [sc[2]._id],
        contact: { telephone: '+261 33 66 777 88', email: 'contact@kids.mg' },
        horaires: {
          lundi:    { ouvert: true, debut: '09:00', fin: '19:00' },
          mardi:    { ouvert: true, debut: '09:00', fin: '19:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          jeudi:    { ouvert: true, debut: '09:00', fin: '19:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '20:00' },
          samedi:   { ouvert: true, debut: '09:00', fin: '20:00' },
          dimanche: { ouvert: true, debut: '10:00', fin: '18:00' },
        },
        statut: { actif: true, en_attente_validation: false, suspendu: false, date_validation: new Date('2025-01-01') },
      },
      localisationRaw: {
        emplacement: empMap['E11']._id, numero: 'E11', surface: 40,
        latitude: -18.9080, longitude: 47.5286,
        adresse_complete: 'Analakely Shopping Park, Box E11, Antananarivo',
      },
      contrat: {
        loyer_mensuel: 400000,
        date_debut: new Date('2025-01-01'),
        date_fin:   new Date('2025-12-31'),
        notes: 'Bail 2025 expiré. Gérant en situation de loyers impayés en fin d\'année.',
      },
    });
    console.log(`    Kids Fashion — contrat expiré, non renouvelé\n`);

    // ── Computer World
    const { boutique: compBoutique, location: compLoc } = await creerBoutiqueAvecContrat({
      boutiqueData: {
        nom: 'Computer World',
        description: 'Ordinateurs portables, de bureau et accessoires informatiques. Nous conseillons et fournissons le matériel adapté à vos besoins professionnels.',
        logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=300&fit=crop',
        gerant: { nom: 'Razafy', prenom: 'Marc', email: 'marc@computer.mg', telephone: '+261 33 22 333 44' },
        categorie: categories[1]._id,
        sous_categories: [sc[5]._id],
        contact: { telephone: '+261 33 22 333 44', email: 'info@computer.mg' },
        horaires: {
          lundi:    { ouvert: true,  debut: '08:00', fin: '17:00' },
          mardi:    { ouvert: true,  debut: '08:00', fin: '17:00' },
          mercredi: { ouvert: true,  debut: '08:00', fin: '17:00' },
          jeudi:    { ouvert: true,  debut: '08:00', fin: '17:00' },
          vendredi: { ouvert: true,  debut: '08:00', fin: '16:00' },
          samedi:   { ouvert: false, debut: '00:00', fin: '00:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' },
        },
        statut: { actif: true, en_attente_validation: false, suspendu: false, date_validation: new Date('2025-01-01') },
      },
      localisationRaw: {
        emplacement: empMap['F02']._id, numero: 'F02', surface: 65,
        latitude: -18.9072, longitude: 47.5247,
        adresse_complete: 'Analakely Tech Plaza, Bureau F02, Antananarivo',
      },
      contrat: {
        loyer_mensuel: 715000,
        date_debut: new Date('2025-01-01'),
        date_fin:   new Date('2026-08-31'), // ← ACTIF
        notes: 'Bail annuel. Charges communes incluses. Début activité septembre 2025.',
      },
    });
    console.log(`    Computer World — contrat actif\n`);

    // ──────────────────────────────────────────────────────
    console.log(' Génération des paiements 2025...\n');

    let totalPaiements = 0;

    // ── Fashion Shop — paiements 2025 + jan/fév 2026
    // 1 seul contrat 450 000 Ar, montant_du identique sur toute la période
    const fashionPaiements = [
      { annee: 2025, mois:  1, montant_paye: 450000, date_paiement: new Date(2025,  0, 3),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  2, montant_paye: 450000, date_paiement: new Date(2025,  1, 4),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  3, montant_paye: 450000, date_paiement: new Date(2025,  2, 3),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  4, montant_paye: 450000, date_paiement: new Date(2025,  3, 4),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  5, montant_paye: 450000, date_paiement: new Date(2025,  4, 3),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  6, montant_paye: 450000, date_paiement: new Date(2025,  5, 3),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  7, montant_paye: 450000, date_paiement: new Date(2025,  6, 4),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  8, montant_paye: 450000, date_paiement: new Date(2025,  7, 3),  note: 'Paiement mensuel' },
      { annee: 2025, mois:  9, montant_paye: 450000, date_paiement: new Date(2025,  8, 4),  note: 'Paiement mensuel' },
      { annee: 2025, mois: 10, montant_paye: 225000, date_paiement: new Date(2025,  9, 5),  note: 'Paiement partiel — solde promis fin octobre' },
      { annee: 2025, mois: 11, montant_paye: 450000, date_paiement: new Date(2025, 10, 18), statut_force: 'en_retard', note: 'Paiement reçu avec 13 jours de retard' },
      { annee: 2025, mois: 12, montant_paye: 0,      date_paiement: null,                   note: 'Impayé déc 2025 — à régulariser' },
      { annee: 2026, mois:  1, montant_paye: 450000, date_paiement: new Date(2026,  0, 4),  note: 'Paiement janvier 2026' },
      { annee: 2026, mois:  2, montant_paye: 450000, date_paiement: new Date(2026,  1, 3),  note: 'Paiement février 2026' },
      { annee: 2026, mois:  3, montant_paye: 0,      date_paiement: null,                   note: 'Mars 2026 — dû le 05/03, pas encore réglé' },
    ];
    for (const p of fashionPaiements) {
      await creerPaiement({ location: fashionLoc, ...p });
      totalPaiements++;
    }
    console.log(`    Fashion Shop — ${fashionPaiements.length} paiements`);

    // ── Tech Store (mar→déc 2025)
    const techPaiements = [
      { mois: 3,  montant_paye: 600000, date_paiement: new Date(2025, 2, 4),  note: 'Ouverture boutique — premier loyer' },
      { mois: 4,  montant_paye: 600000, date_paiement: new Date(2025, 3, 3),  note: 'Paiement mensuel' },
      { mois: 5,  montant_paye: 600000, date_paiement: new Date(2025, 4, 5),  note: 'Paiement mensuel' },
      { mois: 6,  montant_paye: 600000, date_paiement: new Date(2025, 5, 3),  note: 'Paiement mensuel' },
      { mois: 7,  montant_paye: 600000, date_paiement: new Date(2025, 6, 4),  note: 'Paiement mensuel' },
      { mois: 8,  montant_paye: 600000, date_paiement: new Date(2025, 7, 3),  note: 'Paiement mensuel' },
      { mois: 9,  montant_paye: 300000, date_paiement: new Date(2025, 8, 5),  note: 'Paiement partiel — stock immobilisé ce mois' },
      { mois: 10, montant_paye: 600000, date_paiement: new Date(2025, 9, 4),  note: 'Paiement mensuel + solde septembre' },
      { mois: 11, montant_paye: 600000, date_paiement: new Date(2025, 10, 3), note: 'Paiement mensuel' },
      { mois: 12, montant_paye: 0,      date_paiement: null,                   note: 'Impayé — contrat expirant, renouvellement en négociation' },
    ];
    for (const p of techPaiements) {
      await creerPaiement({ location: techLoc, annee: 2025, ...p });
      totalPaiements++;
    }
    // Tech Store : mars 2026 pas encore réglé (contrat expiré)
    await creerPaiement({ location: techLoc, annee: 2026, mois: 1, montant_paye: 0, note: 'Contrat expiré — janvier 2026 impayé' });
    await creerPaiement({ location: techLoc, annee: 2026, mois: 2, montant_paye: 0, note: 'Contrat expiré — février 2026 impayé' });
    totalPaiements += 2;
    console.log(`    Tech Store — ${techPaiements.length + 2} paiements`);

    // ── Home Decor (juin→déc 2025) — bon payeur
    const homePaiements = [
      { mois: 6,  montant_paye: 750000, date_paiement: new Date(2025, 5, 2),  note: 'Premier loyer — bail 2 ans' },
      { mois: 7,  montant_paye: 750000, date_paiement: new Date(2025, 6, 3),  note: 'Paiement mensuel' },
      { mois: 8,  montant_paye: 750000, date_paiement: new Date(2025, 7, 4),  note: 'Paiement mensuel' },
      { mois: 9,  montant_paye: 750000, date_paiement: new Date(2025, 8, 3),  note: 'Paiement mensuel' },
      { mois: 10, montant_paye: 750000, date_paiement: new Date(2025, 9, 2),  note: 'Paiement mensuel' },
      { mois: 11, montant_paye: 750000, date_paiement: new Date(2025, 10, 3), note: 'Paiement mensuel' },
      { mois: 12, montant_paye: 750000, date_paiement: new Date(2025, 11, 3), note: 'Paiement mensuel' },
      { mois: 1,  montant_paye: 750000, date_paiement: new Date(2026, 0, 2),  note: 'Paiement janvier 2026 — anticipé' },
      { mois: 2,  montant_paye: 750000, date_paiement: new Date(2026, 1, 3),  note: 'Paiement février 2026' },
      { mois: 3,  montant_paye: 0,      date_paiement: null,                   note: 'Mars 2026 — non encore payé (dû le 05/03)' },
    ];
    for (const p of homePaiements) {
      const annee = p.mois >= 6 && p.mois <= 12 ? 2025 : 2026; // juin-déc → 2025, jan+ → 2026
      await creerPaiement({ location: homeLoc, annee, ...p });
      totalPaiements++;
    }
    console.log(`    Home Decor — ${homePaiements.length} paiements`);

    // ── Kids Fashion (jan→déc 2025) — difficultés en fin d'année
    const kidsPaiements = [
      { mois: 1,  montant_paye: 400000, date_paiement: new Date(2025, 0, 4),  note: 'Paiement mensuel' },
      { mois: 2,  montant_paye: 400000, date_paiement: new Date(2025, 1, 3),  note: 'Paiement mensuel' },
      { mois: 3,  montant_paye: 400000, date_paiement: new Date(2025, 2, 5),  note: 'Paiement mensuel' },
      { mois: 4,  montant_paye: 400000, date_paiement: new Date(2025, 3, 3),  note: 'Paiement mensuel' },
      { mois: 5,  montant_paye: 400000, date_paiement: new Date(2025, 4, 4),  note: 'Paiement mensuel' },
      { mois: 6,  montant_paye: 400000, date_paiement: new Date(2025, 5, 3),  note: 'Paiement mensuel' },
      { mois: 7,  montant_paye: 400000, date_paiement: new Date(2025, 6, 5),  note: 'Paiement mensuel' },
      { mois: 8,  montant_paye: 200000, date_paiement: new Date(2025, 7, 5),  note: 'Paiement partiel — rentrée scolaire difficile ce mois' },
      { mois: 9,  montant_paye: 0,      date_paiement: null,                   note: 'Impayé — début de difficultés de trésorerie' },
      { mois: 10, montant_paye: 0,      date_paiement: null,                   note: 'Impayé — mise en demeure envoyée' },
      { mois: 11, montant_paye: 400000, date_paiement: new Date(2025, 10, 20), statut_force: 'en_retard', note: 'Paiement novembre rattrapé avec 15 jours de retard' },
      { mois: 12, montant_paye: 0,      date_paiement: null,                   note: 'Impayé — contrat expiré, non renouvelé' },
    ];
    for (const p of kidsPaiements) {
      await creerPaiement({ location: kidsLoc, annee: 2025, ...p });
      totalPaiements++;
    }
    console.log(`    Kids Fashion — ${kidsPaiements.length} paiements`);

    // ── Computer World (sep→déc 2025 + jan-fév 2026) — nouveau locataire sérieux
    const compPaiements = [
      { mois: 9,  annee: 2025, montant_paye: 715000, date_paiement: new Date(2025, 8, 1),  note: 'Ouverture — premier loyer payé à l\'avance' },
      { mois: 10, annee: 2025, montant_paye: 715000, date_paiement: new Date(2025, 9, 3),  note: 'Paiement mensuel' },
      { mois: 11, annee: 2025, montant_paye: 715000, date_paiement: new Date(2025, 10, 4), note: 'Paiement mensuel' },
      { mois: 12, annee: 2025, montant_paye: 715000, date_paiement: new Date(2025, 11, 3), note: 'Paiement mensuel' },
      { mois: 1,  annee: 2026, montant_paye: 715000, date_paiement: new Date(2026, 0, 3),  note: 'Paiement janvier 2026' },
      { mois: 2,  annee: 2026, montant_paye: 715000, date_paiement: new Date(2026, 1, 3),  note: 'Paiement février 2026' },
      { mois: 3,  annee: 2026, montant_paye: 0,      date_paiement: null,                   note: 'Mars 2026 — pas encore payé (dû le 05/03)' },
    ];
    for (const p of compPaiements) {
      await creerPaiement({ location: compLoc, ...p });
      totalPaiements++;
    }
    console.log(`    Computer World — ${compPaiements.length} paiements`);

    // ──────────────────────────────────────────────────────
    // RÉSUMÉ FINAL
    // ──────────────────────────────────────────────────────
    const allPaiements = await Paiement.find();
    const stats = {
      payes:    allPaiements.filter(p => p.statut === 'paye').length,
      partiels: allPaiements.filter(p => p.statut === 'partiel').length,
      retard:   allPaiements.filter(p => p.statut === 'en_retard').length,
      impayes:  allPaiements.filter(p => p.statut === 'impaye').length,
      ca_percu: allPaiements.reduce((s, p) => s + p.montant_paye, 0),
      ca_du:    allPaiements.reduce((s, p) => s + p.montant_du, 0),
    };

    const allLocations = await Location.find();
    const locsActives  = allLocations.filter(l => l.statut === 'actif').length;
    const locsExpirees = allLocations.filter(l => l.statut === 'expire').length;

    console.log('\n' + '═'.repeat(62));
    console.log(' SEED TERMINÉ — données prêtes pour test au 03/03/2026');
    console.log('═'.repeat(62));
    console.log(`\n Emplacements    : ${emplacements.length} (1 libre: G01)`);
    console.log(` Locations       : ${allLocations.length} total — ${locsActives} actives / ${locsExpirees} expirées`);
    console.log(` Paiements       : ${allPaiements.length} total`);
    console.log(`    Payés         : ${stats.payes}`);
    console.log(`   ◑  Partiels      : ${stats.partiels}`);
    console.log(`     En retard     : ${stats.retard}`);
    console.log(`    Impayés       : ${stats.impayes}`);
    console.log(`\n CA dû total     : ${stats.ca_du.toLocaleString('fr-FR')} Ar`);
    console.log(` CA perçu total  : ${stats.ca_percu.toLocaleString('fr-FR')} Ar`);
    console.log(` Reste à percevoir: ${(stats.ca_du - stats.ca_percu).toLocaleString('fr-FR')} Ar`);
    console.log('\n' + '═'.repeat(62));

    // process.exit(0);
  } catch (error) {
    console.error(' Erreur:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach((k) => {
        console.error(`   - ${k}: ${error.errors[k].message}`);
      });
    }
    process.exit(1);
  }
};

module.exports = seedAll;