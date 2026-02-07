const express = require('express');  // ← DÉCOMMENTEZ CETTE LIGNE !
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

// const User = require('./models/User');
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


const authRoutes = require('./routes/user.routes');

app.use('/api', authRoutes);

app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));

// IMPORTATION DES ROUTES (ajoutez ces lignes !)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Démarrage du serveur
app.listen(PORT, () => console.log(`✓ Serveur sur port ${PORT}`));
