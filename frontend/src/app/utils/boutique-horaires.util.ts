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
 * Convertit une heure HH:MM en minutes.
 * - Si fin < debut → ajoute 1440 (fermeture le lendemain)
 * - Si fin = 00:00 → 1440 (minuit exact)
 */
function enMinutes(h: number, m: number, estFin = false, debutMinutes: number | null = null): number {
  if (estFin && h === 0 && m === 0) return 1440;
  const minutes = h * 60 + m;
  if (estFin && debutMinutes !== null && minutes < debutMinutes) {
    return minutes + 1440; // fermeture le lendemain (ex: 08:00 → 01:00)
  }
  return minutes;
}

/**
 * Vérifie si un horaire chevauche minuit (ex: 20:00 → 02:00)
 */
function chevaucheMinuit(horaire: Horaire | null | undefined): boolean {
  if (!horaire || !horaire.ouvert) return false;
  const [hD, mD] = horaire.debut.split(':').map(Number);
  const [hF, mF] = horaire.fin.split(':').map(Number);
  const debut = hD * 60 + mD;
  const fin = hF * 60 + mF;
  return fin < debut || (hF === 0 && mF === 0);
}

/**
 * Vérifie si la boutique est ouverte maintenant
 */
export function estOuverte(horaires: HorairesBoutique | null | undefined): boolean {
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
    const heureTest = heureActuelle + 1440;
    if (heureTest >= debut && heureTest <= fin) return true;
  }

  return false;
}

/**
 * Obtient le message de statut de la boutique
 */
export function getStatutMessage(horaires: HorairesBoutique | null | undefined): string {
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
      const debutMinutes = enMinutes(hD, mD);

      if (i === 0) {
        if (heureActuelle < debutMinutes) {
          return `Ouvre aujourd'hui à ${horaire.debut}`;
        }
        continue;
      }

      if (i === 1) return `Ouvre demain à ${horaire.debut}`;
      return `Ouvre ${nomJour} à ${horaire.debut}`;
    }
  }

  return 'Fermée';
}

/**
 * Obtient les horaires du jour actuel
 */
export function getHorairesAujourdhui(horaires: HorairesBoutique | null | undefined): string {
  if (!horaires) return 'Non disponible';
  const jour = getJourActuel();
  const horaire = horaires[jour];
  if (!horaire || !horaire.ouvert) return "Fermé aujourd'hui";
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
  if (!horaire || !horaire.ouvert) return 'Fermé';
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

  if (finMinutes > 1440 && heureTestMinutes < debutMinutes) {
    heureTestMinutes += 1440;
  }

  return heureTestMinutes >= debutMinutes && heureTestMinutes <= finMinutes;
}

/**
 * Calcule le nombre d'heures d'ouverture dans la semaine
 */
export function getHeuresOuverture(horaires: HorairesBoutique | null | undefined): number {
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
}

/**
 * Obtient les jours d'ouverture
 */
export function getJoursOuverture(horaires: HorairesBoutique | null | undefined): string[] {
  if (!horaires) return [];
  return getJoursOrdre().filter(jour => {
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