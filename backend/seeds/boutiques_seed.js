const mongoose = require('mongoose');
const Boutique = require('../models/Boutique');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');
require('dotenv').config();

const seedBoutiques = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté');

    // Suppression des données existantes
    await Boutique.deleteMany({});
    await Categorie.deleteMany({});
    await SousCategorie.deleteMany({});
    console.log('🗑️  Anciennes données supprimées');

    // Création des catégories simplifiées
    const categoriesData = [
      { 
        nom: 'Vêtements', 
        description: 'Vêtements pour hommes et femmes, styles modernes et traditionnels, qualité supérieure' 
      },
      { 
        nom: 'Électronique', 
        description: 'Téléphones, ordinateurs, accessoires électroniques, dernières technologies' 
      },
      { 
        nom: 'Maison & Déco', 
        description: 'Meubles, décoration intérieure, objets design pour embellir votre espace de vie' 
      },
      { 
        nom: 'Beauté', 
        description: 'Cosmétiques, produits de soins, parfums, accessoires de beauté et bien-être' 
      }
    ];

    const categories = [];
    for (const cat of categoriesData) {
      const c = new Categorie(cat);
      await c.save();
      categories.push(c);
    }
    console.log('✅ Catégories créées');

    // Création des sous-catégories avec CATEGORIEID (pas categorie)
    const sousCategoriesData = [
      // Vêtements
      { nom: 'Homme', categorieId: categories[0]._id },
      { nom: 'Femme', categorieId: categories[0]._id },
      { nom: 'Enfant', categorieId: categories[0]._id },
      
      // Électronique
      { nom: 'Téléphones', categorieId: categories[1]._id },
      { nom: 'Ordinateurs', categorieId: categories[1]._id },
      { nom: 'Accessoires', categorieId: categories[1]._id },
      
      // Maison & Déco
      { nom: 'Meubles', categorieId: categories[2]._id },
      { nom: 'Décoration', categorieId: categories[2]._id },
      { nom: 'Cuisine', categorieId: categories[2]._id },
      
      // Beauté
      { nom: 'Maquillage', categorieId: categories[3]._id },
      { nom: 'Soins', categorieId: categories[3]._id },
      { nom: 'Parfums', categorieId: categories[3]._id }
    ];

    const sousCategories = [];
    for (const sc of sousCategoriesData) {
      const sousCat = new SousCategorie(sc);
      await sousCat.save();
      sousCategories.push(sousCat);
    }
    console.log('✅ Sous-catégories créées');

    // Création des boutiques avec descriptions plus longues (≥50 caractères)
    const boutiques = [
      {
        nom: 'Fashion Shop',
        description: 'Boutique de vêtements tendance pour hommes et femmes. Collection de saison avec styles variés et tissus de qualité pour tous les goûts.',
        logo: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1200&h=300&fit=crop',
        gerant: {
          nom: 'Rakoto',
          prenom: 'Jean',
          email: 'jean@fashion.mg',
          telephone: '+261 34 12 345 67'
        },
        localisation: {
          zone: 'Zone A',
          etage: 'Rez-de-chaussée',
          numero: 'A-RC-01',
          surface: 45,
          latitude: -18.9100,
          longitude: 47.5264
        },
        categorie: categories[0]._id,
        sous_categories: [sousCategories[0]._id, sousCategories[1]._id],
        contact: {
          telephone: '+261 34 12 345 67',
          email: 'contact@fashion.mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '18:00' },
          mardi: { ouvert: true, debut: '09:00', fin: '18:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '18:00' },
          jeudi: { ouvert: true, debut: '09:00', fin: '18:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          samedi: { ouvert: true, debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2024-01-15')
        }
      },
      {
        nom: 'Tech Store',
        description: 'Vente de téléphones, tablettes et accessoires électroniques. Nous proposons les dernières marques avec garantie et service après-vente.',
        logo: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=300&fit=crop',
        gerant: {
          nom: 'Rabe',
          prenom: 'Sarah',
          email: 'sarah@tech.mg',
          telephone: '+261 33 11 222 33'
        },
        localisation: {
          zone: 'Zone B',
          etage: '1er étage',
          numero: 'B-E1-02',
          surface: 60,
          latitude: -18.9086,
          longitude: 47.5292
        },
        categorie: categories[1]._id,
        sous_categories: [sousCategories[3]._id, sousCategories[5]._id],
        contact: {
          telephone: '+261 33 11 222 33',
          email: 'info@tech.mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mardi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          jeudi: { ouvert: true, debut: '09:00', fin: '19:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '20:00' },
          samedi: { ouvert: true, debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: true, debut: '10:00', fin: '17:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2024-02-20')
        }
      },
      {
        nom: 'Home Decor',
        description: 'Meubles modernes et objets de décoration pour embellir votre maison. Design contemporain et matériaux de qualité pour un intérieur unique.',
        logo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1561773922-7b9a5d4d3c1b?w=1200&h=300&fit=crop',
        gerant: {
          nom: 'Razafy',
          prenom: 'Paul',
          email: 'paul@home.mg',
          telephone: '+261 32 44 555 66'
        },
        localisation: {
          zone: 'Zone C',
          etage: '2ème étage',
          numero: 'C-E2-03',
          surface: 75,
          latitude: -18.9132,
          longitude: 47.5238
        },
        categorie: categories[2]._id,
        sous_categories: [sousCategories[6]._id, sousCategories[7]._id],
        contact: {
          telephone: '+261 32 44 555 66',
          email: 'contact@home.mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '17:30' },
          mardi: { ouvert: true, debut: '09:00', fin: '17:30' },
          mercredi: { ouvert: true, debut: '09:00', fin: '17:30' },
          jeudi: { ouvert: true, debut: '09:00', fin: '17:30' },
          vendredi: { ouvert: true, debut: '09:00', fin: '18:30' },
          samedi: { ouvert: true, debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2024-03-10')
        }
      },
      {
        nom: 'Beauty Corner',
        description: 'Cosmétiques et produits de soins de qualité. Nous proposons des marques reconnues pour prendre soin de votre peau et de votre beauté au quotidien.',
        logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=300&fit=crop',
        gerant: {
          nom: 'Ratsimba',
          prenom: 'Claudine',
          email: 'claudine@beauty.mg',
          telephone: '+261 34 99 000 11'
        },
        localisation: {
          zone: 'Zone A',
          etage: '1er étage',
          numero: 'A-E1-04',
          surface: 35,
          latitude: -18.9115,
          longitude: 47.5279
        },
        categorie: categories[3]._id,
        sous_categories: [sousCategories[9]._id, sousCategories[10]._id],
        contact: {
          telephone: '+261 34 99 000 11',
          email: 'info@beauty.mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '18:00' },
          mardi: { ouvert: true, debut: '09:00', fin: '18:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '18:00' },
          jeudi: { ouvert: true, debut: '09:00', fin: '18:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          samedi: { ouvert: true, debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' }
        },
        statut: {
          actif: false,
          valide_par_admin: false,
          en_attente_validation: true,
          suspendu: false
        }
      },
      {
        nom: 'Kids Fashion',
        description: 'Vêtements colorés et confortables pour enfants de tous âges. Sélection de qualité pour habiller vos petits avec style et praticité.',
        logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=300&fit=crop',
        gerant: {
          nom: 'Randria',
          prenom: 'Sophie',
          email: 'sophie@kids.mg',
          telephone: '+261 33 66 777 88'
        },
        localisation: {
          zone: 'Zone B',
          etage: 'Rez-de-chaussée',
          numero: 'B-RC-05',
          surface: 40,
          latitude: -18.9080,
          longitude: 47.5286
        },
        categorie: categories[0]._id,
        sous_categories: [sousCategories[2]._id],
        contact: {
          telephone: '+261 33 66 777 88',
          email: 'contact@kids.mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mardi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          jeudi: { ouvert: true, debut: '09:00', fin: '19:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '20:00' },
          samedi: { ouvert: true, debut: '09:00', fin: '20:00' },
          dimanche: { ouvert: true, debut: '10:00', fin: '18:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2024-02-15')
        }
      },
      {
        nom: 'Computer World',
        description: 'Ordinateurs portables, de bureau et accessoires informatiques. Nous conseillons et fournissons le matériel adapté à vos besoins professionnels.',
        logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
        banniere: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=300&fit=crop',
        gerant: {
          nom: 'Razafy',
          prenom: 'Marc',
          email: 'marc@computer.mg',
          telephone: '+261 33 22 333 44'
        },
        localisation: {
          zone: 'Zone D',
          etage: '2ème étage',
          numero: 'D-E2-06',
          surface: 65,
          latitude: -18.9072,
          longitude: 47.5247
        },
        categorie: categories[1]._id,
        sous_categories: [sousCategories[4]._id],
        contact: {
          telephone: '+261 33 22 333 44',
          email: 'info@computer.mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '08:00', fin: '17:00' },
          mardi: { ouvert: true, debut: '08:00', fin: '17:00' },
          mercredi: { ouvert: true, debut: '08:00', fin: '17:00' },
          jeudi: { ouvert: true, debut: '08:00', fin: '17:00' },
          vendredi: { ouvert: true, debut: '08:00', fin: '16:00' },
          samedi: { ouvert: false, debut: '00:00', fin: '00:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2024-03-05')
        }
      }
    ];

    const boutiquesSaved = [];
    for (const b of boutiques) {
      const boutique = new Boutique(b);
      await boutique.save();
      boutiquesSaved.push(boutique);
    }

    console.log('✅ Boutiques créées');

    console.log('\n🎉 SEED TERMINÉ !');
    console.log('Résumé :');
    console.log(`   📁 ${categories.length} catégories`);
    console.log(`   📂 ${sousCategories.length} sous-catégories`);
    console.log(`   🏪 ${boutiques.length} boutiques`);
    
    console.log('\n📊 Statut des boutiques :');
    const actives = boutiques.filter(b => b.statut.actif && b.statut.valide_par_admin).length;
    const enAttente = boutiques.filter(b => b.statut.en_attente_validation).length;
    console.log(`   ✅ Actives : ${actives}`);
    console.log(`   ⏳ En attente : ${enAttente}`);
    
    console.log('\n🏪 Liste des boutiques créées :');
    boutiquesSaved.forEach((b, i) => {
      const statut = b.statut.en_attente_validation ? '⏳' : '✅';
      console.log(`   ${i+1}. ${b.nom} - Zone ${b.localisation.zone} ${statut}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('Détails:', error.message);
    
    if (error.errors) {
      console.error('Erreurs de validation:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    
    process.exit(1);
  }
};

seedBoutiques();