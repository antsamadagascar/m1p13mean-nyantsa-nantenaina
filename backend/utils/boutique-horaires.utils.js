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
 * Vérifie si la boutique est ouverte maintenant
 * @param {Object} horaires - Horaires de la boutique
 * @returns {boolean}
 */
const estOuverte = (horaires) => {
  if (!horaires) {
    return false;
  }

  const jour = getJourActuel();
  const horaire = horaires[jour];

  if (!horaire || !horaire.ouvert) {
    return false;
  }

  const maintenant = new Date();
  const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();

  const [heureDebut, minDebut] = horaire.debut.split(':').map(Number);
  const [heureFin, minFin] = horaire.fin.split(':').map(Number);

  const debut = heureDebut * 60 + minDebut;
  const fin = heureFin * 60 + minFin;

  return heureActuelle >= debut && heureActuelle <= fin;
};

/**
 * Obtient le message de statut de la boutique
 * @param {Object} horaires - Horaires de la boutique
 * @returns {string}
 */
const getStatutMessage = (horaires) => {
  if (!horaires) {
    return 'Horaires non définis';
  }

  if (estOuverte(horaires)) {
    return 'Ouverte maintenant';
  }

  // Trouver la prochaine ouverture
  const maintenant = new Date();
  const jourActuel = maintenant.getDay();
  const joursNoms = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  for (let i = 0; i < 7; i++) {
    const jour = (jourActuel + i) % 7;
    const nomJour = joursNoms[jour];
    const horaire = horaires[nomJour];

    if (horaire && horaire.ouvert) {
      if (i === 0) {
        return `Ouvre aujourd'hui à ${horaire.debut}`;
      } else if (i === 1) {
        return `Ouvre demain à ${horaire.debut}`;
      } else {
        return `Ouvre ${nomJour} à ${horaire.debut}`;
      }
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
  if (!horaires) {
    return 'Non disponible';
  }

  const jour = getJourActuel();
  const horaire = horaires[jour];

  if (!horaire || !horaire.ouvert) {
    return "Fermé aujourd'hui";
  }

  return `${horaire.debut} - ${horaire.fin}`;
};

/**
 * Vérifie si c'est aujourd'hui
 * @param {string} jour - Nom du jour
 * @returns {boolean}
 */
const estAujourdhui = (jour) => {
  return jour === getJourActuel();
};

/**
 * Obtient la liste ordonnée des jours (lundi en premier)
 * @returns {Array<string>}
 */
const getJoursOrdre = () => {
  return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
};

/**
 * Formate un horaire pour l'affichage
 * @param {Object} horaire - Horaire à formater
 * @returns {string}
 */
const formatHoraire = (horaire) => {
  if (!horaire || !horaire.ouvert) {
    return 'Fermé';
  }
  return `${horaire.debut} - ${horaire.fin}`;
};

/**
 * Vérifie si la boutique sera ouverte à une heure donnée
 * @param {Object} horaires - Horaires de la boutique
 * @param {string} heure - Heure au format HH:MM
 * @param {string} [jour] - Jour (optionnel, par défaut aujourd'hui)
 * @returns {boolean}
 */
const seraOuverte = (horaires, heure, jour = null) => {
  if (!horaires) {
    return false;
  }

  const jourCible = jour || getJourActuel();
  const horaire = horaires[jourCible];

  if (!horaire || !horaire.ouvert) {
    return false;
  }

  // Correction : traiter correctement les minutes
  const [heureTest, minTest] = heure.split(':').map(Number);
  const [heureDebut, minDebut] = horaire.debut.split(':').map(Number);
  const [heureFin, minFin] = horaire.fin.split(':').map(Number);

  const heureTestMinutes = heureTest * 60 + (minTest || 0);
  const heureDebutMinutes = heureDebut * 60 + minDebut;
  const heureFinMinutes = heureFin * 60 + minFin;

  return heureTestMinutes >= heureDebutMinutes && heureTestMinutes <= heureFinMinutes;
};

/**
 * Calcule le nombre d'heures d'ouverture dans la semaine
 * @param {Object} horaires - Horaires de la boutique
 * @returns {number}
 */
const getHeuresOuverture = (horaires) => {
  if (!horaires) {
    return 0;
  }

  let totalMinutes = 0;
  const jours = getJoursOrdre();

  jours.forEach(jour => {
    const horaire = horaires[jour];
    if (horaire && horaire.ouvert) {
      const [hD, mD] = horaire.debut.split(':').map(Number);
      const [hF, mF] = horaire.fin.split(':').map(Number);
      const debut = hD * 60 + mD;
      const fin = hF * 60 + mF;
      totalMinutes += fin - debut;
    }
  });

  return Math.round(totalMinutes / 60);
};

/**
 * Obtient les jours d'ouverture
 * @param {Object} horaires - Horaires de la boutique
 * @returns {Array<string>}
 */
const getJoursOuverture = (horaires) => {
  if (!horaires) {
    return [];
  }

  const jours = getJoursOrdre();
  return jours.filter(jour => {
    const horaire = horaires[jour];
    return horaire && horaire.ouvert;
  });
};

/**
 * Vérifie si la boutique est ouverte 7j/7
 * @param {Object} horaires - Horaires de la boutique
 * @returns {boolean}
 */
const estOuvert7j7 = (horaires) => {
  return getJoursOuverture(horaires).length === 7;
};

/**
 * Ajoute le statut estOuverte à une boutique
 * @param {Object} boutique - Objet boutique
 * @returns {Object}
 */
const ajouterStatutOuverture = (boutique) => {
  return {
    ...boutique.toObject(),
    estOuverte: estOuverte(boutique.horaires),
    statutMessage: getStatutMessage(boutique.horaires)
  };
};

/**
 * Ajoute le statut estOuverte à un tableau de boutiques
 * @param {Array} boutiques - Tableau de boutiques
 * @returns {Array}
 */
const ajouterStatutOuvertureBatch = (boutiques) => {
  return boutiques.map(boutique => ajouterStatutOuverture(boutique));
};

// EXPORTS - TOUS LES EXPORTS SONT ICI
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