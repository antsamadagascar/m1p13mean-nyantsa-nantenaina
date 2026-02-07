const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const usersTest = [
  {
    email: "admin@citymall.mg",
    motDePasse: "admin123",
    nom: "Rakoto",
    prenom: "Jean",
    role: "ADMIN"
  },
  {
    email: "boutique@fashion.mg",
    motDePasse: "boutique123",
    nom: "Rabe",
    prenom: "Marie",
    role: "BOUTIQUE"
  },
  {
    email: "client@mail.mg",
    motDePasse: "client123",
    nom: "Randria",
    prenom: "Pierre",
    role: "ACHETEUR"
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');

    // Supprimer les utilisateurs existants
    await User.deleteMany({});
    console.log('Utilisateurs existants supprimés');

    // Hasher les mots de passe avant d'insérer
    for (let user of usersTest) {
      const salt = await bcrypt.genSalt(10);
      user.motDePasse = await bcrypt.hash(user.motDePasse, salt);
    }

    await User.insertMany(usersTest);
    console.log('3 utilisateurs de test créés avec succès (mots de passe hashés)');

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

seedUsers();
