const mongoose = require('mongoose');
const slugify = require('slugify');

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  slug: { type: String, unique: true },
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

// Génére automatiquement le slug avant sauvegarde
categorieSchema.pre('save', function(next) {
  if (!this.slug) 
  {   this.slug = slugify(this.nom, { lower: true, strict: true }); }
  next();
});

module.exports = mongoose.model('Categorie', categorieSchema);
