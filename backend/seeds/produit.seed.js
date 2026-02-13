const mongoose = require('mongoose');
const Produit = require('../models/Produit');
const MouvementStock = require('../models/MouvementStock');
const Boutique = require('../models/Boutique');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function seedProduits() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Nettoyage
    await MouvementStock.deleteMany({});
    await Produit.deleteMany({});
    console.log('🗑️ Produits et mouvements supprimés');

    const boutique = await Boutique.findOne();
    if (!boutique) {
      console.log('❌ Aucune boutique trouvée');
      process.exit(1);
    }

    const categories = await Categorie.find();
    const sousCategories = await SousCategorie.find();

    const produitsData = [
      {
        nom: 'iPhone 15',
        reference: 'ELEC-001',
        prix: 4500000,
        categorieNom: 'Électronique',
        sousCategorieNom: 'Smartphones',
        quantite: 10
      },
      {
        nom: 'T-shirt Nike',
        reference: 'VET-001',
        prix: 80000,
        categorieNom: 'Vêtements',
        sousCategorieNom: 'T-shirts',
        quantite: 25
      },
      {
        nom: 'Jus d\'orange',
        reference: 'ALI-001',
        prix: 5000,
        categorieNom: 'Alimentation',
        sousCategorieNom: 'Boissons',
        quantite: 50
      }
    ];

    for (let data of produitsData) {

      const categorie = categories.find(c => c.nom === data.categorieNom);
      const sousCategorie = sousCategories.find(sc => sc.nom === data.sousCategorieNom);

      const produit = await Produit.create({
        nom: data.nom,
        reference: data.reference,
        prix: data.prix,
        boutique: boutique._id,
        categorie: categorie._id,
        sous_categorie: sousCategorie?._id,
        quantite: data.quantite
      });

      // Mouvement initial (ENTREE)
      await MouvementStock.create({
        produit: produit._id,
        type: 'ENTREE',
        quantite: data.quantite,
        motif: 'Stock initial (seed)',
        boutique: boutique._id
      });

      console.log(`✅ Produit créé : ${produit.nom}`);
    }

    console.log('🎉 Seed terminé');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur seed:', error);
    process.exit(1);
  }
}

seedProduits();
