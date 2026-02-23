// ============================================
// SEED — Commandes de test 2025
// Usage: node seed-commandes.js
// ============================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const CONFIG = {
  BOUTIQUE_ID:    '6995dad86dfefeae4a066c94',
  UTILISATEUR_ID: '6995dadb5aced2ae718e7e0f',
  PRODUIT_IDS: [
    '6995db6fa5bac5b6688a54d3', // Canapé d'angle Scandi 5 places
    '6995db70a5bac5b6688a54e0', // Lampe sur pied Arc Design
    '6995db70a5bac5b6688a54da', // Table basse en chêne massif
  ],
  ZONE_ID: '6995dad86dfefeae4a066c74'
};

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✓ MongoDB connecté'))
  .catch(err => { console.error(err); process.exit(1); });

const commandeSchema = new mongoose.Schema({
  utilisateur:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  panier:       { type: mongoose.Schema.Types.ObjectId, ref: 'Panier', default: null },
  articles: [{
    produit:             { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
    variante:            { type: mongoose.Schema.Types.ObjectId, default: null },
    nom_produit:         String,
    sku:                 String,
    quantite:            Number,
    prix_unitaire:       Number,
    prix_promo_unitaire: { type: Number, default: null }
  }],
  adresse_livraison: {
    nom: String, telephone: String, adresse: String, ville: String,
    zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', default: null }
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

const Commande = mongoose.models.Commande || mongoose.model('Commande', commandeSchema);

const produits = [
  { nom: "Canapé d'angle Scandi 5 places", prix: 1850000, sku: 'MBL-CAN-001' },
  { nom: 'Lampe sur pied Arc Design',       prix:  320000, sku: 'MBL-LAM-002' },
  { nom: 'Table basse en chêne massif',     prix:  750000, sku: 'MBL-TAB-003' },
];

const commandesData = [
  { mois: 1,  jour: 5,  articles: [0,2],    statut: 'LIVREE'   },
  { mois: 1,  jour: 12, articles: [1],       statut: 'LIVREE'   },
  { mois: 1,  jour: 20, articles: [0,1,2],  statut: 'LIVREE'   },
  { mois: 1,  jour: 28, articles: [2],       statut: 'EN_COURS' },
  { mois: 2,  jour: 3,  articles: [1],       statut: 'LIVREE'   },
  { mois: 2,  jour: 10, articles: [0,2],     statut: 'LIVREE'   },
  { mois: 2,  jour: 18, articles: [1,2],     statut: 'LIVREE'   },
  { mois: 3,  jour: 2,  articles: [0],       statut: 'LIVREE'   },
  { mois: 3,  jour: 9,  articles: [2,1],     statut: 'LIVREE'   },
  { mois: 3,  jour: 15, articles: [0,2],     statut: 'LIVREE'   },
  { mois: 3,  jour: 22, articles: [1],       statut: 'EN_COURS' },
  { mois: 3,  jour: 28, articles: [0,1,2],  statut: 'LIVREE'   },
  { mois: 4,  jour: 4,  articles: [0,1],     statut: 'LIVREE'   },
  { mois: 4,  jour: 14, articles: [2],       statut: 'LIVREE'   },
  { mois: 4,  jour: 25, articles: [0],       statut: 'LIVREE'   },
  { mois: 5,  jour: 1,  articles: [1,2],     statut: 'LIVREE'   },
  { mois: 5,  jour: 8,  articles: [0],       statut: 'LIVREE'   },
  { mois: 5,  jour: 16, articles: [0,1,2],  statut: 'LIVREE'   },
  { mois: 5,  jour: 24, articles: [2],       statut: 'EN_COURS' },
  { mois: 6,  jour: 3,  articles: [1],       statut: 'LIVREE'   },
  { mois: 6,  jour: 11, articles: [0,2],     statut: 'LIVREE'   },
  { mois: 6,  jour: 20, articles: [1,2],     statut: 'LIVREE'   },
  { mois: 6,  jour: 27, articles: [0],       statut: 'LIVREE'   },
  { mois: 7,  jour: 5,  articles: [0,1],     statut: 'LIVREE'   },
  { mois: 7,  jour: 13, articles: [2],       statut: 'LIVREE'   },
  { mois: 7,  jour: 19, articles: [0,2],     statut: 'LIVREE'   },
  { mois: 7,  jour: 26, articles: [1],       statut: 'EN_COURS' },
  { mois: 8,  jour: 2,  articles: [0],       statut: 'LIVREE'   },
  { mois: 8,  jour: 10, articles: [1,2],     statut: 'LIVREE'   },
  { mois: 8,  jour: 18, articles: [0,1],     statut: 'LIVREE'   },
  { mois: 8,  jour: 25, articles: [2],       statut: 'LIVREE'   },
  { mois: 9,  jour: 4,  articles: [0,1,2],  statut: 'LIVREE'   },
  { mois: 9,  jour: 12, articles: [1],       statut: 'LIVREE'   },
  { mois: 9,  jour: 20, articles: [0,2],     statut: 'EN_COURS' },
  { mois: 9,  jour: 28, articles: [2],       statut: 'LIVREE'   },
  { mois: 10, jour: 3,  articles: [0,1],     statut: 'LIVREE'   },
  { mois: 10, jour: 10, articles: [2],       statut: 'LIVREE'   },
  { mois: 10, jour: 17, articles: [0,1,2],  statut: 'LIVREE'   },
  { mois: 10, jour: 25, articles: [1],       statut: 'LIVREE'   },
  { mois: 11, jour: 4,  articles: [0,2],     statut: 'LIVREE'   },
  { mois: 11, jour: 11, articles: [1,2],     statut: 'LIVREE'   },
  { mois: 11, jour: 20, articles: [0],       statut: 'EN_COURS' },
  { mois: 11, jour: 27, articles: [0,1,2],  statut: 'LIVREE'   },
  { mois: 12, jour: 2,  articles: [0,1],     statut: 'LIVREE'   },
  { mois: 12, jour: 10, articles: [2],       statut: 'LIVREE'   },
  { mois: 12, jour: 18, articles: [0],       statut: 'LIVREE'   },
  { mois: 12, jour: 24, articles: [0,1,2],  statut: 'EN_COURS' },
];

async function seed() {
  try {
    const docs = commandesData.map(cmd => {
      const articlesCmd = cmd.articles.map(idx => ({
        produit:             new mongoose.Types.ObjectId(CONFIG.PRODUIT_IDS[idx]),
        variante:            null,
        nom_produit:         produits[idx].nom,
        sku:                 produits[idx].sku,
        quantite:            1,
        prix_unitaire:       produits[idx].prix,
        prix_promo_unitaire: null
      }));
      const total = articlesCmd.reduce((s, a) => s + a.prix_unitaire, 0);
      const date  = new Date(2025, cmd.mois - 1, cmd.jour, 10, 0, 0);
      return {
        utilisateur:  new mongoose.Types.ObjectId(CONFIG.UTILISATEUR_ID),
        panier:       null,
        articles:     articlesCmd,
        adresse_livraison: {
          nom: 'Client Test', telephone: '0346849746',
          adresse: 'Lot 123 Analakely', ville: 'Antananarivo',
          zone: new mongoose.Types.ObjectId(CONFIG.ZONE_ID)
        },
        sous_total:      total,
        total_remise:    0,
        total:           total,
        statut:          cmd.statut,
        statut_paiement: cmd.statut === 'LIVREE' ? 'PAYE' : 'IMPAYE',
        reference:       'SEED-' + cmd.mois + '-' + cmd.jour + '-' + Math.floor(Math.random() * 99999),
        date_creation:   date,
        date_modification: date,
        date_livraison:  cmd.statut === 'LIVREE' ? date : null,
        date_paiement:   cmd.statut === 'LIVREE' ? date : null,
        date_annulation: null,
      };
    });

    await Commande.collection.insertMany(docs);

    const moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    console.log(`\n✅ ${docs.length} commandes insérées !`);
    console.log('─'.repeat(45));
    let totalCA = 0;
    for (let m = 1; m <= 12; m++) {
      const cmdsMois = commandesData.filter(c => c.mois === m);
      const ca = cmdsMois.reduce((s, c) => s + c.articles.reduce((a, i) => a + produits[i].prix, 0), 0);
      totalCA += ca;
      console.log(`  ${moisNoms[m-1]} 2025 : ${cmdsMois.length} commandes — ${ca.toLocaleString()} Ar`);
    }
    console.log('─'.repeat(45));
    console.log(`  TOTAL CA 2025  : ${totalCA.toLocaleString()} Ar\n`);

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Déconnecté');
  }
}

seed();