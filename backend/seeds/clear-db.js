const mongoose = require('mongoose');
const path = require('path');

// Choix automatique du fichier .env selon l'environnement
const env = process.env.NODE_ENV || 'local';
const envFile = env === 'production' ? '.env.production' : '.env';

require('dotenv').config({ 
  path: path.join(__dirname, '..', envFile) 
});

const MONGO_URI = process.env.MONGO_URI;

async function clearDatabase() {
  try {
    console.log(`Environnement : ${env}`);
    console.log(`Connexion à : ${MONGO_URI}`);
    
    await mongoose.connect(MONGO_URI);
    console.log(' Connecté à MongoDB');

    const collections = [
      'users', 'boutiques', 'categories', 'souscategories',
      'emplacements', 'evaluations', 'favoris', 'zones',
      'locations', 'produits', 'promotions', 'paiements',
      'paniers', 'commandes', 'mouvementstocks'
    ];

    for (const collection of collections) {
      await mongoose.connection.collection(collection).deleteMany({});
      console.log(`Documents supprimés : ${collection}`);
    }

    await mongoose.disconnect();
    console.log('Déconnecté');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

clearDatabase();