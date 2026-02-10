import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Boutique {
  _id: string;
  nom: string;
  description: string;
  logo: string;
  banniere: string;

  gerant: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };

  localisation: {
    zone: string;
    etage: string;
    numero: string;
    emplacement_complet?: string;
    latitude?: number;
    longitude?: number;
    surface?: number;
  };

  categorie: {
    _id: string;
    nom: string;
  };

  sous_categories?: any[];

  contact: {
    telephone: string;
    email: string;
    site_web?: string;
    facebook?: string;
    instagram?: string;
  };

  horaires: any;

  statut: {
    actif: boolean;
    valide_par_admin: boolean;
    en_attente_validation: boolean;
    suspendu: boolean;
    motif_suspension?: string;
  };

  estOuverte?: boolean;
  date_creation?: Date;
}


@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = 'http://localhost:5000/api/boutiques';

  constructor(private http: HttpClient) {}

  // Récupération de toutes les boutiques avec filtres
  getBoutiques(filters?: {
    statut?: string;
    categorie?: string;
    zone?: string;
    search?: string;
  }): Observable<Boutique[]> {
    let params = new HttpParams();

    if (filters?.statut) 
    {   params = params.set('statut', filters.statut); }
    if (filters?.categorie) 
    {   params = params.set('categorie', filters.categorie);}
    if (filters?.zone)
    {  params = params.set('zone', filters.zone); }
    if (filters?.search) 
    {   params = params.set('search', filters.search);}

    return this.http.get<Boutique[]>(this.apiUrl, { params });
  }

  // Récupération d'une boutique par ID
  getBoutiqueById(id: string): Observable<Boutique> {
    return this.http.get<Boutique>(`${this.apiUrl}/${id}`);
  }

  // Validation d' une boutique (admin)
  validerBoutique(id: string): Observable<any> 
  {  return this.http.patch(`${this.apiUrl}/${id}/valider`, {}); }

  // Susepnsion d' une boutique (admin)
  suspendreBoutique(id: string, motif: string): Observable<any> 
  {  return this.http.patch(`${this.apiUrl}/${id}/suspendre`, { motif }); }

  // Activation/Désactivation  boutique (admin)
  toggleActif(id: string): Observable<any> 
  {   return this.http.patch(`${this.apiUrl}/${id}/toggle-actif`, {});   }

  reactiverBoutique(id: string): Observable<any>
  { return this.http.patch(`${this.apiUrl}/${id}/reactiver`, {}); }

  getBoutiquesPublic(filters?: {
    categorie?: string;
    zone?: string;
    search?: string;
  }): Observable<Boutique[]> {
    let params = new HttpParams();

    if (filters?.categorie) {
      params = params.set('categorie', filters.categorie);
    }
    if (filters?.zone) {
      params = params.set('zone', filters.zone);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<Boutique[]>(`${this.apiUrl}/public`, { params });
  }
}