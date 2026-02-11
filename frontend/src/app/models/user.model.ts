export interface User {
  _id?: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'ADMIN' | 'BOUTIQUE' | 'ACHETEUR';
  telephone?: string;
  avatar?: string;
  actif?: boolean;
  emailVerifie: boolean;
  dateInscription?: Date;
  dateSuspension?: Date;
  raisonSuspension?: string;
  dateReactivation?: Date;
  boutiqueId?: {
    _id: string;
    nom: string;
    adresse?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface InscriptionData {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  role?: string;
}

export interface ConnexionData {
  email: string;
  motDePasse: string;
}