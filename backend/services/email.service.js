const nodemailer = require('nodemailer');

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Vérification connexion
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur de configuration email:', error);
  } else {
    console.log('✅ Serveur email prêt');
  }
});

// Envoye de l'email de confirmation
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL}/users/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"CITY MALL" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: '✅ Confirmez votre inscription - M1P13 MEAN',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 30px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 20px 0;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur City Mall !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.prenom} ${user.nom},</h2>
            <p>Merci de vous être inscrit sur notre plateforme !</p>
            <p>Pour activer votre compte et commencer à utiliser nos services, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">
                ✅ Confirmer mon email
              </a>
            </div>
            
            
            <p><strong>Informations de votre compte :</strong></p>
            <ul>
              <li>Email : ${user.email}</li>
              <li>Nom : ${user.prenom} ${user.nom}</li>
              <li>Téléphone : ${user.telephone || 'Non renseigné'}</li>
              <li>Rôle : ${user.role}</li>
            </ul>
            
            <p>Ce lien expirera dans <strong>24 heures</strong>.</p>
            
            <p>Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 City Mall - Tous droits réservés</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de vérification envoyé à ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email');
  }
};

// Envoye de l'email de bienvenue après vérification
const sendWelcomeEmail = async (user) => {
  const loginLink = `${process.env.FRONTEND_URL}/login`;

  const mailOptions = {
    from: `"CITY MALL" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: '🎉 Bienvenue sur CITY MALL !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; margin: 20px 0; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Votre compte est activé !</h1>
          </div>
          <div class="content">
            <h2>Félicitations ${user.prenom} !</h2>
            <p>Votre adresse email a été confirmée avec succès.</p>
            <p>Vous pouvez maintenant vous connecter et profiter de tous nos services :</p>
            
            <div style="text-align: center;">
              <a href="${loginLink}" class="button">
                🔑 Se connecter
              </a>
            </div>
            
            <p><strong>Vos identifiants :</strong></p>
            <ul>
              <li>Email : ${user.email}</li>
              <li>Mot de passe : Celui que vous avez choisi lors de l'inscription</li>
            </ul>
            
            <p>Bon shopping ! 🛍️</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenue envoyé à ${user.email}`);
  } catch (error) {
    console.error('❌ Erreur envoi email de bienvenue:', error);
  }
};


// Envoye de l'email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/users/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"CITY MALL" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: '🔑 Réinitialisation de votre mot de passe - City Mall',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .header {
            background-color: #EF4444;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 30px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 20px 0;
            background-color: #7773c2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .warning {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 12px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.prenom},</h2>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte City Mall.</p>
            
            <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce lien expire dans <strong>1 heure</strong></li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Votre mot de passe actuel reste valide jusqu'à ce que vous en créiez un nouveau</li>
              </ul>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #4F46E5;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 City Mall - Tous droits réservés</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de réinitialisation envoyé à ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email de réinitialisation:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail  
};