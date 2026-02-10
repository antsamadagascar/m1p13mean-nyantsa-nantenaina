const mongoose = require('mongoose');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Données des catégories
const categoriesTest = [
  { nom: 'Électronique', description: 'Tous les produits électroniques' },
  { nom: 'Vêtements', description: 'Mode et vêtements' },
  { nom: 'Alimentation', description: 'Produits alimentaires' }
];

// Données des sous-catégories
const sousCategoriesTest = [
  { nom: 'Smartphones', parentNom: 'Électronique' },
  { nom: 'Ordinateurs', parentNom: 'Électronique' },
  { nom: 'T-shirts', parentNom: 'Vêtements' },
  { nom: 'Pantalons', parentNom: 'Vêtements' },
  { nom: 'Fruits', parentNom: 'Alimentation' },
  { nom: 'Boissons', parentNom: 'Alimentation' }
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Supprimer les anciennes données
    await SousCategorie.deleteMany({});
    await Categorie.deleteMany({});
    console.log('🗑️ Anciennes catégories et sous-catégories supprimées');

    // Insérer les catégories
    const categories = await Categorie.insertMany(categoriesTest);
    console.log('✅ Catégories créées');

    // Insérer les sous-catégories en liant la catégorie par nom
    for (let sub of sousCategoriesTest) {
      const parent = categories.find(c => c.nom === sub.parentNom);
      if (parent) {
        await SousCategorie.create({
          nom: sub.nom,
          categorieId: parent._id
        });
      }
    }
    console.log('✅ Sous-catégories créées');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

seedCategories();
