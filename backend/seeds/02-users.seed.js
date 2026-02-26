const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Boutique = require('../models/Boutique');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const usersTest = [
  {
    email: "admin@citymall.mg",
    motDePasse: "Admin1234",
    nom: "Rakoto",
    prenom: "Jean",
    role: "ADMIN",
    emailVerifie: true
  },
  {
    email: "jean@fashion.mg",
    motDePasse: "Shop1234",
    nom: "Rakoto",
    prenom: "Jean",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Fashion Shop"
  },
  {
    email: "sarah@tech.mg",
    motDePasse: "Shop1234",
    nom: "Rabe",
    prenom: "Sarah",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Tech Store"
  },
  {
    email: "paul@home.mg",
    motDePasse: "Shop1234",
    nom: "Razafy",
    prenom: "Paul",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Home Decor"
  },
  {
    email: "claudine@beauty.mg",
    motDePasse: "Shop1234",
    nom: "Ratsimba",
    prenom: "Claudine",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Beauty Corner"
  },
  {
    email: "sophie@kids.mg",
    motDePasse: "Shop1234",
    nom: "Randria",
    prenom: "Sophie",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Kids Fashion"
  },
  {
    email: "marc@computer.mg",
    motDePasse: "Shop1234",
    nom: "Razafy",
    prenom: "Marc",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Computer World"
  },
  {
    email: "client@mail.mg",
    motDePasse: "Buy1234",
    nom: "Randria",
    prenom: "Pierre",
    role: "ACHETEUR",
    emailVerifie: true
  } //,
  // {
  //   email: "antsamadagascar@gmail.com",
  //   motDePasse: "Buy1234",
  //   nom: "Ratovonandrasana",
  //   prenom: "Aina Ny Antsa",
  //   role: "ACHETEUR",
  //   emailVerifie: true
  // },
  // {
  //   email: "nantenaina@gmail.com",
  //   motDePasse: "Buy1234",
  //   nom: "Raherimalala",
  //   prenom: "Nantenaina",
  //   role: "ACHETEUR",
  //   emailVerifie: true
  // }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    await User.deleteMany({});
    console.log('🗑️  Utilisateurs existants supprimés');

    for (let userData of usersTest) {
      const boutiqueNom = userData._boutiqueNom;
      delete userData._boutiqueNom; // champ temporaire, ne pas sauvegarder

      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      userData.motDePasse = await bcrypt.hash(userData.motDePasse, salt);

      // Chercher la boutique et écrire son _id sur le User ✅
      if (boutiqueNom) {
        const boutique = await Boutique.findOne({ nom: boutiqueNom });
        if (boutique) {
          userData.boutiqueId = boutique._id; // ← bonne direction : User → Boutique
          console.log(`🔗 ${userData.email} → boutiqueId = ${boutique._id} (${boutiqueNom})`);
        } else {
          console.warn(`⚠️  Boutique "${boutiqueNom}" non trouvée — lancez seedBoutiques d'abord`);
        }
      }

      const user = new User(userData);
      await user.save();
    }

    console.log('\n🎉 SEED USERS TERMINÉ !');
    console.log('┌─────────────────────────────────────┬──────────┬──────────---┐');
    console.log('│ Email                               │ Rôle     │ MDP         │');
    console.log('├─────────────────────────────────────┼──────────┼──────────---┤');
    console.log('│ admin@citymall.mg                   │ ADMIN    │ Admin1234   │');
    console.log('│ jean@fashion.mg                     │ BOUTIQUE │ Shop1234    │');
    console.log('│ sarah@tech.mg                       │ BOUTIQUE │ Shop1234    │');
    console.log('│ paul@home.mg                        │ BOUTIQUE │ Shop1234    │');
    console.log('│ claudine@beauty.mg                  │ BOUTIQUE │ Shop1234    │');
    console.log('│ sophie@kids.mg                      │ BOUTIQUE │ Shop1234    │');
    console.log('│ marc@computer.mg                    │ BOUTIQUE │ Shop1234    │');
    console.log('│ client@mail.mg                      │ ACHETEUR │ Buy1234    │');
    console.log('└─────────────────────────────────────┴──────────┴──────────┘');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seedUsers();