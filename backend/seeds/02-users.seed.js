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
    },
    {
      email: "antsamadagascar@gmail.com",
      motDePasse: "Buy1234",
      nom: "Ratovonandrasana",
      prenom: "Aina Ny Antsa",
      role: "ACHETEUR",
      emailVerifie: true
    },
    {
      email: "nantenaina@gmail.com",
      motDePasse: "Buy1234",
      nom: "Raherimalala",
      prenom: "Nantenaina",
      role: "ACHETEUR",
      emailVerifie: true
    },
    {
    email: "antoine.randria@mail.mg",
    motDePasse: "Buy1234",
    nom: "Randria",
    prenom: "Antoine",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
    email: "lalaina.rabe@mail.mg",
    motDePasse: "Buy1234",
    nom: "Rabe",
    prenom: "Lalaina",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
    email: "mickael.razafy@mail.mg",
    motDePasse: "Buy1234",
    nom: "Razafy",
    prenom: "Mickael",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
    email: "hery.ratsimba@mail.mg",
    motDePasse: "Buy1234",
    nom: "Ratsimba",
    prenom: "Hery",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
    email: "fara.randriamanana@mail.mg",
    motDePasse: "Buy1234",
    nom: "Randriamanana",
    prenom: "Fara",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
    email: "tahina.rakoto@mail.mg",
    motDePasse: "Buy1234",
    nom: "Rakoto",
    prenom: "Tahina",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
    email: "rina.raveloson@mail.mg",
    motDePasse: "Buy1234",
    nom: "Raveloson",
    prenom: "Rina",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
    email: "toky.andriamihaja@mail.mg",
    motDePasse: "Buy1234",
    nom: "Andriamihaja",
    prenom: "Toky",
    role: "ACHETEUR",
    emailVerifie: true
  },
  {
  email: "mahefa.rakotomalala@mail.mg",
  motDePasse: "Buy1234",
  nom: "Rakotomalala",
  prenom: "Mahefa",
  role: "ACHETEUR",
  emailVerifie: true
},
{
  email: "nirina.rasoanaivo@mail.mg",
  motDePasse: "Buy1234",
  nom: "Rasoanaivo",
  prenom: "Nirina",
  role: "ACHETEUR",
  emailVerifie: true
},
{
  email: "andry.ramanantsoa@mail.mg",
  motDePasse: "Buy1234",
  nom: "Ramanantsoa",
  prenom: "Andry",
  role: "ACHETEUR",
  emailVerifie: true
},
{
  email: "mialy.randrianarisoa@mail.mg",
  motDePasse: "Buy1234",
  nom: "Randrianarisoa",
  prenom: "Mialy",
  role: "ACHETEUR",
  emailVerifie: true
},
{
  email: "fenitra.ravelomanana@mail.mg",
  motDePasse: "Buy1234",
  nom: "Ravelomanana",
  prenom: "Fenitra",
  role: "ACHETEUR",
  emailVerifie: true
},
{
  email: "tiana.rabemananjara@mail.mg",
  motDePasse: "Buy1234",
  nom: "Rabemananjara",
  prenom: "Tiana",
  role: "ACHETEUR",
  emailVerifie: true
},
{
  email: "hasina.rakotonirina@mail.mg",
  motDePasse: "Buy1234",
  nom: "Rakotonirina",
  prenom: "Hasina",
  role: "ACHETEUR",
  emailVerifie: true
},
{
  email: "joel.randriatsiferana@mail.mg",
  motDePasse: "Buy1234",
  nom: "Randriatsiferana",
  prenom: "Joel",
  role: "ACHETEUR",
  emailVerifie: true
}
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB connecté');

    await User.deleteMany({});
    console.log('  Utilisateurs existants supprimés');

    for (let userData of usersTest) {
      const boutiqueNom = userData._boutiqueNom;
      delete userData._boutiqueNom; 

      // Hash le mot de passe
      const salt = await bcrypt.genSalt(10);
      userData.motDePasse = await bcrypt.hash(userData.motDePasse, salt);

      // on  Cherche la boutique et écrit son _id sur le User 
      if (boutiqueNom) {
        const boutique = await Boutique.findOne({ nom: boutiqueNom });
        if (boutique) {
          userData.boutiqueId = boutique._id;
          console.log(` ${userData.email} → boutiqueId = ${boutique._id} (${boutiqueNom})`);
        } else {
          console.warn(`  Boutique "${boutiqueNom}" non trouvée — lancez seedBoutiques d'abord`);
        }
      }

      const user = new User(userData);
      await user.save();
    }

    console.log('\n SEED USERS TERMINÉ !');

    process.exit(0);
  } catch (error) {
    console.error(' Erreur:', error.message);
    process.exit(1);
  }
}

seedUsers();