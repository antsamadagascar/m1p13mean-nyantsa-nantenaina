const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('./emailService');
const { generateVerificationToken } = require('../utils/tokenUtils');

const registerUser = async ({ nom, prenom, email, motDePasse, telephone }) => {
  if (!nom || !prenom || !email || !motDePasse) {
    throw new Error('Champs requis manquants');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    throw new Error('EMAIL_EXISTS');
  }

  const hashedPassword = await bcrypt.hash(motDePasse, 10);

  const user = new User({
    nom,
    prenom,
    email,
    motDePasse: hashedPassword,
    telephone: telephone || null,
    role: 'ACHETEUR',
    dateInscription: new Date(),
    derniereConnexion: null,
    emailVerifie: false  // ← Pas encore vérifié
  });

  await user.save();

  // Générer le token de vérification
  const verificationToken = generateVerificationToken(user._id);

  // Envoyer l'email
  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (error) {
    console.error('Erreur envoi email:', error);
    // On continue même si l'email échoue
  }

  return user;
};

module.exports = {
  registerUser
};