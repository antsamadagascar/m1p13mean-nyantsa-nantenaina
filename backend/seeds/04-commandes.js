// ============================================
// SEED MULTI-BOUTIQUES 2025
// Basé sur le script seed-commandes.js qui fonctionne
// Usage: node seed-multi-boutiques.js
// ============================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const USER_ID = '6995dada5aced2ae718e7df9'; // admin@citymall.mg
const ZONE_ID = '6995dad86dfefeae4a066c74'; // Analakely

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✓ MongoDB connecté'))
  .catch(err => { console.error(err); process.exit(1); });

// ============================================
// SCHEMAS (minimal, insertion directe)
// ============================================
function makeSlug(nom) {
  return nom.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    + '-' + Math.floor(Math.random() * 9999);
}

const produitSchema = new mongoose.Schema({
  boutique:    mongoose.Schema.Types.ObjectId,
  nom: String, prix: Number, sku: String, slug: String,
  description: { type: String, default: 'Produit seed' },
  description_courte: { type: String, default: '' },
  reference:   String,
  statut:      { type: String, default: 'ACTIF' },
  quantite:    { type: Number, default: 20 },
  stock:       { type: Number, default: 20 },
}, { timestamps: true });

const commandeSchema = new mongoose.Schema({
  utilisateur: mongoose.Schema.Types.ObjectId,
  panier:      { type: mongoose.Schema.Types.ObjectId, default: null },
  articles: [{
    produit:             mongoose.Schema.Types.ObjectId,
    variante:            { type: mongoose.Schema.Types.ObjectId, default: null },
    nom_produit:         String, sku: String,
    quantite:            Number,
    prix_unitaire:       Number,
    prix_promo_unitaire: { type: Number, default: null }
  }],
  adresse_livraison: {
    nom: String, telephone: String, adresse: String, ville: String,
    zone: mongoose.Schema.Types.ObjectId
  },
  sous_total:      Number,
  total_remise:    { type: Number, default: 0 },
  total:           Number,
  statut:          { type: String, enum: ['EN_ATTENTE','EN_COURS','LIVREE','ANNULEE'] },
  statut_paiement: { type: String, enum: ['IMPAYE','PAYE'] },
  reference:       { type: String, unique: true },
  date_paiement:   { type: Date, default: null },
  date_livraison:  { type: Date, default: null },
  date_annulation: { type: Date, default: null },
}, { timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' } });

const Produit  = mongoose.models.Produit  || mongoose.model('Produit',  produitSchema);
const Commande = mongoose.models.Commande || mongoose.model('Commande', commandeSchema);

// ============================================
// DÉFINITION DES 4 BOUTIQUES
// ============================================
const BOUTIQUES = [

  // ── BOUTIQUE 1 : Home Decor (produits existants) ──────────────────────
  {
    id:  '699c986b3144c93ca161b8a5',
    nom: 'Home Decor',
    produits: [
      { _id: '699c98e0358398401af71a52', nom: "Canapé d'angle Scandi 5 places", prix: 1850000, sku: 'MBL-CAN-001' },
      { _id: '699c98e0358398401af71a5f', nom: 'Lampe sur pied Arc Design',       prix:  320000, sku: 'MBL-LAM-002' },
      { _id: '699c98e0358398401af71a59', nom: 'Table basse en chêne massif',     prix:  450000, sku: 'MBL-TAB-003' },
      { _id: '699c98e0358398401af71a64', nom: 'Tapis berbère 200x300cm',         prix:  680000, sku: 'MBL-TAP-004' },
    ],
    // Profil : meubles haut de gamme, peu de commandes, gros montants
    commandes: [
      { mois:1,  jour:8,  p:[0],    s:'LIVREE'   },
      { mois:1,  jour:20, p:[1,2],  s:'LIVREE'   },
      { mois:2,  jour:5,  p:[0,3],  s:'LIVREE'   },
      { mois:2,  jour:18, p:[2],    s:'LIVREE'   },
      { mois:3,  jour:3,  p:[0,1],  s:'LIVREE'   },
      { mois:3,  jour:15, p:[3],    s:'LIVREE'   },
      { mois:3,  jour:28, p:[2],    s:'EN_COURS' },
      { mois:4,  jour:10, p:[1,3],  s:'LIVREE'   },
      { mois:4,  jour:22, p:[0],    s:'LIVREE'   },
      { mois:5,  jour:6,  p:[2,3],  s:'LIVREE'   },
      { mois:5,  jour:19, p:[0,1],  s:'LIVREE'   },
      { mois:6,  jour:4,  p:[3],    s:'LIVREE'   },
      { mois:6,  jour:17, p:[0,2],  s:'LIVREE'   },
      { mois:7,  jour:9,  p:[1],    s:'LIVREE'   },
      { mois:7,  jour:23, p:[0],    s:'EN_COURS' },
      { mois:8,  jour:5,  p:[2],    s:'LIVREE'   },
      { mois:8,  jour:19, p:[0,1],  s:'LIVREE'   },
      { mois:9,  jour:3,  p:[3],    s:'LIVREE'   },
      { mois:9,  jour:16, p:[0,2],  s:'LIVREE'   },
      { mois:10, jour:7,  p:[1,3],  s:'LIVREE'   },
      { mois:10, jour:21, p:[0],    s:'LIVREE'   },
      { mois:11, jour:4,  p:[2,3],  s:'LIVREE'   },
      { mois:11, jour:18, p:[0,1],  s:'LIVREE'   },
      { mois:12, jour:3,  p:[3],    s:'LIVREE'   },
      { mois:12, jour:20, p:[0,2],  s:'EN_COURS' },
    ]
  },

  // ── BOUTIQUE 2 : Fashion Shop (1 produit existant + 3 à créer) ────────
  {
    id:  '699c986b3144c93ca161b8a1',
    nom: 'Fashion Shop',
    produits: [
      { _id: '699c3adf6f3fe18543108897', nom: 'Robe de soirée élégante',     prix: 185000, sku: 'VET-ROB-001' },
      { nom: 'Veste en cuir homme',                                            prix: 320000, sku: 'VET-VES-002' },
      { nom: 'Sac à main en cuir véritable',                                   prix: 250000, sku: 'VET-SAC-003' },
      { nom: 'Chaussures escarpins talons',                                     prix: 145000, sku: 'VET-CHA-004' },
    ],
    // Profil : mode, volume élevé, saisonnier (pic été + fin d'année)
    commandes: [
      { mois:1,  jour:3,  p:[0,1],    s:'LIVREE'   },
      { mois:1,  jour:10, p:[2],      s:'LIVREE'   },
      { mois:1,  jour:18, p:[0,3],    s:'LIVREE'   },
      { mois:1,  jour:25, p:[1,2],    s:'LIVREE'   },
      { mois:2,  jour:4,  p:[0],      s:'LIVREE'   },
      { mois:2,  jour:12, p:[1,3],    s:'LIVREE'   },
      { mois:2,  jour:20, p:[2],      s:'LIVREE'   },
      { mois:2,  jour:26, p:[0,1],    s:'EN_COURS' },
      { mois:3,  jour:5,  p:[3],      s:'LIVREE'   },
      { mois:3,  jour:13, p:[0,2],    s:'LIVREE'   },
      { mois:3,  jour:21, p:[1],      s:'LIVREE'   },
      { mois:3,  jour:28, p:[2,3],    s:'LIVREE'   },
      { mois:4,  jour:2,  p:[0,1],    s:'LIVREE'   },
      { mois:4,  jour:11, p:[2],      s:'LIVREE'   },
      { mois:4,  jour:19, p:[0,3],    s:'LIVREE'   },
      { mois:4,  jour:27, p:[1,2],    s:'EN_COURS' },
      { mois:5,  jour:5,  p:[0],      s:'LIVREE'   },
      { mois:5,  jour:14, p:[1,3],    s:'LIVREE'   },
      { mois:5,  jour:22, p:[2,0],    s:'LIVREE'   },
      { mois:6,  jour:3,  p:[1],      s:'LIVREE'   },
      { mois:6,  jour:12, p:[0,2,3],  s:'LIVREE'   },
      { mois:6,  jour:24, p:[1,2],    s:'LIVREE'   },
      { mois:7,  jour:4,  p:[0,3],    s:'LIVREE'   },
      { mois:7,  jour:15, p:[2],      s:'LIVREE'   },
      { mois:7,  jour:25, p:[0,1],    s:'EN_COURS' },
      { mois:8,  jour:6,  p:[2,3],    s:'LIVREE'   },
      { mois:8,  jour:16, p:[0],      s:'LIVREE'   },
      { mois:8,  jour:26, p:[1,2],    s:'LIVREE'   },
      { mois:9,  jour:5,  p:[0,3],    s:'LIVREE'   },
      { mois:9,  jour:15, p:[2],      s:'LIVREE'   },
      { mois:9,  jour:25, p:[0,1,3],  s:'LIVREE'   },
      { mois:10, jour:3,  p:[2],      s:'LIVREE'   },
      { mois:10, jour:13, p:[0,1],    s:'LIVREE'   },
      { mois:10, jour:23, p:[3],      s:'EN_COURS' },
      { mois:11, jour:5,  p:[0,2],    s:'LIVREE'   },
      { mois:11, jour:15, p:[1,3],    s:'LIVREE'   },
      { mois:11, jour:25, p:[0,2],    s:'LIVREE'   },
      { mois:12, jour:5,  p:[1,3],    s:'LIVREE'   },
      { mois:12, jour:15, p:[0,2,3],  s:'LIVREE'   },
      { mois:12, jour:24, p:[1],      s:'EN_COURS' },
    ]
  },

  // ── BOUTIQUE 3 : Tech Store (tous produits à créer) ──────────────────
  {
    id:  '699c986b3144c93ca161b8a3',
    nom: 'Tech Store',
    produits: [
      { nom: 'Smartphone Android 128Go',  prix: 950000, sku: 'TEC-PHO-001' },
      { nom: 'Écouteurs Bluetooth Pro',   prix: 180000, sku: 'TEC-ECO-002' },
      { nom: 'Tablette 10 pouces WiFi',   prix: 650000, sku: 'TEC-TAB-003' },
      { nom: 'Chargeur rapide 65W USB-C', prix:  85000, sku: 'TEC-CHA-004' },
    ],
    // Profil : tech, pic Black Friday + Noël, commandes régulières
    commandes: [
      { mois:1,  jour:5,  p:[1,3],    s:'LIVREE'   },
      { mois:1,  jour:15, p:[0],      s:'LIVREE'   },
      { mois:1,  jour:25, p:[2,3],    s:'LIVREE'   },
      { mois:2,  jour:8,  p:[1],      s:'LIVREE'   },
      { mois:2,  jour:20, p:[0,3],    s:'LIVREE'   },
      { mois:3,  jour:5,  p:[2],      s:'LIVREE'   },
      { mois:3,  jour:18, p:[0,1,3],  s:'LIVREE'   },
      { mois:3,  jour:28, p:[1],      s:'EN_COURS' },
      { mois:4,  jour:6,  p:[0,2],    s:'LIVREE'   },
      { mois:4,  jour:18, p:[3],      s:'LIVREE'   },
      { mois:4,  jour:28, p:[0,1],    s:'LIVREE'   },
      { mois:5,  jour:7,  p:[2,3],    s:'LIVREE'   },
      { mois:5,  jour:19, p:[0],      s:'LIVREE'   },
      { mois:5,  jour:29, p:[1,3],    s:'EN_COURS' },
      { mois:6,  jour:8,  p:[0,2],    s:'LIVREE'   },
      { mois:6,  jour:20, p:[1],      s:'LIVREE'   },
      { mois:6,  jour:28, p:[0,3],    s:'LIVREE'   },
      { mois:7,  jour:5,  p:[2,3],    s:'LIVREE'   },
      { mois:7,  jour:17, p:[0,1],    s:'LIVREE'   },
      { mois:7,  jour:27, p:[3],      s:'EN_COURS' },
      { mois:8,  jour:6,  p:[0,2],    s:'LIVREE'   },
      { mois:8,  jour:18, p:[1,3],    s:'LIVREE'   },
      { mois:8,  jour:28, p:[0],      s:'LIVREE'   },
      { mois:9,  jour:7,  p:[2,3],    s:'LIVREE'   },
      { mois:9,  jour:19, p:[0,1],    s:'LIVREE'   },
      { mois:9,  jour:28, p:[2],      s:'LIVREE'   },
      { mois:10, jour:5,  p:[0,1,3],  s:'LIVREE'   },
      { mois:10, jour:17, p:[2],      s:'LIVREE'   },
      { mois:10, jour:27, p:[0,3],    s:'EN_COURS' },
      { mois:11, jour:5,  p:[1,2],    s:'LIVREE'   },
      { mois:11, jour:15, p:[0,3],    s:'LIVREE'   },
      { mois:11, jour:25, p:[0,1,2],  s:'LIVREE'   }, // Black Friday
      { mois:12, jour:5,  p:[3],      s:'LIVREE'   },
      { mois:12, jour:15, p:[0,1],    s:'LIVREE'   },
      { mois:12, jour:20, p:[0,2,3],  s:'LIVREE'   }, // Noël
      { mois:12, jour:26, p:[1,3],    s:'EN_COURS' },
    ]
  },

  // ── BOUTIQUE 4 : Kids Fashion (tous produits à créer) ────────────────
  {
    id:  '699c986b3144c93ca161b8a7',
    nom: 'Kids Fashion',
    produits: [
      { nom: 'Ensemble pyjama enfant coton', prix:  45000, sku: 'KID-PYJ-001' },
      { nom: 'Veste imperméable garçon',     prix:  95000, sku: 'KID-VES-002' },
      { nom: 'Robe été fille fleurie',       prix:  65000, sku: 'KID-ROB-003' },
      { nom: 'Basket enfant sport',          prix:  85000, sku: 'KID-BAS-004' },
    ],
    // Profil : enfants, très haute fréquence, petits montants
    commandes: [
      { mois:1,  jour:4,  p:[0,1],    s:'LIVREE'   },
      { mois:1,  jour:11, p:[2,3],    s:'LIVREE'   },
      { mois:1,  jour:18, p:[0],      s:'LIVREE'   },
      { mois:1,  jour:25, p:[1,2],    s:'LIVREE'   },
      { mois:2,  jour:3,  p:[3],      s:'LIVREE'   },
      { mois:2,  jour:10, p:[0,2],    s:'LIVREE'   },
      { mois:2,  jour:17, p:[1],      s:'LIVREE'   },
      { mois:2,  jour:24, p:[2,3],    s:'EN_COURS' },
      { mois:3,  jour:4,  p:[0,1],    s:'LIVREE'   },
      { mois:3,  jour:11, p:[2],      s:'LIVREE'   },
      { mois:3,  jour:18, p:[0,3],    s:'LIVREE'   },
      { mois:3,  jour:25, p:[1,2],    s:'LIVREE'   },
      { mois:4,  jour:3,  p:[3],      s:'LIVREE'   },
      { mois:4,  jour:10, p:[0,2],    s:'LIVREE'   },
      { mois:4,  jour:17, p:[1,3],    s:'LIVREE'   },
      { mois:4,  jour:24, p:[0],      s:'EN_COURS' },
      { mois:5,  jour:5,  p:[2,3],    s:'LIVREE'   },
      { mois:5,  jour:12, p:[0,1],    s:'LIVREE'   },
      { mois:5,  jour:20, p:[2],      s:'LIVREE'   },
      { mois:5,  jour:27, p:[1,3],    s:'LIVREE'   },
      { mois:6,  jour:4,  p:[0,2],    s:'LIVREE'   },
      { mois:6,  jour:12, p:[3],      s:'LIVREE'   },
      { mois:6,  jour:20, p:[0,1],    s:'LIVREE'   },
      { mois:6,  jour:27, p:[2,3],    s:'EN_COURS' },
      { mois:7,  jour:5,  p:[0],      s:'LIVREE'   },
      { mois:7,  jour:14, p:[1,2],    s:'LIVREE'   },
      { mois:7,  jour:22, p:[3],      s:'LIVREE'   },
      { mois:8,  jour:4,  p:[0,1],    s:'LIVREE'   },
      { mois:8,  jour:13, p:[2,3],    s:'LIVREE'   },
      { mois:8,  jour:22, p:[0],      s:'LIVREE'   },
      { mois:9,  jour:3,  p:[1,2],    s:'LIVREE'   },
      { mois:9,  jour:12, p:[0,3],    s:'LIVREE'   },
      { mois:9,  jour:22, p:[2],      s:'EN_COURS' },
      { mois:10, jour:3,  p:[0,1,3],  s:'LIVREE'   },
      { mois:10, jour:13, p:[2],      s:'LIVREE'   },
      { mois:10, jour:23, p:[0,1],    s:'LIVREE'   },
      { mois:11, jour:4,  p:[2,3],    s:'LIVREE'   },
      { mois:11, jour:14, p:[0],      s:'LIVREE'   },
      { mois:11, jour:24, p:[1,2,3],  s:'LIVREE'   },
      { mois:12, jour:5,  p:[0,1],    s:'LIVREE'   },
      { mois:12, jour:14, p:[2,3],    s:'LIVREE'   },
      { mois:12, jour:22, p:[0,1,2],  s:'LIVREE'   }, // Fêtes
      { mois:12, jour:28, p:[3],      s:'EN_COURS' },
    ]
  }
];

// ============================================
// SEED PRINCIPAL
// ============================================
async function seed() {
  try {
    const moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    let totalCommandes = 0;
    let totalCAGlobal  = 0;

    for (const boutique of BOUTIQUES) {
      console.log(`\n${'─'.repeat(55)}`);
      console.log(`📦 ${boutique.nom} (${boutique.id})`);
      console.log('─'.repeat(55));

      // ── Étape 1 : résoudre les IDs produits ──
      const produitsResolus = [];
      for (const p of boutique.produits) {
        if (p._id) {
          // Produit existant — on utilise directement l'ID
          produitsResolus.push({
            _id:  new mongoose.Types.ObjectId(p._id),
            nom:  p.nom,
            prix: p.prix,
            sku:  p.sku
          });
          console.log(`  ✓ Produit existant : ${p.nom}`);
        } else {
          // Produit à créer
          const existing = await Produit.findOne({ sku: p.sku });
          if (existing) {
            produitsResolus.push({ _id: existing._id, nom: p.nom, prix: p.prix, sku: p.sku });
            console.log(`  ~ Produit déjà créé : ${p.nom}`);
          } else {
            const nouveau = await Produit.create({
              boutique: new mongoose.Types.ObjectId(boutique.id),
              nom:  p.nom,
              prix: p.prix,
              sku:  p.sku,
              slug: makeSlug(p.nom),
              reference: p.sku
            });
            produitsResolus.push({ _id: nouveau._id, nom: p.nom, prix: p.prix, sku: p.sku });
            console.log(`  + Produit créé      : ${p.nom}`);
          }
        }
      }

      // ── Étape 2 : générer les commandes ──
      const docs = boutique.commandes.map(cmd => {
        const articlesCmd = cmd.p.map(idx => ({
          produit:             produitsResolus[idx]._id,
          variante:            null,
          nom_produit:         produitsResolus[idx].nom,
          sku:                 produitsResolus[idx].sku,
          quantite:            1,
          prix_unitaire:       produitsResolus[idx].prix,
          prix_promo_unitaire: null
        }));
        const total = articlesCmd.reduce((s, a) => s + a.prix_unitaire, 0);
        const date  = new Date(2025, cmd.mois - 1, cmd.jour, 10, 0, 0);
        return {
          utilisateur:  new mongoose.Types.ObjectId(USER_ID),
          panier:       null,
          articles:     articlesCmd,
          adresse_livraison: {
            nom: 'Client Test', telephone: '0346849746',
            adresse: 'Lot Test Antananarivo', ville: 'Antananarivo',
            zone: new mongoose.Types.ObjectId(ZONE_ID)
          },
          sous_total:      total,
          total_remise:    0,
          total:           total,
          statut:          cmd.s,
          statut_paiement: cmd.s === 'LIVREE' ? 'PAYE' : 'IMPAYE',
          reference:       `SEED-${boutique.id.slice(-4)}-${cmd.mois}-${cmd.jour}-${Math.floor(Math.random()*99999)}`,
          date_creation:    date,
          date_modification: date,
          date_livraison:  cmd.s === 'LIVREE' ? date : null,
          date_paiement:   cmd.s === 'LIVREE' ? date : null,
          date_annulation: null,
        };
      });

      await Commande.collection.insertMany(docs);

      // ── Étape 3 : résumé par mois ──
      let caReel = 0, caPrev = 0;
      for (let m = 1; m <= 12; m++) {
        const cmdsMois = boutique.commandes.filter(c => c.mois === m);
        if (!cmdsMois.length) continue;
        const ca = cmdsMois.reduce((s, c) =>
          s + c.p.reduce((a, idx) => a + produitsResolus[idx].prix, 0), 0);
        const caReelMois = cmdsMois.filter(c => c.s === 'LIVREE')
          .reduce((s, c) => s + c.p.reduce((a, idx) => a + produitsResolus[idx].prix, 0), 0);
        console.log(`  ${moisNoms[m-1]} : ${cmdsMois.length} cmd — ${ca.toLocaleString()} Ar`);
        caReel += caReelMois;
        caPrev += ca - caReelMois;
      }

      console.log(`  ${'─'.repeat(45)}`);
      console.log(`  ✅ ${docs.length} commandes insérées`);
      console.log(`  💚 CA encaissé     : ${caReel.toLocaleString()} Ar`);
      console.log(`  🟠 CA prévisionnel : ${caPrev.toLocaleString()} Ar`);

      totalCommandes += docs.length;
      totalCAGlobal  += caReel;
    }

    console.log(`\n${'═'.repeat(55)}`);
    console.log(`  ✅ TOTAL : ${totalCommandes} commandes — 4 boutiques`);
    console.log(`  💰 CA global encaissé : ${totalCAGlobal.toLocaleString()} Ar`);
    console.log('═'.repeat(55));

  } catch (err) {
    console.error('\n❌ Erreur:', err.message);
    if (err.code === 11000) {
      console.error('   → Doublon détecté. Supprimez les seeds existants d\'abord :');
      console.error('   db.commandes.deleteMany({ reference: /^SEED-/ })');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Déconnecté');
  }
}

seed();