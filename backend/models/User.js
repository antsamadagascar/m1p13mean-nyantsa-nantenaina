const mongoose = require("mongoose");

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

module.exports = mongoose.model("User", userSchema);
