/**
 * Validation centralisée des mots de passe
 * Règles :
 * - Minimum 6 caractères
 * - Au moins une minuscule
 * - Au moins une majuscule
 */

const validatePassword = (password) => {
  // Vérifie si le mot de passe existe
  if (!password) {
    throw new Error('Mot de passe requis');
  }

  // Vérifie la longueur minimale
  if (password.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  // Vérifie la présence d'au moins une minuscule
  if (!/[a-z]/.test(password)) {
    throw new Error('Le mot de passe doit contenir au moins une lettre minuscule');
  }

  // Vérifie la présence d'au moins une majuscule
  if (!/[A-Z]/.test(password)) {
    throw new Error('Le mot de passe doit contenir au moins une lettre majuscule');
  }

  // Si toutes les validations passent
  return true;
};

/**
 * Validation d'email (bonus)
 */
const validateEmail = (email) => {
  if (!email) {
    throw new Error('Email requis');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Format d\'email invalide');
  }

  return true;
};

module.exports = {
  validatePassword,
  validateEmail
};