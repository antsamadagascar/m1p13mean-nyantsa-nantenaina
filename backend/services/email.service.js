const https = require('https');

// ============================================================
// Envoi via Brevo API (HTTPS)
// ============================================================
const sendEmail = async ({ to, subject, html }) => {
  const data = JSON.stringify({
    sender: {
      name:  'City Mall',
      email: process.env.EMAIL_FROM
    },
    to: [{ email: to }],
    subject,
    htmlContent: html
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers: {
        'accept':       'application/json',
        'content-type': 'application/json',
        'api-key':      process.env.BREVO_API_KEY,
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Brevo error ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// ============================================================
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL}/users/verify-email?token=${verificationToken}`;

  await sendEmail({
    to: user.email,
    subject: '✅ Confirmez votre inscription - M1P13 MEAN',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; margin: 20px 0; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Bienvenue sur City Mall !</h1></div>
          <div class="content">
            <h2>Bonjour ${user.prenom} ${user.nom},</h2>
            <p>Merci de vous être inscrit sur notre plateforme !</p>
            <p>Pour activer votre compte et commencer à utiliser nos services, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">✅ Confirmer mon email</a>
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
  });

  console.log(`✅ Email de vérification envoyé à ${user.email}`);
  return true;
};

// ============================================================
const sendWelcomeEmail = async (user) => {
  const loginLink = `${process.env.FRONTEND_URL}/login`;

  await sendEmail({
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
          <div class="header"><h1>🎉 Votre compte est activé !</h1></div>
          <div class="content">
            <h2>Félicitations ${user.prenom} !</h2>
            <p>Votre adresse email a été confirmée avec succès.</p>
            <p>Vous pouvez maintenant vous connecter et profiter de tous nos services :</p>
            <div style="text-align: center;">
              <a href="${loginLink}" class="button">🔑 Se connecter</a>
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
  });

  console.log(`✅ Email de bienvenue envoyé à ${user.email}`);
};

// ============================================================
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/users/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: '🔑 Réinitialisation de votre mot de passe - City Mall',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; margin: 20px 0; background-color: #7773c2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
          .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>🔑 Réinitialisation de mot de passe</h1></div>
          <div class="content">
            <h2>Bonjour ${user.prenom},</h2>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte City Mall.</p>
            <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
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
  });

  console.log(`✅ Email de réinitialisation envoyé à ${user.email}`);
  return true;
};

// ============================================================
const sendBoutiqueCreationEmail = async (boutique) => {
  const validationLink = `${process.env.FRONTEND_URL}/gerant/boutique/${boutique._id}`;

  await sendEmail({
    to: boutique.gerant.email,
    subject: '🏪 Votre boutique a été créée - En attente de validation',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; background-color: #f9fafb; }
          .info-box { background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; color: #4b5563; min-width: 140px; }
          .info-value { color: #1f2937; }
          .button { display: inline-block; padding: 14px 32px; margin: 10px 5px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .status-badge { display: inline-block; padding: 6px 12px; background-color: #fef3c7; color: #92400e; border-radius: 4px; font-size: 14px; font-weight: 600; }
          .alert { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>🎉 Votre boutique a été créée !</h1></div>
          <div class="content">
            <h2>Bonjour ${boutique.gerant.prenom} ${boutique.gerant.nom},</h2>
            <p>Nous sommes ravis de vous informer que votre boutique <strong>"${boutique.nom}"</strong> a été créée avec succès sur City Mall !</p>
            <div class="alert">
              <strong>📋 Statut actuel :</strong>
              <span class="status-badge">⏳ En attente de validation</span>
              <p style="margin-top: 10px; margin-bottom: 0;">Votre boutique est actuellement en cours de validation</p>
            </div>
            <div class="info-box">
              <h3 style="margin-top: 0; color: #1f2937;">📦 Informations de la boutique</h3>
              <div class="info-row"><span class="info-label">🏪 Nom :</span><span class="info-value">${boutique.nom}</span></div>
              <div class="info-row"><span class="info-label">📝 Description :</span><span class="info-value">${boutique.description}</span></div>
              <div class="info-row"><span class="info-label">📍 Emplacement :</span><span class="info-value">${boutique.localisation.emplacement_complet}</span></div>
              <div class="info-row"><span class="info-label">📐 Surface :</span><span class="info-value">${boutique.localisation.surface ? boutique.localisation.surface + ' m²' : 'Non renseignée'}</span></div>
              <div class="info-row"><span class="info-label">📞 Contact :</span><span class="info-value">${boutique.contact.telephone}</span></div>
              <div class="info-row"><span class="info-label">📧 Email :</span><span class="info-value">${boutique.contact.email}</span></div>
            </div>
            <div class="info-box">
              <h3 style="margin-top: 0; color: #1f2937;">👤 Informations du gérant</h3>
              <div class="info-row"><span class="info-label">👤 Nom complet :</span><span class="info-value">${boutique.gerant.prenom} ${boutique.gerant.nom}</span></div>
              <div class="info-row"><span class="info-label">📧 Email :</span><span class="info-value">${boutique.gerant.email}</span></div>
              <div class="info-row"><span class="info-label">📱 Téléphone :</span><span class="info-value">${boutique.gerant.telephone}</span></div>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${validationLink}" class="button">🏪 Validation</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>City Mall</strong> - Votre centre commercial en ligne</p>
            <p>&copy; 2026 City Mall - Tous droits réservés</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>Pour toute question, contactez-nous à <a href="mailto:support@citymall.com" style="color: #3b82f6;">support@citymall.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  console.log(`✅ Email de création de boutique envoyé à ${boutique.gerant.email}`);
  return true;
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBoutiqueCreationEmail
};