export interface Zone {
  _id?: string;
  nom: string;
  description?: string;
  code: string;
  coordonnees?: {
    latitude?: number;
    longitude?: number;
  };
  ordre?: number;
  actif?: boolean;
}
