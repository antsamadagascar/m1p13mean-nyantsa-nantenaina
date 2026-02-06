const mongoose = require("mongoose");
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },

  motDePasse: {
    type: String,
    required: true,
    minlength: 6
  },

  role: {
    type: String,
    enum: ["ADMIN", "BOUTIQUE", "ACHETEUR"],
    default: "ACHETEUR"
  },

  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  telephone: String,
  avatar: { type: String, default: null },

  actif: { type: Boolean, default: true },
  emailVerifie: { type: Boolean, default: false },

  dateInscription: { type: Date, default: Date.now },
  derniereConnexion: { type: Date, default: null },

  //  pour le rôle BOUTIQUE uniquement
  boutiqueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Boutique",
    default: null
  }

});

// Méthode pour comparer les mots de passe
userSchema.methods.comparerMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// Méthode pour comparer les mots de passe
userSchema.methods.comparerMotDePasse = async function(motDePasseCandidat) {
  return await bcrypt.compare(motDePasseCandidat, this.motDePasse);
};

// methode pour ne pas envoyer le mot de passe dans les réponses JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.motDePasse;
  return user;
};

module.exports = mongoose.model("User", userSchema);
