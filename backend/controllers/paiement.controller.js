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
    const paiement = await Paiement.findById(req.params.id).populate('boutique');

    if (!paiement) return res.status(404).json({ message: 'Paiement introuvable' });

    const reste         = paiement.montant_du - paiement.montant_paye;
    const numeroFacture = `FAC-${paiement.annee}-${paiement._id.toString().slice(-5)}`;

    const doc = new PDFDocument({ margin: 0, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${numeroFacture}.pdf`);
    doc.pipe(res);

    // ── Palette ──────────────────────────────────────────────
    const DARK    = '#1A1A2E';
    const ACCENT  = '#E94560';
    const LIGHT   = '#F7F7F7';
    const MUTED   = '#888888';
    const WHITE   = '#FFFFFF';
    const SUCCESS = '#2ECC71';
    const WARNING = '#F39C12';
    const DANGER  = '#E74C3C';

    const W = 595;
    const M = 45;

    // ── Helper : rectangle arrondi ────────────────────────────
    function roundRect(x, y, w, h, r, fill) {
      doc.save().roundedRect(x, y, w, h, r).fill(fill).restore();
    }

    // ── Helper : badge statut ────────────────────────────────
    function badgeStatut(statut) {
      const map = {
        paye       : { label: '✓  PAYÉ',      color: SUCCESS },
        partiel    : { label: '◑  PARTIEL',    color: WARNING },
        en_retard  : { label: '✕  EN RETARD',  color: DANGER  },
        impaye     : { label: '✕  IMPAYÉ',     color: DANGER  },
      };
      return map[statut] || { label: statut.toUpperCase(), color: MUTED };
    }

    // ════════════════════════════════════════════════════════
    // HEADER
    // ════════════════════════════════════════════════════════
    roundRect(0, 0, W, 110, 0, DARK);

    const logoPath = path.join(__dirname, '..', 'logos', 'logo-lacity-mall.png');
    if (fs.existsSync(logoPath)) {
      try { doc.image(logoPath, M, 20, { height: 65 }); } catch (_) {}
    }

    doc.font('Helvetica-Bold').fontSize(28).fillColor(WHITE)
      .text('FACTURE', 0, 30, { align: 'right', width: W - M });

    doc.font('Helvetica').fontSize(10).fillColor(ACCENT)
      .text(`N°  ${numeroFacture}`, 0, 65, { align: 'right', width: W - M });

    // Liseré accent
    roundRect(0, 110, W, 5, 0, ACCENT);

    // ════════════════════════════════════════════════════════
    // BLOC DATE + STATUT
    // ════════════════════════════════════════════════════════
    const dateY = 125;
    roundRect(M, dateY, W - M * 2, 42, 6, LIGHT);

    const dateEmission = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const moisLabel = new Date(paiement.annee, paiement.mois - 1).toLocaleDateString('fr-FR', {
      month: 'long', year: 'numeric'
    });

    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
      .text('DATE D\'ÉMISSION',  M + 14,     dateY + 8)
      .text('PÉRIODE CONCERNÉE', W / 2 - 10, dateY + 8);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
      .text(dateEmission, M + 14,     dateY + 22)
      .text(moisLabel,    W / 2 - 10, dateY + 22);

    // Badge statut
    const badge = badgeStatut(paiement.statut);
    roundRect(W - M - 90, dateY + 9, 80, 22, 11, badge.color);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE)
      .text(badge.label, W - M - 88, dateY + 15, { width: 78, align: 'center' });

    // ════════════════════════════════════════════════════════
    // INFOS BOUTIQUE
    // ════════════════════════════════════════════════════════
    const clientY = dateY + 58;

    doc.font('Helvetica-Bold').fontSize(9).fillColor(ACCENT)
      .text('FACTURÉ À', M, clientY);
    doc.moveTo(M, clientY + 13).lineTo(M + 55, clientY + 13).lineWidth(1.5).stroke(ACCENT);

    doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK)
      .text(paiement.boutique.nom, M, clientY + 20);

    // Infos complémentaires boutique si disponibles
    doc.font('Helvetica').fontSize(10).fillColor(MUTED);
    if (paiement.boutique.telephone) doc.text(paiement.boutique.telephone, M, clientY + 38);
    if (paiement.boutique.adresse)   doc.text(paiement.boutique.adresse,   M, clientY + 53);

    // ════════════════════════════════════════════════════════
    // TABLEAU
    // ════════════════════════════════════════════════════════
    const tableTop = clientY + 105;

    // En-tête
    roundRect(M, tableTop, W - M * 2, 28, 6, DARK);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE)
      .text('DESCRIPTION',     M + 12,      tableTop + 9)
      .text('MONTANT (DH)',    W - M - 100, tableTop + 9, { width: 95, align: 'right' });

    // Ligne loyer
    const rowH = 38;
    roundRect(M, tableTop + 28, W - M * 2, rowH, 0, WHITE);
    doc.moveTo(M, tableTop + 28).lineTo(W - M, tableTop + 28).lineWidth(0.5).stroke('#E8E8E8');

    const descLoyer = `Loyer mensuel — ${moisLabel.charAt(0).toUpperCase() + moisLabel.slice(1)}`;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
      .text(descLoyer, M + 12, tableTop + 38);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
      .text(`${paiement.montant_du.toFixed(2)} DH`, W - M - 100, tableTop + 38, { width: 95, align: 'right' });

    // Bord bas tableau
    const tableBot = tableTop + 28 + rowH;
    doc.moveTo(M, tableBot).lineTo(W - M, tableBot).lineWidth(1).stroke('#DDDDDD');

    // ════════════════════════════════════════════════════════
    // BLOC TOTAUX
    // ════════════════════════════════════════════════════════
    const totauxX = W - M - 210;
    let   totauxY = tableBot + 20;

    function ligneTotal(label, valeur, bold = false, valColor = DARK) {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 11 : 10)
        .fillColor(MUTED)
        .text(label, totauxX, totauxY, { width: 120 });
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 11 : 10)
        .fillColor(valColor)
        .text(valeur, totauxX + 120, totauxY, { width: 90, align: 'right' });
      totauxY += bold ? 22 : 18;
    }

    ligneTotal('Montant dû',   `${paiement.montant_du.toFixed(2)} Ar`);
    ligneTotal('Montant payé', `${paiement.montant_paye.toFixed(2)} Ar`, false, SUCCESS);

    // Séparateur
    doc.moveTo(totauxX, totauxY).lineTo(W - M, totauxY).lineWidth(1).stroke('#DDDDDD');
    totauxY += 8;

    // Reste à payer
    const resteColor = reste <= 0 ? SUCCESS : DANGER;
    const resteLabel = reste <= 0 ? 'SOLDE' : 'RESTE À PAYER';
    roundRect(totauxX - 8, totauxY - 4, 220, 30, 6, DARK);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(WHITE)
      .text(resteLabel, totauxX, totauxY + 5, { width: 120 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(resteColor)
      .text(`${Math.abs(reste).toFixed(2)} Ar`, totauxX + 120, totauxY + 5, { width: 90, align: 'right' });

    totauxY += 40;

    // ════════════════════════════════════════════════════════
    // ALERTE RETARD (si applicable)
    // ════════════════════════════════════════════════════════
    if (paiement.statut === 'en_retard' && paiement.retard_jours > 0) {
      roundRect(M, totauxY, W - M * 2, 34, 6, '#FFF5F5');
      doc.moveTo(M, totauxY).lineTo(M, totauxY + 34).lineWidth(3).stroke(DANGER);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(DANGER)
        .text('⚠  PAIEMENT EN RETARD', M + 14, totauxY + 7);
      doc.font('Helvetica').fontSize(9).fillColor(DANGER)
        .text(`Retard de ${paiement.retard_jours} jour(s) — Merci de régulariser votre situation.`, M + 14, totauxY + 21);
      totauxY += 50;
    }

    // ════════════════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════════════════
    const footerY = 780;
    roundRect(0, footerY, W, 62, 0, DARK);
    doc.moveTo(0, footerY).lineTo(W, footerY).lineWidth(3).stroke(ACCENT);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
      .text('Merci pour votre confiance !', 0, footerY + 12, { align: 'center', width: W });
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text('LaCity Mall  ·  Service Comptabilité  ·  contact@lacitymall.ma', 0, footerY + 30, { align: 'center', width: W });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur génération facture' });
  }
};