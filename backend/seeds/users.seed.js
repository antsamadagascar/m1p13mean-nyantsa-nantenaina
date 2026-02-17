const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Boutique = require('../models/Boutique');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const usersTest = [
  {
    email: "admin@citymall.mg",
    motDePasse: "admin1",
    nom: "Rakoto",
    prenom: "Jean",
    role: "ADMIN",
    emailVerifie: true
  },
  {
    email: "antsamadagascar@gmail.com",
    motDePasse: "admin2",
    nom: "Ratovonandrasana",
    prenom: "Aina Ny Antsa",
    role: "ADMIN",
    emailVerifie: true
  },
  {
    email: "jean@fashion.mg",
    motDePasse: "shop1",
    nom: "Rakoto",
    prenom: "Jean",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Fashion Shop"
  },
  {
    email: "sarah@tech.mg",
    motDePasse: "shop2",
    nom: "Rabe",
    prenom: "Sarah",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Tech Store"
  },
  {
    email: "paul@home.mg",
    motDePasse: "shop3",
    nom: "Razafy",
    prenom: "Paul",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Home Decor"
  },
  {
    email: "claudine@beauty.mg",
    motDePasse: "shop4",
    nom: "Ratsimba",
    prenom: "Claudine",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Beauty Corner"
  },
  {
    email: "sophie@kids.mg",
    motDePasse: "shop5",
    nom: "Randria",
    prenom: "Sophie",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Kids Fashion"
  },
  {
    email: "marc@computer.mg",
    motDePasse: "shop6",
    nom: "Razafy",
    prenom: "Marc",
    role: "BOUTIQUE",
    emailVerifie: true,
    _boutiqueNom: "Computer World"
  },
  {
    email: "client@mail.mg",
    motDePasse: "buy1",
    nom: "Randria",
    prenom: "Pierre",
    role: "ACHETEUR",
    emailVerifie: true
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    await User.deleteMany({});
    console.log('🗑️  Utilisateurs existants supprimés');

    for (let user of usersTest) {
      const salt = await bcrypt.genSalt(10);
      user.motDePasse = await bcrypt.hash(user.motDePasse, salt);
    }

    for (let userData of usersTest) {
      const boutiqueNom = userData._boutiqueNom;
      delete userData._boutiqueNom; // ne pas sauvegarder ce champ temporaire

      const user = new User(userData);
      await user.save();

      // Lier la boutique à l'utilisateur
      if (boutiqueNom) {
        const boutique = await Boutique.findOne({ nom: boutiqueNom });
        if (boutique) {
          boutique.userId = user._id;
          await boutique.save();
          console.log(`🔗 ${boutiqueNom} liée à ${userData.email}`);
        } else {
          console.warn(`⚠️  Boutique "${boutiqueNom}" non trouvée — lancez seedBoutiques d'abord`);
        }
      }
    }

    console.log('\n🎉 SEED USERS TERMINÉ !');
    console.log('┌─────────────────────────────────────┬──────────┬──────────┐');
    console.log('│ Email                               │ Rôle     │ MDP      │');
    console.log('├─────────────────────────────────────┼──────────┼──────────┤');
    console.log('│ admin@citymall.mg                   │ ADMIN    │ admin1   │');
    console.log('│ antsamadagascar@gmail.com           │ ADMIN    │ admin2   │');
    console.log('│ jean@fashion.mg                     │ BOUTIQUE │ shop1    │');
    console.log('│ sarah@tech.mg                       │ BOUTIQUE │ shop2    │');
    console.log('│ paul@home.mg                        │ BOUTIQUE │ shop3    │');
    console.log('│ claudine@beauty.mg                  │ BOUTIQUE │ shop4    │');
    console.log('│ sophie@kids.mg                      │ BOUTIQUE │ shop5    │');
    console.log('│ marc@computer.mg                    │ BOUTIQUE │ shop6    │');
    console.log('│ client@mail.mg                      │ ACHETEUR │ buy1     │');
    console.log('└─────────────────────────────────────┴──────────┴──────────┘');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seedUsers();