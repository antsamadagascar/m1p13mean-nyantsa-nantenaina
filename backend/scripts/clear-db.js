const mongoose = require('mongoose');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI; 

async function clearDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB');

    const collections = [
      'users',
      'boutiques',
      'categories',
      'souscategories',
      'emplacements',
      'evaluations',
      'favoris',
      'zones',
      'locations',
      'produits',
      'promotions',
      'paiements',
      'paniers',
      'commandes',
      'mouvementstocks'
    ];

    for (const collection of collections) 
    {
      await mongoose.connection.collection(collection).deleteMany({});
      console.log(`Documents supprimés : ${collection}`);
    }

    await mongoose.disconnect();
  } catch (error)
  {  console.error(error); }
}

clearDatabase();