const express = require('express');  
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware CORS
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Middleware pour parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✓ MongoDB connecté"))
  .catch(err => console.log("✗ MongoDB erreur:", err));

// Route de test
app.get('/api/status', (req, res) => {
  const dbName = mongoose.connection.name || 'Inconnue';
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connectée' : 'Déconnectée';
  res.json({ 
    connected: mongoose.connection.readyState === 1,
    database: `${dbName} (${dbStatus})`
  });
});

require('./models/User');
require('./models/Boutique');
require('./models/Categorie');
require('./models/SousCategorie');
require('./models/Zone'); 
require('./models/Produit');
require('./models/Promotion');
require('./models/Panier');
require('./models/Commande');

const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');

const boutiqueRoutes = require('./routes/boutique.routes');
const categorieRoutes = require('./routes/categorie.routes');
const sousCategorieRoutes = require('./routes/sousCategorie.routes');
const zoneRoutes = require('./routes/zone.routes'); 
const produitRoutes = require('./routes/produit.routes');
const promotionRoutes = require('./routes/promotion.routes');

const { boutiqueRouter, produitRouter, adminRouter } = require('./routes/evaluation.routes');

const panierRoutes = require('./routes/panier.routes');
const commandeRoutes = require('./routes/commande.routes');


app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/sous-categories', sousCategorieRoutes);    
app.use('/api/zones', zoneRoutes);
app.use('/api/produits',produitRoutes);
app.use('/api/panier',panierRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api', promotionRoutes);

app.use('/api/boutiques/:boutiqueId/evaluations', boutiqueRouter);
app.use('/api/produits/:produitId/evaluations', produitRouter);
app.use('/api/evaluations', adminRouter);
app.use('/api/favoris', require('./routes/favori.routes'));

app.use('/uploads', express.static('uploads'));


app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));


// Démarrage du serveur
app.listen(PORT, () => console.log(`✓ Serveur sur port ${PORT}`));
