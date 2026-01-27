require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log(' MongoDB Atlas connecté avec succès !');
    console.log('Base de données:', mongoose.connection.db.databaseName);
    
  } catch (error) {
    console.error(' Erreur de connexion:', error.message);
    console.error('Détails:', error);
    process.exit(1);
  }
};

connectDB();