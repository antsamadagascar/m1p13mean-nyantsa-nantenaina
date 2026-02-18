/**
 * Utilitaires pour la gestion des horaires de boutique (Frontend Angular)
 */

import { Horaire, HorairesBoutique } from '../models/boutique.model';

/**
 * Obtient le nom du jour actuel en français
 */
export function getJourActuel(): string {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return jours[new Date().getDay()];
}

/**
 * Vérifie si la boutique est ouverte maintenant
 */
export function estOuverte(horaires: HorairesBoutique | null | undefined): boolean {
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
}

/**
 * Obtient le message de statut de la boutique
 */
export function getStatutMessage(horaires: HorairesBoutique | null | undefined): string {
  if (!horaires) {
    return 'Horaires non définis';
  }

  if (estOuverte(horaires)) {
    return 'Ouverte maintenant';
  }

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
}

/**
 * Obtient les horaires du jour actuel
 */
export function getHorairesAujourdhui(horaires: HorairesBoutique | null | undefined): string {
  if (!horaires) {
    return 'Non disponible';
  }

  const jour = getJourActuel();
  const horaire = horaires[jour];

  if (!horaire || !horaire.ouvert) {
    return "Fermé aujourd'hui";
  }

  return `${horaire.debut} - ${horaire.fin}`;
}

/**
 * Vérifie si c'est aujourd'hui
 */
export function estAujourdhui(jour: string): boolean {
  return jour === getJourActuel();
}

/**
 * Obtient la liste ordonnée des jours (lundi en premier)
 */
export function getJoursOrdre(): string[] {
  return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
}

/**
 * Formate un horaire pour l'affichage
 */
export function formatHoraire(horaire: Horaire | null | undefined): string {
  if (!horaire || !horaire.ouvert) {
    return 'Fermé';
  }
  return `${horaire.debut} - ${horaire.fin}`;
}

/**
 * Vérifie si la boutique sera ouverte à une heure donnée
 */
export function seraOuverte(
  horaires: HorairesBoutique | null | undefined, 
  heure: string, 
  jour?: string
): boolean {
  if (!horaires) {
    return false;
  }

  const jourCible = jour || getJourActuel();
  const horaire = horaires[jourCible];

  if (!horaire || !horaire.ouvert) {
    return false;
  }

  const [heureTest, minTest] = heure.split(':').map(Number);
  const [heureDebut, minDebut] = horaire.debut.split(':').map(Number);
  const [heureFin, minFin] = horaire.fin.split(':').map(Number);

  const heureTestMinutes = heureTest * 60 + (minTest || 0);
  const heureDebutMinutes = heureDebut * 60 + minDebut;
  const heureFinMinutes = heureFin * 60 + minFin;

  return heureTestMinutes >= heureDebutMinutes && heureTestMinutes <= heureFinMinutes;
}

/**
 * Calcule le nombre d'heures d'ouverture dans la semaine
 */
export function getHeuresOuverture(horaires: HorairesBoutique | null | undefined): number {
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
}

/**
 * Obtient les jours d'ouverture
 */
export function getJoursOuverture(horaires: HorairesBoutique | null | undefined): string[] {
  if (!horaires) {
    return [];
  }

  const jours = getJoursOrdre();
  return jours.filter(jour => {
    const horaire = horaires[jour];
    return horaire && horaire.ouvert;
  });
}

/**
 * Vérifie si la boutique est ouverte 7j/7
 */
export function estOuvert7j7(horaires: HorairesBoutique | null | undefined): boolean {
  return getJoursOuverture(horaires).length === 7;
}