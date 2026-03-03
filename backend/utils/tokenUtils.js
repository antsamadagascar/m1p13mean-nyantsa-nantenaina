const jwt = require('jsonwebtoken');

// token session
const generateTokenSession = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Générer un token de vérification
const generateVerificationToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Vérifier un token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};


//  Token de réinitialisation (expire en 1h)
const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};


module.exports = {
  generateTokenSession,
  generateVerificationToken,
  verifyToken,
  generatePasswordResetToken
};