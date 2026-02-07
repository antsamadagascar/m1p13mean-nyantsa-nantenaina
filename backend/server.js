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


const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/authRoutes');

app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);

app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));



// Démarrage du serveur
app.listen(PORT, () => console.log(`✓ Serveur sur port ${PORT}`));
