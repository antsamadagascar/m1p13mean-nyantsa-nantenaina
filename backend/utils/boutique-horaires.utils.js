/**
 * Utilitaires pour la gestion des horaires de boutique (Backend)
 * Fichier: utils/boutique-horaires.js
 */

/**
 * Obtient le nom du jour actuel en français
 * @returns {string}
 */
const getJourActuel = () => {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return jours[new Date().getDay()];
};

/**
 * Convertit une heure HH:MM en minutes.
 * - Si fin < debut → ajoute 1440 (fermeture le lendemain)
 * - Si fin = 00:00 → 1440 (minuit exact)
 * @param {number} h
 * @param {number} m
 * @param {boolean} estFin
 * @param {number|null} debutMinutes
 * @returns {number}
 */
const enMinutes = (h, m, estFin = false, debutMinutes = null) => {
  if (estFin && h === 0 && m === 0) return 1440;
  const minutes = h * 60 + m;
  if (estFin && debutMinutes !== null && minutes < debutMinutes) {
    return minutes + 1440; // fermeture le lendemain (ex: 08:00 → 01:00)
  }
  return minutes;
};

/**
 * Vérifie si un horaire chevauche minuit (ex: 20:00 → 02:00)
 * @param {Object} horaire
 * @returns {boolean}
 */
const chevaucheMinuit = (horaire) => {
  if (!horaire || !horaire.ouvert) return false;
  const [hD, mD] = horaire.debut.split(':').map(Number);
  const [hF, mF] = horaire.fin.split(':').map(Number);
  const debut = hD * 60 + mD;
  const fin = hF * 60 + mF;
  return fin < debut || (hF === 0 && mF === 0);
};

/**
 * Vérifie si la boutique est ouverte maintenant
 * @param {Object} horaires - Horaires de la boutique
 * @returns {boolean}
 */
const estOuverte = (horaires) => {
  if (!horaires) return false;

  const joursNoms = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const maintenant = new Date();
  const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
  const jourIndex = maintenant.getDay();

  // Vérifier le jour actuel
  const horaire = horaires[joursNoms[jourIndex]];
  if (horaire && horaire.ouvert) {
    const [hD, mD] = horaire.debut.split(':').map(Number);
    const [hF, mF] = horaire.fin.split(':').map(Number);
    const debut = enMinutes(hD, mD);
    const fin = enMinutes(hF, mF, true, debut);
    // Si chevauchement minuit et qu'on est après minuit → tester avec +1440
    const heureTest = (fin > 1440 && heureActuelle < debut) ? heureActuelle + 1440 : heureActuelle;
    if (heureTest >= debut && heureTest <= fin) return true;
  }

  // Vérifier si le jour PRÉCÉDENT avait un horaire qui déborde sur aujourd'hui
  // ex: vendredi 20:00 → 02:00, il est samedi 01:00 → toujours ouvert
  const jourPrecedentIndex = (jourIndex + 6) % 7;
  const horairePrecedent = horaires[joursNoms[jourPrecedentIndex]];
  if (horairePrecedent && horairePrecedent.ouvert && chevaucheMinuit(horairePrecedent)) {
    const [hD, mD] = horairePrecedent.debut.split(':').map(Number);
    const [hF, mF] = horairePrecedent.fin.split(':').map(Number);
    const debut = enMinutes(hD, mD);
    const fin = enMinutes(hF, mF, true, debut);
    // L'heure actuelle vue depuis hier = heureActuelle + 1440
    const heureTest = heureActuelle + 1440;
    if (heureTest >= debut && heureTest <= fin) return true;
  }

  return false;
};

/**
 * Obtient le message de statut de la boutique
 * @param {Object} horaires - Horaires de la boutique
 * @returns {string}
 */
const getStatutMessage = (horaires) => {
  if (!horaires) return 'Horaires non définis';

  if (estOuverte(horaires)) return 'Ouverte maintenant';

  const maintenant = new Date();
  const jourActuel = maintenant.getDay();
  const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
  const joursNoms = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  for (let i = 0; i < 7; i++) {
    const jour = (jourActuel + i) % 7;
    const nomJour = joursNoms[jour];
    const horaire = horaires[nomJour];

    if (horaire && horaire.ouvert) {
      const [hD, mD] = horaire.debut.split(':').map(Number);
      const [hF, mF] = horaire.fin.split(':').map(Number);
      const debutMinutes = enMinutes(hD, mD);
      const finMinutes = enMinutes(hF, mF, true, debutMinutes);

      if (i === 0) {
        // Heure d'ouverture pas encore atteinte → ouvre aujourd'hui
        if (heureActuelle < debutMinutes) {
          return `Ouvre aujourd'hui à ${horaire.debut}`;
        }
        // Sinon l'horaire d'aujourd'hui est terminé → jour suivant
        continue;
      }

      if (i === 1) return `Ouvre demain à ${horaire.debut}`;
      return `Ouvre ${nomJour} à ${horaire.debut}`;
    }
  }

  return 'Fermée';
};

