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

const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');

const boutiqueRoutes = require('./routes/boutique.routes');
const categorieRoutes = require('./routes/categorieRoutes');
const sousCategorieRoutes = require('./routes/sousCategorieRoutes');
const zoneRoutes = require('./routes/zone.routes'); 
const produitRoutes = require('./routes/produit.routes')

app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/sous-categories', sousCategorieRoutes);    
app.use('/api/zones', zoneRoutes);
app.use('/api/produits',produitRoutes);

app.use('/uploads', express.static('uploads'));

app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));


// Démarrage du serveur
app.listen(PORT, () => console.log(`✓ Serveur sur port ${PORT}`));
