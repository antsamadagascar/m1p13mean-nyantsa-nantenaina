// ============================================
// INTERFACES POUR LES HORAIRES
// ============================================

// Ajoutez ces interfaces
export interface Evaluation {
  moyenne: number;
  total: number;
}

export interface EvaluationClient {
  _id?: string;
  boutique: string;
  client: string | { _id: string; nom: string; prenom: string; photo?: string };
  note: number;
  commentaire?: string;
  statut?: 'visible' | 'masque' | 'signale';
  date_creation?: Date;
}

export interface Horaire {
  ouvert: boolean;
  debut: string;
  fin: string;
}

export interface HorairesBoutique {
  lundi: Horaire;
  mardi: Horaire;
  mercredi: Horaire;
  jeudi: Horaire;
  vendredi: Horaire;
  samedi: Horaire;
  dimanche: Horaire;
  [key: string]: Horaire; // Index signature pour accès dynamique
}

// ============================================
// AUTRES INTERFACES
// ============================================

export interface Boutique {
  _id: string;
  nom: string;
  slug?: string;
  description: string;
  logo?: string;
  banniere?: string;
  gerant: Gerant;
  localisation: Localisation;
  categorie: string | Categorie;  
  sous_categories?: (string | SousCategorie)[];
  contact: Contact;
  horaires: HorairesBoutique; 
  statut: Statut;
  evaluation?: Evaluation;        // ← AJOUTÉ
  estOuverte?: boolean;
  statutMessage?: string;
  date_creation?: Date;
}

export interface Gerant {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

export interface Zone {
  _id: string;
  nom: string;
  slug?: string;
  description?: string;
  code?: string;
  actif?: boolean;
  ordre?: number;
}

export interface Localisation {
  zone: string | Zone;  
  numero: string;
  emplacement_complet?: string;
  latitude?: number;
  longitude?: number;
  surface?: number;
  adresse_complete?: string;
}

export interface Categorie {
  _id: string;
  nom: string;
}

export interface SousCategorie {
  _id: string;
  nom: string;
}

export interface Contact {
  telephone: string;
  email: string;
  site_web?: string;
  facebook?: string;
  instagram?: string;
}

export interface Statut {
  actif: boolean;
  en_attente_validation: boolean;
  suspendu: boolean;
  motif_suspension?: string;
}