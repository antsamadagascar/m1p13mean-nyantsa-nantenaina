const mongoose = require('mongoose');
const Boutique = require('../models/Boutique');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');
const slugify = require('slugify');

require('dotenv').config();

const seedBoutiques = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB connecté');

    // Supression des données existantes
    await Boutique.deleteMany({});
    await Categorie.deleteMany({});
    await SousCategorie.deleteMany({});
    console.log(' Anciennes données supprimées');

    // Creation  des catégories
   const categoriesData = [
        { nom: 'Mode & Vêtements', description: 'Vêtements, chaussures, accessoires' },
        { nom: 'Électronique', description: 'Smartphones, ordinateurs, accessoires' },
        { nom: 'Maison & Déco', description: 'Meubles, décoration, électroménager' },
        { nom: 'Beauté & Santé', description: 'Cosmétiques, parfums, soins' },
        { nom: 'Alimentation', description: 'Épicerie, snacks, boissons' }
        ];

        const categories = [];
        for (const cat of categoriesData) {
        const c = new Categorie(cat);
        await c.save();  
        categories.push(c);
        }


    console.log('✓ Catégories créées');

    // Création  des sous-catégories
    const sousCategories = await SousCategorie.insertMany([
      { nom: 'Vêtements Homme', categorieId: categories[0]._id },
      { nom: 'Vêtements Femme', categorieId: categories[0]._id },
      { nom: 'Chaussures', categorieId: categories[0]._id },
      { nom: 'Smartphones', categorieId: categories[1]._id },
      { nom: 'Ordinateurs', categorieId: categories[1]._id },
      { nom: 'Meubles', categorieId: categories[2]._id },
      { nom: 'Décoration', categorieId: categories[2]._id }
    ]);
    console.log(' Sous-catégories créées');

    // Creation  des boutiques
    const boutiques = [
      {
        nom: 'Fashion Paradise',
        description: 'Votre destination mode à Tana. Découvrez notre sélection exclusive de vêtements tendance pour hommes et femmes. Des marques locales et internationales à prix accessibles.',
        logo: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=FP',
        banniere: 'https://via.placeholder.com/1200x300/FF6B6B/FFFFFF?text=Fashion+Paradise',
        gerant: {
          nom: 'Rakoto',
          prenom: 'Jean',
          email: 'jean.rakoto@fashion.mg',
          telephone: '+261 34 12 345 67'
        },
        //test
        localisation: {
        zone: 'Zone A',
        etage: 'Rez-de-chaussée',
        numero: 'A-RC-01',
        surface: 45,
        latitude: -18.9138,   
        longitude: 47.5361    
      },
        categorie: categories[0]._id,
        sous_categories: [sousCategories[0]._id, sousCategories[1]._id],
        contact: {
          telephone: '+261 34 12 345 67',
          email: 'contact@fashionparadise.mg',
          facebook: 'fashionparadise',
          instagram: '@fashionparadise'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mardi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          jeudi: { ouvert: true, debut: '09:00', fin: '19:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '21:00' },
          samedi: { ouvert: true, debut: '10:00', fin: '21:00' },
          dimanche: { ouvert: true, debut: '10:00', fin: '18:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2025-01-15')
        }
      },
      {
        nom: 'TechZone',
        description: 'Le paradis des geeks ! Smartphones dernière génération, ordinateurs portables, accessoires gaming et bien plus. Prix compétitifs et garantie officielle.',
        logo: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=TZ',
        banniere: 'https://via.placeholder.com/1200x300/4ECDC4/FFFFFF?text=TechZone',
        gerant: {
          nom: 'Rabe',
          prenom: 'Sarah',
          email: 'sarah.rabe@techzone.mg',
          telephone: '+261 33 98 765 43'
        },
        localisation: {
          zone: 'Zone B',
          etage: '1er étage',
          numero: 'B-E1-12',
          surface: 60
        },
        categorie: categories[1]._id,
        sous_categories: [sousCategories[3]._id, sousCategories[4]._id],
        contact: {
          telephone: '+261 33 98 765 43',
          email: 'info@techzone.mg',
          site_web: 'https://techzone.mg',
          facebook: 'techzonemg',
          instagram: '@techzone_mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mardi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          jeudi: { ouvert: true, debut: '09:00', fin: '19:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '21:00' },
          samedi: { ouvert: true, debut: '10:00', fin: '21:00' },
          dimanche: { ouvert: false, debut: '00:00', fin: '00:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2025-01-20')
        }
      },
      {
        nom: 'Déco & Vous',
        description: 'Transformez votre intérieur avec nos meubles design et objets de décoration uniques. Style scandinave, moderne ou traditionnel malgache.',
        logo: 'https://via.placeholder.com/150/FFE66D/000000?text=DV',
        banniere: 'https://via.placeholder.com/1200x300/FFE66D/000000?text=Deco+Vous',
        gerant: {
          nom: 'Andry',
          prenom: 'Michel',
          email: 'michel.andry@deco.mg',
          telephone: '+261 32 45 678 90'
        },
        localisation: {
          zone: 'Zone C',
          etage: '2ème étage',
          numero: 'C-E2-05',
          surface: 80
        },
        categorie: categories[2]._id,
        sous_categories: [sousCategories[5]._id, sousCategories[6]._id],
        contact: {
          telephone: '+261 32 45 678 90',
          email: 'contact@decovous.mg',
          instagram: '@deco_vous'
        },
        horaires: {
          lundi: { ouvert: true, debut: '10:00', fin: '18:00' },
          mardi: { ouvert: true, debut: '10:00', fin: '18:00' },
          mercredi: { ouvert: true, debut: '10:00', fin: '18:00' },
          jeudi: { ouvert: true, debut: '10:00', fin: '18:00' },
          vendredi: { ouvert: true, debut: '10:00', fin: '20:00' },
          samedi: { ouvert: true, debut: '10:00', fin: '20:00' },
          dimanche: { ouvert: true, debut: '11:00', fin: '17:00' }
        },
        statut: {
          actif: true,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: false,
          date_validation: new Date('2025-02-01')
        }
      },
      {
        nom: 'BeautyShop',
        description: 'Votre boutique beauté et bien-être. Cosmétiques, parfums, soins pour le visage et le corps. Marques premium et produits naturels.',
        logo: 'https://via.placeholder.com/150/FF8ED4/FFFFFF?text=BS',
        banniere: 'https://via.placeholder.com/1200x300/FF8ED4/FFFFFF?text=BeautyShop',
        gerant: {
          nom: 'Razafy',
          prenom: 'Nadia',
          email: 'nadia.razafy@beauty.mg',
          telephone: '+261 34 56 789 01'
        },
        localisation: {
          zone: 'Zone A',
          etage: '1er étage',
          numero: 'A-E1-08',
          surface: 35
        },
        categorie: categories[3]._id,
        sous_categories: [],
        contact: {
          telephone: '+261 34 56 789 01',
          email: 'hello@beautyshop.mg',
          facebook: 'beautyshop',
          instagram: '@beautyshop_mg',
          tiktok: '@beautyshop'
        },
        horaires: {
          lundi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mardi: { ouvert: true, debut: '09:00', fin: '19:00' },
          mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
          jeudi: { ouvert: true, debut: '09:00', fin: '19:00' },
          vendredi: { ouvert: true, debut: '09:00', fin: '21:00' },
          samedi: { ouvert: true, debut: '09:00', fin: '21:00' },
          dimanche: { ouvert: true, debut: '10:00', fin: '18:00' }
        },
        statut: {
          actif: false,
          valide_par_admin: false,
          en_attente_validation: true,
          suspendu: false
        }
      },
      {
        nom: 'Snack Express',
        description: 'Snacks, boissons fraîches et confiseries. Idéal pour une pause gourmande pendant vos achats !',
        logo: 'https://via.placeholder.com/150/95E1D3/000000?text=SE',
        banniere: 'https://via.placeholder.com/1200x300/95E1D3/000000?text=Snack+Express',
        gerant: {
          nom: 'Rasolofo',
          prenom: 'Patrick',
          email: 'patrick@snack.mg',
          telephone: '+261 33 112 22 33'
        },
        localisation: {
          zone: 'Zone D',
          etage: 'Rez-de-chaussée',
          numero: 'D-RC-03',
          surface: 25
        },
        categorie: categories[4]._id,
        sous_categories: [],
        contact: {
          telephone: '+261 33 113 22 33',
          email: 'contact@snackexpress.mg'
        },
        horaires: {
          lundi: { ouvert: true, debut: '08:00', fin: '20:00' },
          mardi: { ouvert: true, debut: '08:00', fin: '20:00' },
          mercredi: { ouvert: true, debut: '08:00', fin: '20:00' },
          jeudi: { ouvert: true, debut: '08:00', fin: '20:00' },
          vendredi: { ouvert: true, debut: '08:00', fin: '21:00' },
          samedi: { ouvert: true, debut: '08:00', fin: '21:00' },
          dimanche: { ouvert: true, debut: '09:00', fin: '19:00' }
        },
        statut: {
          actif: false,
          valide_par_admin: true,
          en_attente_validation: false,
          suspendu: true,
          motif_suspension: 'Non-paiement du loyer',
          date_suspension: new Date('2026-02-05')
        }
      }
    ];

   const boutiquesSaved = [];
        for (const b of boutiques) {
        const boutique = new Boutique(b);
        await boutique.save();  
        boutiquesSaved.push(boutique);
        }


    console.log('✓ 5 boutiques créées');

    console.log('\n SEED TERMINÉ !');
    console.log('Résumé :');
    console.log(`   - ${categories.length} catégories`);
    console.log(`   - ${sousCategories.length} sous-catégories`);
    console.log(`   - ${boutiques.length} boutiques`);
    
    process.exit(0);
  } catch (error) {
    console.error(' Erreur:', error);
    process.exit(1);
  }
};

seedBoutiques();