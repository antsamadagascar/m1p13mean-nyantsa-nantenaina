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
    console.log('MongoDB connecté\n');

    await MouvementStock.deleteMany({});
    await Produit.deleteMany({});
    console.log('  Produits et mouvements supprimés\n');

    const boutiques = await Boutique.find();
    if (!boutiques.length) {
      console.log(' Aucune boutique trouvée. Lancez d\'abord 02-boutique.seed.js');
      process.exit(1);
    }

    const getBoutique = (nom) => {
      const b = boutiques.find(b => b.nom === nom);
      if (!b) { console.log(`  Boutique "${nom}" introuvable`); process.exit(1); }
      return b;
    };

    const fashionShop   = getBoutique('Fashion Shop');
    const techStore     = getBoutique('Tech Store');
    const homeDecor     = getBoutique('Home Decor');
    const kidsShop      = getBoutique('Kids Fashion');
    const computerWorld = getBoutique('Computer World');

    console.log(' Boutiques trouvées :');
    boutiques.forEach(b => console.log(`   - ${b.nom} (${b._id})`));
    console.log('');

    const categories     = await Categorie.find();
    const sousCategories = await SousCategorie.find();

    const getCat  = (nom) => categories.find(c => c.nom === nom);
    const getSCat = (nom) => sousCategories.find(sc => sc.nom === nom);

    const produitsData = [

      // ════════════════════════════════════════════
      // FASHION SHOP — Boutique principale pour test
      // Vêtements + Électronique + Maison & Déco
      // ════════════════════════════════════════════

      // ── Vêtements Homme ──
      {
        boutiqueRef: fashionShop,
        nom: 'T-shirt Nike Sportswear Premium',
        description: 'T-shirt iconique Nike en coton 100% biologique certifié. Coupe moderne ajustée. Logo Swoosh brodé haute qualité. Tissu respirant, coutures renforcées.',
        description_courte: 'T-shirt Nike - Coton bio, Logo brodé',
        reference: 'VET-NIKE-TS-01', marque: 'Nike', prix: 85000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Homme', quantite: 50,
        tags: ['tshirt','nike','sport','casual'],
        images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', principale: true, alt: 'T-shirt Nike', ordre: 0 }],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'S',  sku: 'VET-NIKE-TS-S',  quantite: 12, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'S'}]  },
          { nom: 'M',  sku: 'VET-NIKE-TS-M',  quantite: 15, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'M'}]  },
          { nom: 'L',  sku: 'VET-NIKE-TS-L',  quantite: 13, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'L'}]  },
          { nom: 'XL', sku: 'VET-NIKE-TS-XL', quantite: 10, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'XL'}] }
        ]
      },
      {
        boutiqueRef: fashionShop,
        nom: 'T-shirt Adidas Originals Trefoil',
        description: 'T-shirt classique Adidas logo Trefoil. Coton doux coupe regular fit. Style streetwear authentique années 80.',
        description_courte: 'T-shirt Adidas Trefoil - Streetwear',
        reference: 'VET-ADI-TF-01', marque: 'Adidas', prix: 75000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Homme', quantite: 40,
        tags: ['tshirt','adidas','streetwear'],
        images: [{ url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800', principale: true, alt: 'T-shirt Adidas', ordre: 0 }],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'S',  sku: 'VET-ADI-TF-S',  quantite: 10, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'S'}]  },
          { nom: 'M',  sku: 'VET-ADI-TF-M',  quantite: 12, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'M'}]  },
          { nom: 'L',  sku: 'VET-ADI-TF-L',  quantite: 10, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'L'}]  },
          { nom: 'XL', sku: 'VET-ADI-TF-XL', quantite:  8, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'XL'}] }
        ]
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Jean Levi\'s 501 Original Fit',
        description: 'Jean légendaire depuis 1873. Coupe droite iconique. Denim 100% coton 12oz. Stone wash vintage authentique.',
        description_courte: 'Jean Levi\'s 501 - Coupe droite',
        reference: 'VET-LEV-501', marque: 'Levi\'s', prix: 280000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Homme', quantite: 30,
        tags: ['jean','levis','denim'],
        images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', principale: true, alt: 'Jean Levi\'s', ordre: 0 }],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'W30L32', sku: 'VET-LEV-3032', quantite: 8, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'30/32'}] },
          { nom: 'W32L32', sku: 'VET-LEV-3232', quantite: 8, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'32/32'}] },
          { nom: 'W34L32', sku: 'VET-LEV-3432', quantite: 8, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'34/32'}] },
          { nom: 'W32L34', sku: 'VET-LEV-3234', quantite: 6, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'32/34'}] }
        ]
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Veste en cuir homme noir',
        description: 'Veste en cuir véritable coupe slim. Doublure satin. Fermetures zips. Style biker intemporel. Résistante et élégante.',
        description_courte: 'Veste cuir homme - Slim, Style biker',
        reference: 'VET-VEST-CUIR-H', marque: 'LeatherCo', prix: 650000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Homme', quantite: 15,
        tags: ['veste','cuir','homme','biker'],
        images: [{ url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', principale: true, alt: 'Veste cuir', ordre: 0 }],
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Polo Ralph Lauren classique',
        description: 'Polo emblématique 100% coton piqué. Logo brodé cheval et cavalier. Coupe regular. Col côtelé. Disponible en plusieurs coloris.',
        description_courte: 'Polo Ralph Lauren - Coton piqué, Logo brodé',
        reference: 'VET-POLO-RL', marque: 'Ralph Lauren', prix: 320000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Homme', quantite: 35,
        tags: ['polo','ralph','lauren','classique'],
        images: [{ url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800', principale: true, alt: 'Polo Ralph Lauren', ordre: 0 }],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'S',  sku: 'VET-POLO-RL-S',  quantite: 8,  prix_supplement: 0, attributs: [{nom:'Taille',valeur:'S'}]  },
          { nom: 'M',  sku: 'VET-POLO-RL-M',  quantite: 10, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'M'}]  },
          { nom: 'L',  sku: 'VET-POLO-RL-L',  quantite: 10, prix_supplement: 0, attributs: [{nom:'Taille',valeur:'L'}]  },
          { nom: 'XL', sku: 'VET-POLO-RL-XL', quantite: 7,  prix_supplement: 0, attributs: [{nom:'Taille',valeur:'XL'}] }
        ]
      },

      // ── Vêtements Femme ──
      {
        boutiqueRef: fashionShop,
        nom: 'Robe de soirée élégante',
        description: 'Robe longue satin fluide. Coupe empire mettant en valeur la silhouette. Décolleté en V. Fermeture zip invisible. Parfaite pour mariages et galas.',
        description_courte: 'Robe soirée - Satin, Coupe empire',
        reference: 'VET-ROBE-SOIREE', marque: 'EleganceBy', prix: 450000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Femme', quantite: 20,
        tags: ['robe','soiree','femme','elegant'],
        images: [{ url: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800', principale: true, alt: 'Robe soirée', ordre: 0 }],
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Sac à main en cuir véritable',
        description: 'Sac cabas cuir véritable tannage végétal. Anse réglable. Compartiment zippé. Poche intérieure. Dimensions 35x28x12cm. Style chic et fonctionnel.',
        description_courte: 'Sac cuir - Cabas, Tannage végétal',
        reference: 'VET-SAC-CUIR-F', marque: 'LuxBag', prix: 380000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Femme', quantite: 18,
        tags: ['sac','cuir','femme','cabas'],
        images: [{ url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', principale: true, alt: 'Sac cuir', ordre: 0 }],
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Chaussures escarpins talons 8cm',
        description: 'Escarpins cuir verni talon aiguille 8cm. Bout pointu. Semelle intérieure rembourrée. Fermeture lanière cheville. Parfait pour soirées et bureau.',
        description_courte: 'Escarpins cuir verni - Talon 8cm',
        reference: 'VET-ESCA-8CM', marque: 'StepStyle', prix: 220000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Femme', quantite: 25,
        tags: ['chaussures','escarpins','femme','talon'],
        images: [{ url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800', principale: true, alt: 'Escarpins', ordre: 0 }],
        gestion_stock: 'VARIANTES',
        variantes: [
          { nom: 'Pointure 37', sku: 'VET-ESC-37', quantite: 5, prix_supplement: 0, attributs: [{nom:'Pointure',valeur:'37'}] },
          { nom: 'Pointure 38', sku: 'VET-ESC-38', quantite: 7, prix_supplement: 0, attributs: [{nom:'Pointure',valeur:'38'}] },
          { nom: 'Pointure 39', sku: 'VET-ESC-39', quantite: 7, prix_supplement: 0, attributs: [{nom:'Pointure',valeur:'39'}] },
          { nom: 'Pointure 40', sku: 'VET-ESC-40', quantite: 6, prix_supplement: 0, attributs: [{nom:'Pointure',valeur:'40'}] }
        ]
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Blazer femme coupe structurée',
        description: 'Blazer tailleur femme tissu crêpe structuré. Coupe droite moderne. Boutonnage simple. Poches décoratives. Parfait bureau ou soirée.',
        description_courte: 'Blazer femme - Crêpe, Coupe structurée',
        reference: 'VET-BLAZ-F', marque: 'OfficeLook', prix: 410000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Femme', quantite: 22,
        tags: ['blazer','femme','bureau','chic'],
        images: [{ url: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800', principale: true, alt: 'Blazer femme', ordre: 0 }],
      },

      // ── Électronique (accessoires mode tech) ──
      {
        boutiqueRef: fashionShop,
        nom: 'Montre connectée Samsung Galaxy Watch 6',
        description: 'Smartwatch premium AMOLED 1.3". Suivi santé avancé, ECG, tension artérielle. GPS intégré. Autonomie 40h. Résistance 5ATM. Compatible Android. Design sportif élégant.',
        description_courte: 'Galaxy Watch 6 - AMOLED, GPS, ECG',
        reference: 'ELEC-WATCH-GW6', marque: 'Samsung', prix: 850000,
        categorieNom: 'Électronique', sousCategorieNom: 'Accessoires', quantite: 20,
        tags: ['montre','connectee','samsung','smartwatch'],
        images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', principale: true, alt: 'Galaxy Watch 6', ordre: 0 }],
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Écouteurs AirPods Pro 2',
        description: 'Écouteurs True Wireless Apple. Réduction bruit active ANC H2. Mode transparence. Spatial Audio. Résistance IPX4. Autonomie 30h avec boîtier MagSafe.',
        description_courte: 'AirPods Pro 2 - ANC, Spatial Audio',
        reference: 'ELEC-AIRPODS-PRO2', marque: 'Apple', prix: 1200000,
        categorieNom: 'Électronique', sousCategorieNom: 'Accessoires', quantite: 15,
        tags: ['ecouteurs','airpods','apple','anc'],
        images: [{ url: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800', principale: true, alt: 'AirPods Pro 2', ordre: 0 }],
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Lunettes de soleil Ray-Ban Aviator',
        description: 'Lunettes aviator classiques Ray-Ban. Monture métal doré. Verres polarisés protection UV400. Indémodables depuis 1937. Étui et chiffon inclus.',
        description_courte: 'Ray-Ban Aviator - Polarisées, UV400',
        reference: 'ELEC-RB-AVIAT', marque: 'Ray-Ban', prix: 480000,
        categorieNom: 'Électronique', sousCategorieNom: 'Accessoires', quantite: 30,
        tags: ['lunettes','rayban','aviator','soleil'],
        images: [{ url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', principale: true, alt: 'Ray-Ban Aviator', ordre: 0 }],
      },

      // ── Maison & Déco (lifestyle) ──
      {
        boutiqueRef: fashionShop,
        nom: 'Miroir mural design doré',
        description: 'Miroir mural rond Ø80cm. Cadre métal doré brossé. Style art déco moderne. Fixations incluses. Apporte luminosité et élégance à tout intérieur.',
        description_courte: 'Miroir mural doré - Ø80cm, Art déco',
        reference: 'DECO-MIR-DORE', marque: 'DecoHome', prix: 185000,
        categorieNom: 'Maison et Déco', sousCategorieNom: 'Décoration', quantite: 20,
        tags: ['miroir','deco','dore','mural'],
        images: [{ url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800', principale: true, alt: 'Miroir doré', ordre: 0 }],
      },
      {
        boutiqueRef: fashionShop,
        nom: 'Parfum Chanel N°5 Eau de Parfum',
        description: 'Le parfum mythique Chanel depuis 1921. Notes florales aldéhydées. Jasmin, rose, ylang-ylang. Sillage envoûtant et persistant. Flacon élégant 100ml.',
        description_courte: 'Chanel N°5 EDP - 100ml, Floral aldéhydé',
        reference: 'DECO-CHAN-N5', marque: 'Chanel', prix: 950000,
        categorieNom: 'Maison et Déco', sousCategorieNom: 'Décoration', quantite: 12,
        tags: ['parfum','chanel','femme','luxe'],
        images: [{ url: 'https://images.unsplash.com/photo-1590156562745-5c4dde706b1c?w=800', principale: true, alt: 'Parfum Chanel N°5', ordre: 0 }]

      },

      // ════════════════════════════════════════════
      // AUTRES BOUTIQUES
      // ════════════════════════════════════════════

      // ── KIDS FASHION ──
      {
        boutiqueRef: kidsShop,
        nom: 'Ensemble pyjama enfant coton',
        description: 'Pyjama deux pièces coton doux 100%. Motifs animaux colorés. Fermetures pressions. Lavable machine. Tailles 2-12 ans.',
        description_courte: 'Pyjama enfant - Coton, Motifs animaux',
        reference: 'KID-PYJA-COT', marque: 'KidsComfort', prix: 65000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Enfant', quantite: 60,
        tags: ['enfant','pyjama','coton'],
        images: [{ url: 'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=800', principale: true, alt: 'Pyjama enfant', ordre: 0 }],
      },
      {
        boutiqueRef: kidsShop,
        nom: 'Veste imperméable garçon',
        description: 'Veste imperméable légère DryTech. Capuche ajustable. Poches zippées. Bandes réfléchissantes. Tailles 4-14 ans.',
        description_courte: 'Veste imperméable garçon - DryTech',
        reference: 'KID-VEST-IMP', marque: 'KidsOutdoor', prix: 120000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Enfant', quantite: 35,
        tags: ['enfant','veste','impermeable'],
        images: [{ url: 'https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=800', principale: true, alt: 'Veste garçon', ordre: 0 }],
      },
      {
        boutiqueRef: kidsShop,
        nom: 'Robe été fille fleurie',
        description: 'Robe légère coton fleuri. Bretelles réglables. Élastique taille confortable. Tailles 3-12 ans.',
        description_courte: 'Robe été fille - Coton fleuri',
        reference: 'KID-ROBE-ETE', marque: 'KidsStyle', prix: 75000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Enfant', quantite: 45,
        tags: ['enfant','robe','fille'],
        images: [{ url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800', principale: true, alt: 'Robe fille', ordre: 0 }],
      },
      {
        boutiqueRef: kidsShop,
        nom: 'Basket enfant sport',
        description: 'Chaussures sport légères. Semelle antidérapante. Fermeture scratch. Matière respirante. Tailles 28-38.',
        description_courte: 'Basket enfant - Scratch, Légère',
        reference: 'KID-BASKET-SP', marque: 'KidsSport', prix: 95000,
        categorieNom: 'Vêtements', sousCategorieNom: 'Enfant', quantite: 40,
        tags: ['enfant','basket','sport'],
        images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', principale: true, alt: 'Basket enfant', ordre: 0 }],
      },

      // ── TECH STORE ──
      {
        boutiqueRef: techStore,
        nom: 'iPhone 15 Pro Max',
        description: 'Puce A17 Pro. Écran Super Retina XDR 6.7". Caméra 48MP téléobjectif 5x. Titane aérospatial. 5G, MagSafe. 256GB.',
        description_courte: 'iPhone 15 Pro Max - A17 Pro, 48MP',
        reference: 'ELEC-IPHONE-15', marque: 'Apple', prix: 5200000,
        categorieNom: 'Électronique', sousCategorieNom: 'Téléphones', quantite: 12,
        tags: ['iphone','apple','5g'],
        images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', principale: true, alt: 'iPhone 15', ordre: 0 }],
      },
      {
        boutiqueRef: techStore,
        nom: 'Samsung Galaxy S24 Ultra',
        description: 'AMOLED 6.8" QHD+. Snapdragon 8 Gen 3. Capteur 200MP zoom 10x. S Pen inclus. 5000mAh charge 45W.',
        description_courte: 'Galaxy S24 Ultra - 200MP, S Pen',
        reference: 'ELEC-GALAXY-S24', marque: 'Samsung', prix: 4800000,
        categorieNom: 'Électronique', sousCategorieNom: 'Téléphones', quantite: 15,
        tags: ['samsung','galaxy','s-pen'],
        images: [{ url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', principale: true, alt: 'Samsung S24', ordre: 0 }],
      },
      {
        boutiqueRef: techStore,
        nom: 'PlayStation 5 Slim Digital',
        description: 'SSD 1TB ultra-rapide. Ray tracing. 4K HDR 120fps. Audio 3D. DualSense retour haptique.',
        description_courte: 'PS5 Slim - 1TB, Ray Tracing, 4K',
        reference: 'ELEC-PS5-SLIM', marque: 'Sony', prix: 2800000,
        categorieNom: 'Électronique', sousCategorieNom: 'Accessoires', quantite: 10,
        tags: ['ps5','gaming','sony'],
        images: [{ url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800', principale: true, alt: 'PS5', ordre: 0 }],
      },
      {
        boutiqueRef: techStore,
        nom: 'Écouteurs Bluetooth SoundPro',
        description: 'True Wireless ANC. Autonomie 30h. IPX5. Connexion multipoint. Son Hi-Fi haute définition.',
        description_courte: 'Écouteurs BT - ANC, 30h autonomie',
        reference: 'ELEC-ECOUT-BT', marque: 'SoundPro', prix: 380000,
        categorieNom: 'Électronique', sousCategorieNom: 'Accessoires', quantite: 25,
        tags: ['ecouteurs','bluetooth','anc'],
        images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', principale: true, alt: 'Écouteurs BT', ordre: 0 }],
      },

      // ── COMPUTER WORLD ──
      {
        boutiqueRef: computerWorld,
        nom: 'MacBook Pro M3 Max 16"',
        description: 'M3 Max 16 cœurs CPU, 40 GPU. Retina XDR 16.2" 120Hz. 48GB RAM. SSD 1TB. Autonomie 22h.',
        description_courte: 'MacBook Pro 16" - M3 Max, 48GB',
        reference: 'ELEC-MBP-M3', marque: 'Apple', prix: 12500000,
        categorieNom: 'Électronique', sousCategorieNom: 'Ordinateurs', quantite: 5,
        tags: ['macbook','apple','pro'],
        images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', principale: true, alt: 'MacBook Pro', ordre: 0 }],
      },
      {
        boutiqueRef: computerWorld,
        nom: 'Dell XPS 15 9530',
        description: 'Core i9-13900H. RTX 4070 8GB. OLED 3.5K 15.6". 32GB DDR5. SSD 1TB. Windows 11 Pro.',
        description_courte: 'Dell XPS 15 - i9, RTX 4070, OLED',
        reference: 'ELEC-DELL-XPS', marque: 'Dell', prix: 9500000,
        categorieNom: 'Électronique', sousCategorieNom: 'Ordinateurs', quantite: 8,
        tags: ['dell','xps','gaming','pro'],
        images: [{ url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800', principale: true, alt: 'Dell XPS', ordre: 0 }],
      },
      {
        boutiqueRef: computerWorld,
        nom: 'Chargeur rapide 65W GaN USB-C',
        description: 'GaN compact 65W. PD 3.0. 2 ports USB-C + 1 USB-A. Compatible MacBook, laptop, smartphone. Certifié CE.',
        description_courte: 'Chargeur 65W GaN - PD 3.0, Multi-ports',
        reference: 'ELEC-CHARG-65W', marque: 'GaNPower', prix: 95000,
        categorieNom: 'Électronique', sousCategorieNom: 'Accessoires', quantite: 50,
        tags: ['chargeur','usbc','rapide','gan'],
        images: [{ url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800', principale: true, alt: 'Chargeur USB-C', ordre: 0 }],
      },

      // ── HOME DECOR ──
      {
        boutiqueRef: homeDecor,
        nom: 'Canapé d\'angle Scandi 5 places',
        description: 'Design scandinave. Tissu chenille gris. Mousse HD 35kg/m³. 5 places. Pieds chêne. L290xP160xH85cm.',
        description_courte: 'Canapé Scandi 5 places - Chenille gris',
        reference: 'DECO-CANAPE-SCANDI', marque: 'NordicHome', prix: 1850000,
        categorieNom: 'Maison et Déco', sousCategorieNom: 'Meubles', quantite: 4,
        tags: ['canape','scandinave','salon'],
        images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', principale: true, alt: 'Canapé Scandi', ordre: 0 }],
      },
      {
        boutiqueRef: homeDecor,
        nom: 'Table basse en chêne massif',
        description: 'Chêne massif 100%. Plateau 4cm huile naturelle. Pieds acier noir. L120xl60xH45cm.',
        description_courte: 'Table basse chêne - Design industriel',
        reference: 'DECO-TABLE-CHENE', marque: 'WoodCraft', prix: 450000,
        categorieNom: 'Maison et Déco', sousCategorieNom: 'Meubles', quantite: 8,
        tags: ['table','chene','bois'],
        images: [{ url: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800', principale: true, alt: 'Table chêne', ordre: 0 }],
      },
      {
        boutiqueRef: homeDecor,
        nom: 'Lampe sur pied Arc Design',
        description: 'Lampadaire arc métal doré. Abat-jour lin beige. Base marbre 30kg. Hauteur 180-200cm. E27 60W.',
        description_courte: 'Lampadaire Arc - Doré, Base marbre',
        reference: 'DECO-LAMPE-ARC', marque: 'LuxLight', prix: 320000,
        categorieNom: 'Maison et Déco', sousCategorieNom: 'Décoration', quantite: 12,
        tags: ['lampe','arc','salon','deco'],
        images: [{ url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', principale: true, alt: 'Lampe Arc', ordre: 0 }],
      },
      {
        boutiqueRef: homeDecor,
        nom: 'Tapis berbère fait main 200x300cm',
        description: 'Tissé main artisans marocains. Laine 100% 2cm. Motifs géométriques. 200x300cm. Base antidérapante.',
        description_courte: 'Tapis Berbère 200x300 - Laine main',
        reference: 'DECO-TAPIS-BERB', marque: 'Atlas Carpet', prix: 680000,
        categorieNom: 'Maison et Déco', sousCategorieNom: 'Décoration', quantite: 6,
        tags: ['tapis','berbere','laine'],
        images: [{ url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800', principale: true, alt: 'Tapis berbère', ordre: 0 }],
      },
    ];

    // ============================================
    // INSERTION inventaires
    // ============================================
    console.log(' Création des produits...\n');
    let compteur = 0;
    const boutiquesStats = {};

    for (const data of produitsData) {
      try {
        const categorie     = getCat(data.categorieNom);
        const sousCategorie = getSCat(data.sousCategorieNom);

        if (!categorie) {
          console.log(` Catégorie "${data.categorieNom}" introuvable pour ${data.nom}`);
          continue;
        }

        // ── Calcul la quantité totale  ──
        const modeGestion = data.gestion_stock || 'SIMPLE';
        let quantiteTotale = data.quantite || 0;

        if (modeGestion === 'VARIANTES' && data.variantes?.length) {
          quantiteTotale = data.variantes.reduce((sum, v) => sum + (v.quantite || 0), 0);
        }

        const produit = await Produit.create({
          nom:                data.nom,
          description:        data.description,
          description_courte: data.description_courte,
          reference:          data.reference,
          marque:             data.marque,
          prix:               data.prix,
          boutique:           data.boutiqueRef._id,
          categorie:          categorie._id,
          sous_categorie:     sousCategorie?._id,
          quantite:           quantiteTotale,  
          statut:             'ACTIF',
          condition:          'NEUF',
          tags:               data.tags   || [],
          images:             data.images || [],
          gestion_stock:      modeGestion,
          variantes:          data.variantes || [],
        });

        // ── Crée les mouvements de stock initiaux ──
        if (modeGestion === 'VARIANTES' && data.variantes?.length) {
          // Un mouvement PAR variante
          const mouvements = data.variantes
            .filter(v => v.quantite > 0)
            .map(v => ({
              produit:            produit._id,
              type:               'ENTREE',
              quantite:           v.quantite,
              motif:              'Stock initial (seed)',
              boutique:           data.boutiqueRef._id,
              variante_sku:       v.sku       || null,
              variante_nom:       v.nom       || null,
              variante_attributs: v.attributs || [],
              quantite_avant:     0,
              quantite_apres:     v.quantite,
            }));

          await MouvementStock.insertMany(mouvements);
          console.log(`     └─ ${mouvements.length} variante(s) : ${data.variantes.map(v => `${v.sku}(${v.quantite})`).join(', ')}`);

        } else {
          // Produit simple — un seul mouvement
          await MouvementStock.create({
            produit:        produit._id,
            type:           'ENTREE',
            quantite:       quantiteTotale,
            motif:          'Stock initial (seed)',
            boutique:       data.boutiqueRef._id,
            variante_sku:   null,
            variante_nom:   null,
            quantite_avant: 0,
            quantite_apres: quantiteTotale,
          });
        }

        compteur++;
        if (!boutiquesStats[data.boutiqueRef.nom]) boutiquesStats[data.boutiqueRef.nom] = 0;
        boutiquesStats[data.boutiqueRef.nom]++;

        const stockInfo = modeGestion === 'VARIANTES'
          ? `${data.variantes?.length} variantes — stock total: ${quantiteTotale}`
          : `stock: ${quantiteTotale}`;
        console.log(` [${data.boutiqueRef.nom}] ${produit.nom} (${stockInfo})`);

      } catch (err) {
        console.error(`  ${data.nom}: ${err.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(` ${compteur}/${produitsData.length} produits créés\n`);
    console.log(' Répartition par boutique :');
    Object.entries(boutiquesStats).forEach(([nom, count]) => {
      const star = nom === 'Fashion Shop' ? '  (boutique test prof)' : '';
      console.log(` ${nom} : ${count} produits${star}`);
    });

    // process.exit(0);
  } catch (err) {
    console.error(' Erreur seed:', err.message);
    process.exit(1);
  }
}
module.exports = seedProduitsComplet
