const mongoose = require('mongoose');
const path = require('path');

const env = process.env.NODE_ENV || 'local';
const envFile = env === 'production' ? '.env.production' : '.env';

require('dotenv').config({ 
  path: path.join(__dirname, '..', envFile) 
});

const User       = require('../models/User');
const Produit    = require('../models/Produit');
const Boutique   = require('../models/Boutique');
const Evaluation = require('../models/Evaluation');

// ============================================================
// COMMENTAIRES RÉALISTES PAR CATÉGORIE
// ============================================================
const commentairesProduits = {
  vetements: [
    { note: 5, commentaire: "Qualité excellente, la coupe est parfaite. Je recommande vivement !" },
    { note: 5, commentaire: "Très beau produit, conforme à la description. Livraison rapide." },
    { note: 4, commentaire: "Bon produit dans l'ensemble, le tissu est de bonne qualité. Taille conforme." },
    { note: 4, commentaire: "Satisfait de mon achat. La couleur est exactement comme sur la photo." },
    { note: 3, commentaire: "Produit correct mais le tissu est un peu fin. Rapport qualité/prix moyen." },
    { note: 5, commentaire: "Magnifique ! Je suis très content de cet achat, je reviendrai." },
    { note: 4, commentaire: "Belle pièce, bien finie. Juste un peu serré aux épaules pour ma morphologie." },
    { note: 3, commentaire: "Correct sans plus. Les coutures sont un peu approximatives." },
    { note: 5, commentaire: "Parfait pour les sorties ! Matière douce et confortable." },
    { note: 4, commentaire: "Très bon produit, la taille est fidèle au guide des tailles." },
  ],
  electronique: [
    { note: 5, commentaire: "Produit authentique, fonctionne parfaitement. Très satisfait !" },
    { note: 5, commentaire: "Exactement ce que je cherchais. Emballage soigné, produit neuf." },
    { note: 4, commentaire: "Bon produit, conforme aux attentes. Je recommande cette boutique." },
    { note: 5, commentaire: "Excellent rapport qualité/prix. Le produit est arrivé en parfait état." },
    { note: 4, commentaire: "Produit de qualité, livraison dans les délais. Satisfait de mon achat." },
    { note: 3, commentaire: "Produit OK mais j'attendais mieux pour ce prix. Notice en anglais uniquement." },
    { note: 5, commentaire: "Incroyable ! Tout fonctionne à merveille. Vendeur sérieux et fiable." },
    { note: 4, commentaire: "Très bon produit. Quelques égratignures sur la boîte mais le produit est intact." },
    { note: 2, commentaire: "Déçu, la batterie tient moins longtemps que prévu. Service après-vente à améliorer." },
    { note: 5, commentaire: "Top ! Exactement comme décrit. Je rachèterai sans hésiter." },
  ],
  maison: [
    { note: 5, commentaire: "Magnifique pièce ! Exactement comme sur les photos, très belle qualité." },
    { note: 4, commentaire: "Très joli produit, bien emballé. Installation facile." },
    { note: 5, commentaire: "Superbe ! Ça habille vraiment bien mon salon. Je suis ravie." },
    { note: 4, commentaire: "Bon produit, solide et esthétique. Livraison soignée." },
    { note: 3, commentaire: "Joli visuellement mais la qualité des matériaux est moyenne." },
    { note: 5, commentaire: "Parfait ! Exactement ce que je voulais pour ma décoration intérieure." },
    { note: 4, commentaire: "Belle pièce, les dimensions sont conformes. Très bon achat." },
    { note: 5, commentaire: "Coup de cœur ! La qualité est au rendez-vous. Je recommande." },
  ],
  enfants: [
    { note: 5, commentaire: "Mon enfant adore ! Tissu doux et résistant. Parfait pour l'hiver." },
    { note: 5, commentaire: "Excellent produit pour enfant. Qualité irréprochable et belles couleurs." },
    { note: 4, commentaire: "Bon produit, ma fille est contente. Taille légèrement grande." },
    { note: 5, commentaire: "Très belle qualité ! Mon fils porte ça tous les jours tellement il l'aime." },
    { note: 4, commentaire: "Produit conforme, bonne qualité pour le prix. Je recommande." },
    { note: 3, commentaire: "Correct, mais les couleurs ont légèrement déteint au premier lavage." },
    { note: 5, commentaire: "Parfait ! Livraison rapide et produit de qualité. Ma fille est ravie." },
  ],
};

