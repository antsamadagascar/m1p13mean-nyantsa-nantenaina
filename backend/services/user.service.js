const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('./email.service');
const { generateVerificationToken } = require('../utils/tokenUtils');

const registerUser = async ({ nom, prenom, email, motDePasse, telephone }) => {
  if (!nom || !prenom || !email || !motDePasse) {
    throw new Error('Champs requis manquants');
  }

  // VALIDATION DU TÉLÉPHONE
  if (telephone) {
    const phoneRegex = /^(0[23478][0-9]{8}|(\+261|261)[23478][0-9]{8})$/;
    const cleanPhone = telephone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanPhone)) 
    {   throw new Error('INVALID_PHONE');  }
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
    telephone: telephone ? telephone.replace(/\s/g, '') : null, 
    role: 'ACHETEUR',
    dateInscription: new Date(),
    derniereConnexion: null,
    actif: true,
    emailVerifie: false
  });

  await user.save();

  const verificationToken = generateVerificationToken(user._id);

  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (error) {
    console.error('Erreur envoi email:', error);
  }

  return user;
};

module.exports = {
  registerUser
};