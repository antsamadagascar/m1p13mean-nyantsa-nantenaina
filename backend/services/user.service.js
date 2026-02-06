const User = require('../models/User');
const bcrypt = require('bcryptjs');

const registerUser = async ({ nom, prenom, email, motDePasse }) => {

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
    role: 'ACHETEUR'
  });

  return await user.save();
};

module.exports = {
  registerUser
};
