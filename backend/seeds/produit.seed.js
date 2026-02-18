const mongoose = require('mongoose');
const Produit = require('../models/Produit');
const MouvementStock = require('../models/MouvementStock');
const Boutique = require('../models/Boutique');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function seedProduitsComplet() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB connecté\n');

    // Nettoyage
    await MouvementStock.deleteMany({});
    await Produit.deleteMany({});
    console.log(' Produits et mouvements supprimés\n');

    const boutique = await Boutique.findOne();
    if (!boutique) {
      console.log(' Aucune boutique trouvée. Créez d\'abord une boutique.');
      process.exit(1);
    }

    const categories = await Categorie.find();
    const sousCategories = await SousCategorie.find();

    console.log(' Catégories disponibles:');
    categories.forEach(cat => console.log(`   - ${cat.nom}`));
    console.log('');

    // ============================================
    // DONNÉES COMPLÈTES PAR CATÉGORIE
    // ============================================

    const produitsData = [
      // ============================================
      // ÉLECTRONIQUE - Smartphones
      // ============================================
      {
        nom: 'iPhone 15 Pro Max',
        description: 'Le summum de la technologie Apple. Équipé de la puce A17 Pro révolutionnaire, cet iPhone offre des performances inégalées. Son écran Super Retina XDR de 6.7 pouces ProMotion 120Hz assure une fluidité exceptionnelle. Le système photo professionnel avec téléobjectif 5x vous permet de capturer des moments extraordinaires. Boîtier en titane de qualité aérospatiale, résistant et léger. Compatible 5G, charge rapide sans fil MagSafe, Face ID ultra-sécurisé. Autonomie toute la journée avec batterie optimisée par iOS 17. Stockage généreux de 256GB pour toutes vos photos, vidéos et applications.',
        description_courte: 'iPhone 15 Pro Max - Puce A17 Pro, Caméra 48MP, Titane',
        reference: 'ELEC-IPHONE-15-PM',
        marque: 'Apple',
        prix: 5200000,
        categorieNom: 'Électronique',
        sousCategorieNom: 'Smartphones',
        quantite: 12,
        condition: 'NEUF',
        tags: ['smartphone', 'apple', 'iphone', '5g', 'premium', 'high-tech'],
        images: [
          { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', principale: true, alt: 'iPhone 15 Pro Max Titane', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&crop=entropy', principale: false, alt: 'iPhone 15 Pro Max Face', ordre: 1 },
          { url: 'https://images.unsplash.com/photo-1592286927505-b0001267d8cc?w=800', principale: false, alt: 'iPhone 15 Pro Max Caméra', ordre: 2 }
        ]
      },
      {
        nom: 'Samsung Galaxy S24 Ultra',
        description: 'Le smartphone le plus avancé de Samsung. Écran Dynamic AMOLED 2X de 6.8 pouces avec résolution QHD+. Processeur Snapdragon 8 Gen 3 ultra-puissant. Appareil photo révolutionnaire avec capteur principal 200MP, zoom optique 10x et IA intégrée. S Pen inclus pour prendre des notes et dessiner. Batterie 5000mAh avec charge rapide 45W. Résistance IP68. 12GB RAM et 256GB stockage. One UI 6.1 basé sur Android 14. Mode nuit exceptionnel, stabilisation vidéo professionnelle.',
        description_courte: 'Galaxy S24 Ultra - 200MP, S Pen, 12GB RAM',
        reference: 'ELEC-GALAXY-S24-U',
        marque: 'Samsung',
        prix: 4800000,
        categorieNom: 'Électronique',
        sousCategorieNom: 'Smartphones',
        quantite: 15,
        condition: 'NEUF',
        tags: ['smartphone', 'samsung', 'galaxy', 'android', 's-pen'],
        images: [
          { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', principale: true, alt: 'Samsung Galaxy S24 Ultra', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&crop=entropy', principale: false, alt: 'Galaxy S24 Display', ordre: 1 }
        ]
      },
      
      // ============================================
      // ÉLECTRONIQUE - Ordinateurs
      // ============================================
      {
        nom: 'MacBook Pro M3 Max 16"',
        description: 'Station de travail portable ultime pour créateurs de contenu. Puce Apple M3 Max avec 16 cœurs CPU et 40 cœurs GPU offrant des performances époustouflantes. Écran Liquid Retina XDR 16.2 pouces avec technologie ProMotion jusqu\'à 120Hz et luminosité de 1600 nits. 48GB RAM unifiée ultra-rapide. SSD NVMe de 1TB. Autonomie jusqu\'à 22 heures. Ports Thunderbolt 4, HDMI, lecteur carte SD. Parfait pour montage vidéo 8K, développement, design 3D. macOS Sonoma préinstallé.',
        description_courte: 'MacBook Pro 16" - M3 Max, 48GB RAM, 1TB SSD',
        reference: 'ELEC-MBP-M3-MAX',
        marque: 'Apple',
        prix: 12500000,
        categorieNom: 'Électronique',
        sousCategorieNom: 'Ordinateurs',
        quantite: 5,
        condition: 'NEUF',
        tags: ['ordinateur', 'laptop', 'apple', 'macbook', 'pro', 'creator'],
        images: [
          { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', principale: true, alt: 'MacBook Pro M3', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', principale: false, alt: 'MacBook Pro Ouvert', ordre: 1 },
          { url: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=800', principale: false, alt: 'MacBook Pro Setup', ordre: 2 }
        ]
      },
      {
        nom: 'Dell XPS 15 9530',
        description: 'PC portable professionnel haut de gamme. Processeur Intel Core i9-13900H 13e génération. Carte graphique NVIDIA RTX 4070 8GB pour gaming et création. Écran InfinityEdge 15.6" OLED 3.5K tactile. 32GB RAM DDR5. SSD 1TB Gen4. Clavier rétroéclairé confortable. Webcam 1080p avec obturateur de confidentialité. Windows 11 Pro. Châssis en aluminium CNC. Connectivité WiFi 6E, Thunderbolt 4. Parfait pour professionnels exigeants.',
        description_courte: 'Dell XPS 15 - i9, RTX 4070, OLED 3.5K',
        reference: 'ELEC-DELL-XPS15',
        marque: 'Dell',
        prix: 9500000,
        categorieNom: 'Électronique',
        sousCategorieNom: 'Ordinateurs',
        quantite: 8,
        condition: 'NEUF',
        tags: ['ordinateur', 'laptop', 'dell', 'xps', 'gaming', 'pro'],
        images: [
          { url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', principale: true, alt: 'Dell XPS 15', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800', principale: false, alt: 'Dell XPS Clavier', ordre: 1 }
        ]
      },

      // ============================================
      // ÉLECTRONIQUE - Consoles & Gaming
      // ============================================
      {
        nom: 'PlayStation 5 Slim Digital',
        description: 'Console nouvelle génération de Sony au format compact. SSD ultra-rapide 1TB pour des temps de chargement quasi-instantanés. Ray tracing matériel pour graphismes photoréalistes. Support 4K HDR 120fps. Audio 3D Tempest pour immersion totale. Manette DualSense avec retour haptique et gâchettes adaptatives révolutionnaires. Rétrocompatible PS4. Lecteur 4K UHD Blu-ray. Design élégant et silencieux. Accès PlayStation Plus pour jouer en ligne.',
        description_courte: 'PS5 Slim Digital - 1TB, Ray Tracing, 4K',
        reference: 'ELEC-PS5-SLIM',
        marque: 'Sony',
        prix: 2800000,
        categorieNom: 'Électronique',
        sousCategorieNom: 'Consoles',
        quantite: 10,
        condition: 'NEUF',
        tags: ['console', 'playstation', 'ps5', 'gaming', 'sony'],
        images: [
          { url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800', principale: true, alt: 'PlayStation 5', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800', principale: false, alt: 'PS5 Controller', ordre: 1 }
        ]
      },

      // ============================================
      // VÊTEMENTS - T-shirts
      // ============================================
      {
        nom: 'T-shirt Nike Sportswear Premium',
        description: 'T-shirt iconique Nike en coton 100% biologique certifié. Coupe moderne ajustée mais confortable pour toutes morphologies. Logo Swoosh brodé haute qualité sur la poitrine. Tissu respirant qui évacue l\'humidité. Coutures renforcées pour durabilité maximale. Col rond côtelé qui garde sa forme. Parfait pour le sport, les loisirs ou le quotidien. Facile d\'entretien, lavable en machine. Disponible en plusieurs tailles. Design intemporel et élégant.',
        description_courte: 'T-shirt Nike - Coton 100%, Logo brodé',
        reference: 'VET-NIKE-TSHIRT-01',
        marque: 'Nike',
        prix: 85000,
        categorieNom: 'Vêtements',
        sousCategorieNom: 'T-shirts',
        quantite: 50,
        condition: 'NEUF',
        tags: ['vetement', 'tshirt', 'nike', 'sport', 'casual', 'coton'],
        images: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', principale: true, alt: 'T-shirt Nike', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800', principale: false, alt: 'Nike Tshirt Détail', ordre: 1 }
        ],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'Taille S', sku: 'VET-NIKE-TS-S', quantite: 12, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'S'}] },
          { nom: 'Taille M', sku: 'VET-NIKE-TS-M', quantite: 15, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'M'}] },
          { nom: 'Taille L', sku: 'VET-NIKE-TS-L', quantite: 13, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'L'}] },
          { nom: 'Taille XL', sku: 'VET-NIKE-TS-XL', quantite: 10, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'XL'}] }
        ]
      },
      {
        nom: 'T-shirt Adidas Originals Trefoil',
        description: 'T-shirt classique Adidas avec logo Trefoil emblématique. Fabriqué en coton doux et confortable pour un port agréable toute la journée. Coupe regular fit décontractée. Encolure ras du cou avec bande côtelée. Logo Trefoil imprimé grand format. Matière respirante idéale pour toutes saisons. Style streetwear authentique années 80. Finitions soignées. S\'associe facilement avec jeans, joggings ou shorts. Entretien facile.',
        description_courte: 'T-shirt Adidas Trefoil - Style streetwear',
        reference: 'VET-ADIDAS-TREFOIL',
        marque: 'Adidas',
        prix: 75000,
        categorieNom: 'Vêtements',
        sousCategorieNom: 'T-shirts',
        quantite: 40,
        condition: 'NEUF',
        tags: ['vetement', 'tshirt', 'adidas', 'streetwear', 'trefoil'],
        images: [
          { url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', principale: true, alt: 'T-shirt Adidas', ordre: 0 }
        ],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'Taille S', sku: 'VET-ADI-TF-S', quantite: 10, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'S'}] },
          { nom: 'Taille M', sku: 'VET-ADI-TF-M', quantite: 12, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'M'}] },
          { nom: 'Taille L', sku: 'VET-ADI-TF-L', quantite: 10, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'L'}] },
          { nom: 'Taille XL', sku: 'VET-ADI-TF-XL', quantite: 8, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: 'XL'}] }
        ]
      },

      // ============================================
      // VÊTEMENTS - Pantalons & Jeans
      // ============================================
      {
        nom: 'Jean Levi\'s 501 Original Fit',
        description: 'Le jean légendaire qui a révolutionné la mode depuis 1873. Coupe droite iconique qui sied à toutes les morphologies. Denim 100% coton robuste et confortable de 12oz. Boutons boutonnière signature. Rivets en cuivre aux points de tension pour durabilité exceptionnelle. Poches arrière arquées caractéristiques. Lavage stone wash pour aspect vintage authentique. Ceinture moyenne confortable. Taille fidèle. Se bonifie avec le temps. Fabriqué selon standards de qualité Levi\'s.',
        description_courte: 'Jean Levi\'s 501 - Coupe droite, Denim authentique',
        reference: 'VET-LEVIS-501',
        marque: 'Levi\'s',
        prix: 280000,
        categorieNom: 'Vêtements',
        sousCategorieNom: 'Pantalons',
        quantite: 30,
        condition: 'NEUF',
        tags: ['vetement', 'jean', 'levis', 'denim', '501', 'classique'],
        images: [
          { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', principale: true, alt: 'Jean Levi\'s 501', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800', principale: false, alt: 'Levi\'s 501 Détail', ordre: 1 }
        ],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'W30 L32', sku: 'VET-LEV-501-3032', quantite: 6, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: '30/32'}] },
          { nom: 'W32 L32', sku: 'VET-LEV-501-3232', quantite: 8, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: '32/32'}] },
          { nom: 'W34 L32', sku: 'VET-LEV-501-3432', quantite: 8, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: '34/32'}] },
          { nom: 'W32 L34', sku: 'VET-LEV-501-3234', quantite: 8, prix_supplement: 0, attributs: [{nom: 'Taille', valeur: '32/34'}] }
        ]
      },

      // ============================================
      // MAISON & DÉCO - Meubles
      // ============================================
      {
        nom: 'Canapé d\'angle Scandi 5 places',
        description: 'Canapé d\'angle moderne au design scandinave épuré. Structure en bois massif de pin certifié FSC. Revêtement en tissu chenille ultra-doux gris clair chiné, résistant et facile d\'entretien. Assises profondes avec coussins en mousse haute densité 35kg/m³ pour confort optimal. Dossiers inclinables avec système de relaxation. 5 places généreuses idéales pour familles. Pieds en chêne naturel inclinés. Dimensions: L290 x P160 x H85 cm. Livré avec 5 coussins décoratifs assortis. Montage facile avec notice illustrée.',
        description_courte: 'Canapé d\'angle Scandi - 5 places, Tissu chenille gris',
        reference: 'DECO-CANAPE-SCANDI',
        marque: 'NordicHome',
        prix: 1850000,
        categorieNom: 'Maison et Déco',
        sousCategorieNom: 'Meubles',
        quantite: 4,
        condition: 'NEUF',
        tags: ['meuble', 'canape', 'salon', 'scandinave', 'angle', 'moderne'],
        images: [
          { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', principale: true, alt: 'Canapé Scandinave', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', principale: false, alt: 'Canapé Angle', ordre: 1 },
          { url: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800', principale: false, alt: 'Canapé Salon', ordre: 2 }
        ]
      },
      {
        nom: 'Table basse en chêne massif',
        description: 'Table basse artisanale en chêne massif 100%. Plateau épais de 4cm avec finition huile naturelle protectrice qui révèle la beauté du grain. Pieds en acier noir mat design industriel. Structure robuste supportant 50kg. Dimensions parfaites: L120 x l60 x H45 cm. Rangement pratique sous plateau. Résiste aux taches et rayures. S\'intègre dans tous styles: moderne, industriel, scandinave. Fabriquée en Europe selon normes écologiques strictes. Chaque pièce est unique.',
        description_courte: 'Table basse Chêne massif - Design industriel',
        reference: 'DECO-TABLE-CHENE',
        marque: 'WoodCraft',
        prix: 450000,
        categorieNom: 'Maison et Déco',
        sousCategorieNom: 'Meubles',
        quantite: 8,
        condition: 'NEUF',
        tags: ['meuble', 'table', 'basse', 'chene', 'bois', 'industriel'],
        images: [
          { url: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800', principale: true, alt: 'Table basse chêne', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800', principale: false, alt: 'Table basse détail', ordre: 1 }
        ]
      },

      // ============================================
      // MAISON & DÉCO - Décoration
      // ============================================
      {
        nom: 'Lampe sur pied Arc Design',
        description: 'Lampadaire arc moderne en métal doré brossé. Bras arqué élégant de 200cm portée. Abat-jour en tissu lin beige naturel Ø40cm diffusant lumière douce et chaleureuse. Base en marbre véritable 30kg assurant stabilité parfaite. Interrupteur au pied. Compatible ampoule E27 LED jusqu\'à 60W (non incluse). Hauteur réglable 180-200cm. Câble textile tressé 3m. Éclairage d\'ambiance idéal pour coin lecture ou salon. Style mid-century chic intemporel.',
        description_courte: 'Lampadaire Arc - Métal doré, Base marbre',
        reference: 'DECO-LAMPE-ARC',
        marque: 'LuxLight',
        prix: 320000,
        categorieNom: 'Maison et Déco',
        sousCategorieNom: 'Décoration',
        quantite: 12,
        condition: 'NEUF',
        tags: ['deco', 'lampe', 'luminaire', 'design', 'arc', 'salon'],
        images: [
          { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', principale: true, alt: 'Lampe Arc', ordre: 0 }
        ]
      },
      {
        nom: 'Tapis berbère fait main 200x300cm',
        description: 'Authentique tapis berbère tissé main par artisans marocains. Laine 100% naturelle douce et épaisse 2cm. Motifs géométriques losanges noirs sur fond écru crème. Dimensions généreuses 200x300cm. Chaque pièce unique avec légères variations artisanales. Hypoallergénique et régulateur thermique naturel. Base antidérapante latex. Facile d\'entretien, aspiration régulière. Apporte chaleur et caractère à votre intérieur. Style bohème chic ethnique. Certification commerce équitable.',
        description_courte: 'Tapis Berbère 200x300 - Laine tissée main',
        reference: 'DECO-TAPIS-BERB',
        marque: 'Atlas Carpet',
        prix: 680000,
        categorieNom: 'Maison et Déco',
        sousCategorieNom: 'Décoration',
        quantite: 6,
        condition: 'NEUF',
        tags: ['deco', 'tapis', 'berbere', 'laine', 'artisan', 'ethnique'],
        images: [
          { url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800', principale: true, alt: 'Tapis Berbère', ordre: 0 },
          { url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800', principale: false, alt: 'Tapis Détail', ordre: 1 }
        ]
      },

      // ============================================
      // ALIMENTATION - Boissons
      // ============================================
      {
        nom: 'Jus d\'orange bio pressé à froid',
        description: 'Jus d\'orange 100% pur fruit sans aucun ajout. Oranges Valencia bio cultivées sans pesticides. Pressage à froid préservant vitamines et nutriments. Saveur authentique et intense. Riche en vitamine C naturelle. Sans sucre ajouté, sans conservateurs, sans colorants. Bouteille verre consignée 1L. À consommer dans 3 jours après ouverture. Secouer avant de servir. Conservation au frais. Agriculture biologique certifiée. Soutient producteurs locaux.',
        description_courte: 'Jus d\'orange Bio - Pressé froid 1L',
        reference: 'ALI-JUS-ORANGE-BIO',
        marque: 'BioFruits',
        prix: 12000,
        categorieNom: 'Alimentation',
        sousCategorieNom: 'Boissons',
        quantite: 100,
        condition: 'NEUF',
        tags: ['alimentation', 'jus', 'orange', 'bio', 'naturel', 'vitamine'],
        images: [
          { url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800', principale: true, alt: 'Jus d\'orange', ordre: 0 }
        ]
      }
    ];

    console.log('🌱 Création des produits...\n');
    let compteur = 0;

    for (let data of produitsData) {
      try {
        const categorie = categories.find(c => c.nom === data.categorieNom);
        const sousCategorie = sousCategories.find(sc => sc.nom === data.sousCategorieNom);

        if (!categorie) {
          console.log(`   ⚠️  Catégorie "${data.categorieNom}" introuvable pour ${data.nom}`);
          continue;
        }

        const produitData = {
          nom: data.nom,
          description: data.description,
          description_courte: data.description_courte,
          reference: data.reference,
          marque: data.marque,
          prix: data.prix,
          boutique: boutique._id,
          categorie: categorie._id,
          sous_categorie: sousCategorie?._id,
          quantite: data.quantite,
          statut: 'ACTIF',
          condition: data.condition || 'NEUF',
          tags: data.tags || [],
          images: data.images || [],
          gestion_stock: data.gestion_stock || 'SIMPLE',
          variantes: data.variantes || [],
          vues: Math.floor(Math.random() * 500) + 50,
          ventes: Math.floor(Math.random() * 100) + 10,
          note_moyenne: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          nombre_avis: Math.floor(Math.random() * 80) + 15
        };

        const produit = await Produit.create(produitData);

        // Mouvement de stock
        await MouvementStock.create({
          produit: produit._id,
          type: 'ENTREE',
          quantite: data.quantite,
          motif: 'Stock initial complet (seed)',
          boutique: boutique._id
        });

        compteur++;
        const emoji = data.categorieNom === 'Électronique' ? '📱' : 
                     data.categorieNom === 'Vêtements' ? '👕' : 
                     data.categorieNom === 'Maison et Déco' ? '🛋️' : '🥤';
        
        console.log(`   ${emoji} ${produit.nom} (${produit.reference})`);
        console.log(`      💰 Prix: ${produit.prix.toLocaleString()} Ar }`);
        console.log(`      📦 Stock: ${produit.quantite} unités`);
        if (produit.variantes && produit.variantes.length > 0) {
          console.log(`      🎨 Variantes: ${produit.variantes.length}`);
        }
        console.log('');

      } catch (error) {
        console.error(`   ❌ Erreur pour ${data.nom}:`, error.message);
      }
    }

    console.log('═══════════════════════════════════════════════════');
    console.log(`🎉 Seed terminé avec succès !`);
    console.log(`📦 ${compteur}/${produitsData.length} produits créés`);
    console.log('═══════════════════════════════════════════════════\n');

    // Statistiques par catégorie
    const stats = await Produit.aggregate([
      { $group: { 
        _id: '$categorie', 
        count: { $sum: 1 },
        totalStock: { $sum: '$quantite' }
      }},
      { $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categorie'
      }},
      { $unwind: '$categorie' }
    ]);

    console.log('📊 Statistiques par catégorie:');
    stats.forEach(stat => {
      console.log(`   ${stat.categorie.nom}: ${stat.count} produits, ${stat.totalStock} unités en stock`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur seed:', error);
    process.exit(1);
  }
}

seedProduitsComplet();