const commentairesBoutiques = [
  { note: 5, commentaire: "Boutique excellente ! Produits de qualité et service client très réactif." },
  { note: 5, commentaire: "Super boutique, je recommande à tous. Livraison rapide et soignée." },
  { note: 4, commentaire: "Bonne boutique dans l'ensemble. Quelques délais de livraison à améliorer." },
  { note: 5, commentaire: "Très professionnel ! Les produits correspondent exactement aux descriptions." },
  { note: 4, commentaire: "Satisfait de mes achats. Belle sélection de produits." },
  { note: 3, commentaire: "Boutique correcte mais le service client pourrait être plus réactif." },
  { note: 5, commentaire: "Excellent ! Je reviens toujours faire mes achats ici. Fiable et sérieux." },
  { note: 4, commentaire: "Bonne boutique, produits conformes. Je reviendrai." },
  { note: 5, commentaire: "Top ! Qualité des produits irréprochable. Vendeur très sympa." },
  { note: 2, commentaire: "Déçu par le service après-vente. Le produit n'était pas comme décrit." },
];

// ============================================================
// SEED PRINCIPAL
// ============================================================
const seedEvaluations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté\n');

    // Nettoyage
    await Evaluation.deleteMany({});
    console.log('🗑️  Evaluations supprimées\n');

    // Charger clients
    const clients = await User.find({ role: 'ACHETEUR' });
    const u = {};
    clients.forEach(c => { u[c.email] = c; });

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

    // Chargements des produits
    const produits = await Produit.find({}).populate('boutique');
    const p = {};
    produits.forEach(prod => { p[prod.reference] = prod; });

    // Chargements boutiques
    const boutiques = await Boutique.find({});
    const b = {};
    boutiques.forEach(bout => { b[bout.nom] = bout; });

    console.log(` ${clients.length} clients, ${produits.length} produits, ${boutiques.length} boutiques chargés\n`);

    const evaluations = [];
    const v = commentairesProduits.vetements;
    const e = commentairesProduits.electronique;
    const m = commentairesProduits.maison;
    const k = commentairesProduits.enfants;

    // ── ÉVALUATIONS PRODUITS ──────────────────────────────────

    // T-shirt Nike
    if (p['VET-NIKE-TS-01']) {
      evaluations.push(
        { produit: p['VET-NIKE-TS-01']._id, client: pierre._id,  ...v[0], date: '2025-01-15' },
        { produit: p['VET-NIKE-TS-01']._id, client: aina._id,    ...v[3], date: '2025-02-10' },
        { produit: p['VET-NIKE-TS-01']._id, client: antoine._id, ...v[6], date: '2025-03-20' },
        { produit: p['VET-NIKE-TS-01']._id, client: mickael._id, ...v[1], date: '2025-06-05' },
      );
    }

    // T-shirt Adidas
    if (p['VET-ADI-TF-01']) {
      evaluations.push(
        { produit: p['VET-ADI-TF-01']._id, client: nanten._id,  ...v[4], date: '2025-02-20' },
        { produit: p['VET-ADI-TF-01']._id, client: hery._id,    ...v[9], date: '2025-04-12' },
        { produit: p['VET-ADI-TF-01']._id, client: tahina._id,  ...v[2], date: '2025-07-08' },
      );
    }

    // Jeans Levi's
    if (p['VET-LEV-501']) {
      evaluations.push(
        { produit: p['VET-LEV-501']._id, client: fara._id,   ...v[5], date: '2025-03-15' },
        { produit: p['VET-LEV-501']._id, client: rina._id,   ...v[7], date: '2025-05-22' },
        { produit: p['VET-LEV-501']._id, client: andry._id,  ...v[0], date: '2025-08-14' },
        { produit: p['VET-LEV-501']._id, client: mialy._id,  ...v[3], date: '2025-10-05' },
      );
    }

    // Robe de soirée
    if (p['VET-ROBE-SOIREE']) {
      evaluations.push(
        { produit: p['VET-ROBE-SOIREE']._id, client: aina._id,    ...v[0], date: '2025-01-20' },
        { produit: p['VET-ROBE-SOIREE']._id, client: nirina._id,  ...v[8], date: '2025-04-18' },
        { produit: p['VET-ROBE-SOIREE']._id, client: fenitra._id, ...v[4], date: '2025-09-30' },
      );
    }

    // Blazer femme
    if (p['VET-BLAZ-F']) {
      evaluations.push(
        { produit: p['VET-BLAZ-F']._id, client: tiana._id,  ...v[6], date: '2025-02-28' },
        { produit: p['VET-BLAZ-F']._id, client: mialy._id,  ...v[0], date: '2025-11-10' },
      );
    }

    // iPhone 15
    if (p['ELEC-IPHONE-15']) {
      evaluations.push(
        { produit: p['ELEC-IPHONE-15']._id, client: nanten._id,  ...e[0], date: '2025-01-22' },
        { produit: p['ELEC-IPHONE-15']._id, client: toky._id,    ...e[3], date: '2025-03-08' },
        { produit: p['ELEC-IPHONE-15']._id, client: mahefa._id,  ...e[6], date: '2025-07-15' },
        { produit: p['ELEC-IPHONE-15']._id, client: joel._id,    ...e[1], date: '2025-11-20' },
        { produit: p['ELEC-IPHONE-15']._id, client: andry._id,   ...e[4], date: '2026-01-12' },
      );
    }

    // Galaxy S24
    if (p['ELEC-GALAXY-S24']) {
      evaluations.push(
        { produit: p['ELEC-GALAXY-S24']._id, client: pierre._id,  ...e[2], date: '2025-02-14' },
        { produit: p['ELEC-GALAXY-S24']._id, client: antoine._id, ...e[7], date: '2025-05-30' },
        { produit: p['ELEC-GALAXY-S24']._id, client: rina._id,    ...e[8], date: '2025-09-10' },
      );
    }

    // PS5
    if (p['ELEC-PS5-SLIM']) {
      evaluations.push(
        { produit: p['ELEC-PS5-SLIM']._id, client: mickael._id, ...e[0], date: '2025-03-25' },
        { produit: p['ELEC-PS5-SLIM']._id, client: hery._id,    ...e[6], date: '2025-08-18' },
        { produit: p['ELEC-PS5-SLIM']._id, client: toky._id,    ...e[4], date: '2026-01-28' },
      );
    }

    // MacBook Pro M3
    if (p['ELEC-MBP-M3']) {
      evaluations.push(
        { produit: p['ELEC-MBP-M3']._id, client: nanten._id,  ...e[0], date: '2025-04-10' },
        { produit: p['ELEC-MBP-M3']._id, client: fenitra._id, ...e[3], date: '2025-10-22' },
      );
    }

    // AirPods Pro 2
    if (p['ELEC-AIRPODS-PRO2']) {
      evaluations.push(
        { produit: p['ELEC-AIRPODS-PRO2']._id, client: mahefa._id, ...e[1], date: '2025-05-14' },
        { produit: p['ELEC-AIRPODS-PRO2']._id, client: joel._id,   ...e[5], date: '2025-12-03' },
        { produit: p['ELEC-AIRPODS-PRO2']._id, client: aina._id,   ...e[9], date: '2026-02-08' },
      );
    }

    // Canapé Scandi
    if (p['DECO-CANAPE-SCANDI']) {
      evaluations.push(
        { produit: p['DECO-CANAPE-SCANDI']._id, client: pierre._id, ...m[0], date: '2025-04-05' },
        { produit: p['DECO-CANAPE-SCANDI']._id, client: tiana._id,  ...m[7], date: '2025-09-20' },
      );
    }

    // Table en chêne
    if (p['DECO-TABLE-CHENE']) {
      evaluations.push(
        { produit: p['DECO-TABLE-CHENE']._id, client: andry._id,  ...m[3], date: '2025-05-08' },
        { produit: p['DECO-TABLE-CHENE']._id, client: mialy._id,  ...m[6], date: '2025-11-15' },
        { produit: p['DECO-TABLE-CHENE']._id, client: hasina._id, ...m[2], date: '2026-01-18' },
      );
    }

    // Lampe arc
    if (p['DECO-LAMPE-ARC']) {
      evaluations.push(
        { produit: p['DECO-LAMPE-ARC']._id, client: fenitra._id, ...m[5], date: '2025-06-12' },
        { produit: p['DECO-LAMPE-ARC']._id, client: nirina._id,  ...m[1], date: '2025-10-28' },
      );
    }

    // Tapis berbère
    if (p['DECO-TAPIS-BERB']) {
      evaluations.push(
        { produit: p['DECO-TAPIS-BERB']._id, client: tahina._id, ...m[4], date: '2025-07-20' },
        { produit: p['DECO-TAPIS-BERB']._id, client: rina._id,   ...m[7], date: '2025-12-10' },
      );
    }

    // Pyjamas enfants
    if (p['KID-PYJA-COT']) {
      evaluations.push(
        { produit: p['KID-PYJA-COT']._id, client: antoine._id, ...k[0], date: '2025-02-05' },
        { produit: p['KID-PYJA-COT']._id, client: fara._id,    ...k[4], date: '2025-06-18' },
        { produit: p['KID-PYJA-COT']._id, client: joel._id,    ...k[2], date: '2025-11-25' },
        { produit: p['KID-PYJA-COT']._id, client: hasina._id,  ...k[6], date: '2026-02-15' },
      );
    }

    // Veste imperméable enfants
    if (p['KID-VEST-IMP']) {
      evaluations.push(
        { produit: p['KID-VEST-IMP']._id, client: lalaina._id, ...k[3], date: '2025-03-10' },
        { produit: p['KID-VEST-IMP']._id, client: toky._id,    ...k[1], date: '2025-08-22' },
      );
    }

    // ── ÉVALUATIONS BOUTIQUES ─────────────────────────────────
    const cb = commentairesBoutiques;

    if (b['Fashion Shop']) {
      evaluations.push(
        { boutique: b['Fashion Shop']._id, client: pierre._id,  ...cb[0], date: '2025-02-01' },
        { boutique: b['Fashion Shop']._id, client: aina._id,    ...cb[4], date: '2025-04-15' },
        { boutique: b['Fashion Shop']._id, client: nanten._id,  ...cb[1], date: '2025-06-20' },
        { boutique: b['Fashion Shop']._id, client: antoine._id, ...cb[6], date: '2025-09-08' },
        { boutique: b['Fashion Shop']._id, client: mickael._id, ...cb[3], date: '2025-11-30' },
        { boutique: b['Fashion Shop']._id, client: fara._id,    ...cb[8], date: '2026-01-10' },
      );
    }

    if (b['Tech Store']) {
      evaluations.push(
        { boutique: b['Tech Store']._id, client: toky._id,   ...cb[0], date: '2025-03-12' },
        { boutique: b['Tech Store']._id, client: mahefa._id, ...cb[2], date: '2025-07-25' },
        { boutique: b['Tech Store']._id, client: joel._id,   ...cb[7], date: '2025-12-15' },
        { boutique: b['Tech Store']._id, client: andry._id,  ...cb[4], date: '2026-02-01' },
      );
    }

    if (b['Home Decor']) {
      evaluations.push(
        { boutique: b['Home Decor']._id, client: tiana._id,  ...cb[5], date: '2025-05-10' },
        { boutique: b['Home Decor']._id, client: mialy._id,  ...cb[1], date: '2025-10-18' },
        { boutique: b['Home Decor']._id, client: hasina._id, ...cb[6], date: '2026-01-22' },
      );
    }

    if (b['Kids Fashion']) {
      evaluations.push(
        { boutique: b['Kids Fashion']._id, client: lalaina._id, ...cb[0], date: '2025-04-08' },
        { boutique: b['Kids Fashion']._id, client: fenitra._id, ...cb[3], date: '2025-08-30' },
        { boutique: b['Kids Fashion']._id, client: nirina._id,  ...cb[8], date: '2025-12-20' },
      );
    }

    if (b['Computer World']) {
      evaluations.push(
        { boutique: b['Computer World']._id, client: hery._id,   ...cb[1], date: '2025-05-22' },
        { boutique: b['Computer World']._id, client: rina._id,   ...cb[9], date: '2025-09-14' },
        { boutique: b['Computer World']._id, client: tahina._id, ...cb[4], date: '2026-02-10' },
      );
    }

    // ── Insertion avec dates forcées ──────────────────────────
    let count = 0;
    for (const ev of evaluations) {
      const { date, ...data } = ev;
      const doc = await Evaluation.create(data);

      // Force la date_creation via driver MongoDB direct
      await Evaluation.collection.updateOne(
        { _id: doc._id },
        { $set: {
          date_creation:     new Date(date),
          date_modification: new Date(date)
        }}
      );
      count++;
    }

    console.log(` ${count} évaluations créées\n`);

    // Stats finales
    const statsProds = await Evaluation.countDocuments({ produit: { $ne: null } });
    const statsBouts = await Evaluation.countDocuments({ boutique: { $ne: null } });
    const moyenne    = await Evaluation.aggregate([
      { $group: { _id: null, moy: { $avg: '$note' } } }
    ]);

    console.log('═'.repeat(50));
    console.log(' STATS ÉVALUATIONS');
    console.log('═'.repeat(50));
    console.log(`   Évaluations produits  : ${statsProds}`);
    console.log(`   Évaluations boutiques : ${statsBouts}`);
    console.log(`   Note moyenne globale  : ${moyenne[0]?.moy?.toFixed(1) || 'N/A'}/5`);
    console.log('═'.repeat(50));

    await mongoose.disconnect();
    console.log('✓ Déconnecté');

  } catch (err) {
    console.error('\n Erreur:', err.message);
    if (err.errors) Object.keys(err.errors).forEach(k =>
      console.error(`   - ${k}: ${err.errors[k].message}`)
    );
    throw err;
  }
};

if (require.main === module) {
  seedEvaluations().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedEvaluations;