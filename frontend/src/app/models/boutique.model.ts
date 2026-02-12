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
  horaires: any;
  statut: Statut;
  estOuverte?: boolean;
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
  etage: string;
  numero: string;
  emplacement_complet?: string;
  latitude?: number;
  longitude?: number;
  surface?: number;
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
