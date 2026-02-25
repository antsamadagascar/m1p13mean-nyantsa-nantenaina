const paiementService = require('../services/paiement.service');
const Paiement = require('../models/Paiement');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    res.json(await paiementService.getAll(req.query, req.user));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    res.status(201).json(await paiementService.create(req.body));
  } catch (err) {
    const status = err.code === 11000 ? 400 : (err.status || 500);
    const message = err.code === 11000 ? 'Paiement déjà enregistré pour ce mois' : err.message;
    res.status(status).json({ message });
  }
};

exports.update = async (req, res) => {
  try {
    res.json(await paiementService.update(req.params.id, req.body));
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
};

exports.annuler = async (req, res) => {
  try {
    const paiement = await paiementService.annuler(req.params.id);
    res.json({ message: 'Paiement annulé avec succès', paiement });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.genererMois = async (req, res) => {
  try {
    res.json(await paiementService.genererMois(req.body.mois, req.body.annee, req.body.locations));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.genererAnnee = async (req, res) => {
  try {
    res.json(await paiementService.genererAnnee(req.body.annee, req.body.locations));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.exportFacture = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id)
      .populate('boutique');

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement introuvable' });
    }


    const reste = paiement.montant_du - paiement.montant_paye;
    const numeroFacture = `FAC-${paiement.annee}-${paiement._id.toString().slice(-5)}`;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${numeroFacture}.pdf`
    );

    doc.pipe(res);

    /* =========================
       HEADER AVEC LOGO
    ========================== */

    const logoPath = path.join(__dirname, '..', 'logos', 'logo-lacity-mall.png');

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 120 });
    }
    // doc.image(logoPath, 50, 40, { width: 120 });

    doc
      .fontSize(20)
      .fillColor('#000')
      .text('FACTURE', 400, 50, { align: 'right' });

    doc
      .fontSize(10)
      .text(`N° : ${numeroFacture}`, { align: 'right' })
      .text(`Date : ${new Date().toLocaleDateString()}`, { align: 'right' });

    doc.moveDown(4);

    /* =========================
       INFOS BOUTIQUE
    ========================== */

    doc
      .fontSize(12)
      .fillColor('#333')
      .text('Facturé à :')
      .moveDown(0.5)
      .font('Helvetica-Bold')
      .text(paiement.boutique.nom)
      .font('Helvetica')
      .moveDown();

    doc.moveDown();

    /* =========================
       TABLEAU
    ========================== */

    const tableTop = doc.y;
    const itemX = 50;
    const montantX = 400;

    // Header tableau
    doc
      .font('Helvetica-Bold')
      .text('Description', itemX, tableTop)
      .text('Montant (DH)', montantX, tableTop, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown(0.5);

    doc.font('Helvetica');

    // Ligne paiement
    doc
      .text(`Loyer mois ${paiement.mois}/${paiement.annee}`, itemX)
      .text(paiement.montant_du.toFixed(2), montantX, doc.y - 15, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown(2);

    /* =========================
       TOTALS
    ========================== */

    doc.font('Helvetica-Bold');

    doc
      .text('Montant dû :', 300)
      .text(`${paiement.montant_du.toFixed(2)} Ar`, montantX, doc.y - 15, { align: 'right' });

    doc
      .text('Montant payé :', 300)
      .text(`${paiement.montant_paye.toFixed(2)} DH`, montantX, doc.y - 15, { align: 'right' });

    doc
      .text('Reste à payer :', 300)
      .text(`${reste.toFixed(2)} DH`, montantX, doc.y - 15, { align: 'right' });

    doc.moveDown(2);

    /* =========================
       STATUT
    ========================== */

    doc
      .fontSize(12)
      .fillColor('#000')
      .text(`Statut : ${paiement.statut.toUpperCase()}`);

    if (paiement.statut === 'en_retard') {
      doc
        .fillColor('red')
        .text(`Retard : ${paiement.retard_jours} jour(s)`);
    }

    doc.moveDown(3);

    /* =========================
       FOOTER
    ========================== */

    doc
      .fontSize(10)
      .fillColor('#666')
      .text(
        'Merci pour votre confiance.\nLaCity Mall - Service Comptabilité',
        { align: 'center' }
      );

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur génération facture' });
  }
};