const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connecté"))
  .catch(err => console.log("MongoDB erreur:", err));

// Route API
app.get('/api/status', (req, res) => {
  const dbName = mongoose.connection.name || 'Inconnue';
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connectée' : 'Déconnectée';
  res.json({ 
    connected: mongoose.connection.readyState === 1,
    database: `${dbName} (${dbStatus})`
  });
});

app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/frontend/browser/index.html'));
});

app.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));