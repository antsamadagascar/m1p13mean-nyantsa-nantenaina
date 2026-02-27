// index.seed.js — Lance tous les seeds dans l'ordre séquentiel
// Chaque seed doit exporter une fonction async principale
const path = require('path');
const env = process.env.NODE_ENV || 'local';
const envFile = env === 'production' ? '.env.production' : '.env';

require('dotenv').config({ 
  path: path.join(__dirname, '..', envFile) 
});

const runSeeds = async () => {
  console.log('\n' + '═'.repeat(60));
  console.log('DÉMARRAGE SEED COMPLET');
  console.log('═'.repeat(60) + '\n');

  try {

    // ── 1. Boutiques + zones + emplacements + contrats + paiements
    console.log('━'.repeat(60));
    console.log(' ÉTAPE 1 — Boutiques, zones, contrats, paiements');
    console.log('━'.repeat(60));
    const seed01 = require('./01-boutiques.seed');
    await seed01();
    console.log(' Étape 1 terminée\n');

    // ── 2. Utilisateurs (admin + boutiques + acheteurs)
    console.log('━'.repeat(60));
    console.log(' ÉTAPE 2 — Utilisateurs');
    console.log('━'.repeat(60));
    const seed02 = require('./02-users.seed');
    await seed02();
    console.log(' Étape 2 terminée\n');

    // ── 3. Produits
    console.log('━'.repeat(60));
    console.log(' ÉTAPE 3 — Produits');
    console.log('━'.repeat(60));
    const seed03 = require('./03-produit.seed');
    await seed03();
    console.log(' Étape 3 terminée\n');

    // ── 4. Commandes + mouvements stock
    console.log('━'.repeat(60));
    console.log(' ÉTAPE 4 — Commandes + mouvements stock');
    console.log('━'.repeat(60));
    const seed04 = require('./04-commandes.seed');
    await seed04();
    console.log(' Étape 4 terminée\n');

    console.log('═'.repeat(60));
    console.log(' TOUS LES SEEDS TERMINÉS AVEC SUCCÈS');
    console.log('═'.repeat(60) + '\n');

    process.exit(0);

  } catch (err) {
    console.error('\n ERREUR SEED :', err.message);
    process.exit(1);
  }
};

runSeeds();