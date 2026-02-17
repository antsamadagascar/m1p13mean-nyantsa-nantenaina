import { HorairesBoutique } from './boutique.model'; 


export interface Produit {
  _id: string;
  nom: string;
  slug: string;
  description: string;
  description_courte?: string;
  reference: string;
  marque?: string;
  prix: number;
  prix_promo?: number;
  pourcentage_reduction?: number;
  images: Array<{
    url: string;
    principale: boolean;
    alt?: string;
    ordre: number;
  }>;
  boutique: {
    _id: string;
    nom: string;
    slug: string;
    horaires?: HorairesBoutique; 
  };
  categorie: {
    _id: string;
    nom: string;
  };
  sous_categorie?: {
    _id: string;
    nom: string;
  };
  gestion_stock: 'SIMPLE' | 'VARIANTES';
  quantite: number;
  variantes?: Array<{
    _id: string;
    nom: string;
    sku: string;
    quantite: number;
    prix_supplement: number;
  }>;
  tags?: string[];
  statut: 'BROUILLON' | 'ACTIF' | 'RUPTURE' | 'ARCHIVE';
  condition: 'NEUF' | 'OCCASION' | 'RECONDITIONNE';
  vues: number;
  ventes: number;
  note_moyenne: number;
  nombre_avis: number;
  date_creation: Date;
  date_modification: Date;
  // Virtuals
  en_promotion?: boolean;
  prix_final?: number;
  en_rupture?: boolean;
  stock_total?: number;
}

export interface FiltresProduits {
  recherche?: string;
  categorie?: string;
  sous_categorie?: string;
  boutique?: string;
   statut?: string;
  prix_min?: number;
  prix_max?: number;
  marque?: string[];
  condition?: string[];
  en_promotion?: boolean;
  en_stock?: boolean;
  tags?: string[];
  tri?: string; // 'prix_asc', 'prix_desc', 'nouveaute', 'populaire', 'meilleures_notes'
  page?: number;
  limite?: number;
}

export interface ResultatsProduits {
  produits: Produit[];
  total: number;
  page: number;
  pages: number;
  limite: number;
}

export interface FiltresDisponibles {
  categories: Array<{ _id: string; nom: string; count: number }>;
  sous_categories: Array<{ _id: string; nom: string; count: number }>;
  marques: Array<{ nom: string; count: number }>;
  prix_min: number;
  prix_max: number;
  boutiques: Array<{ _id: string; nom: string; count: number }>;
}