/**
 * Obtient les horaires du jour actuel
 * @param {Object} horaires - Horaires de la boutique
 * @returns {string}
 */
const getHorairesAujourdhui = (horaires) => {
  if (!horaires) return 'Non disponible';
  const jour = getJourActuel();
  const horaire = horaires[jour];
  if (!horaire || !horaire.ouvert) return "Fermé aujourd'hui";
  return `${horaire.debut} - ${horaire.fin}`;
};

/**
 * Vérifie si c'est aujourd'hui
 * @param {string} jour
 * @returns {boolean}
 */
const estAujourdhui = (jour) => jour === getJourActuel();

/**
 * Obtient la liste ordonnée des jours (lundi en premier)
 * @returns {Array<string>}
 */
const getJoursOrdre = () => {
  return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
};

/**
 * Formate un horaire pour l'affichage
 * @param {Object} horaire
 * @returns {string}
 */
const formatHoraire = (horaire) => {
  if (!horaire || !horaire.ouvert) return 'Fermé';
  return `${horaire.debut} - ${horaire.fin}`;
};

/**
 * Vérifie si la boutique sera ouverte à une heure donnée
 * @param {Object} horaires
 * @param {string} heure - HH:MM
 * @param {string} [jour]
 * @returns {boolean}
 */
const seraOuverte = (horaires, heure, jour = null) => {
  if (!horaires) return false;

  const jourCible = jour || getJourActuel();
  const horaire = horaires[jourCible];
  if (!horaire || !horaire.ouvert) return false;

  const [heureTest, minTest] = heure.split(':').map(Number);
  const [hD, mD] = horaire.debut.split(':').map(Number);
  const [hF, mF] = horaire.fin.split(':').map(Number);

  const debutMinutes = enMinutes(hD, mD);
  const finMinutes = enMinutes(hF, mF, true, debutMinutes);
  let heureTestMinutes = enMinutes(heureTest, minTest || 0);

  // Si chevauchement minuit et heure testée est avant le début → +1440
  if (finMinutes > 1440 && heureTestMinutes < debutMinutes) {
    heureTestMinutes += 1440;
  }

  return heureTestMinutes >= debutMinutes && heureTestMinutes <= finMinutes;
};

/**
 * Calcule le nombre d'heures d'ouverture dans la semaine
 * @param {Object} horaires
 * @returns {number}
 */
const getHeuresOuverture = (horaires) => {
  if (!horaires) return 0;
  let totalMinutes = 0;

  getJoursOrdre().forEach(jour => {
    const horaire = horaires[jour];
    if (horaire && horaire.ouvert) {
      const [hD, mD] = horaire.debut.split(':').map(Number);
      const [hF, mF] = horaire.fin.split(':').map(Number);
      const debut = enMinutes(hD, mD);
      const fin = enMinutes(hF, mF, true, debut);
      totalMinutes += fin - debut;
    }
  });

  return Math.round(totalMinutes / 60);
};

/**
 * Obtient les jours d'ouverture
 * @param {Object} horaires
 * @returns {Array<string>}
 */
const getJoursOuverture = (horaires) => {
  if (!horaires) return [];
  return getJoursOrdre().filter(jour => {
    const horaire = horaires[jour];
    return horaire && horaire.ouvert;
  });
};

/**
 * Vérifie si la boutique est ouverte 7j/7
 * @param {Object} horaires
 * @returns {boolean}
 */
const estOuvert7j7 = (horaires) => getJoursOuverture(horaires).length === 7;

/**
 * Ajoute le statut estOuverte à une boutique
 * @param {Object} boutique
 * @returns {Object}
 */
const ajouterStatutOuverture = (boutique) => ({
  ...boutique.toObject(),
  estOuverte: estOuverte(boutique.horaires),
  statutMessage: getStatutMessage(boutique.horaires)
});

/**
 * Ajoute le statut estOuverte à un tableau de boutiques
 * @param {Array} boutiques
 * @returns {Array}
 */
const ajouterStatutOuvertureBatch = (boutiques) =>
  boutiques.map(boutique => ajouterStatutOuverture(boutique));

module.exports = {
  getJourActuel,
  estOuverte,
  getStatutMessage,
  getHorairesAujourdhui,
  estAujourdhui,
  getJoursOrdre,
  formatHoraire,
  seraOuverte,
  getHeuresOuverture,
  getJoursOuverture,
  estOuvert7j7,
  ajouterStatutOuverture,
  ajouterStatutOuvertureBatch
};