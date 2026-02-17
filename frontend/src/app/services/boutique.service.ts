import { Injectable } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Boutique } from '../models/boutique.model';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = 'http://localhost:5000/api/boutiques';


  constructor(private http: HttpClient) {}

  getBoutiques(filters?: {
    statut?: string;
    categorie?: string;
    zone?: string;
    search?: string;
  }): Observable<Boutique[]> {

    let params = new HttpParams();

    if (filters?.statut) params = params.set('statut', filters.statut);
    if (filters?.categorie) params = params.set('categorie', filters.categorie);
    if (filters?.zone) params = params.set('zone', filters.zone);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<Boutique[]>(this.apiUrl, { params });
  }

  suspendreBoutique(id: string, motif: string) {
    return this.http.patch(`${this.apiUrl}/${id}/suspendre`, { motif });
  }

  toggleActif(id: string) {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-actif`, {});
  }

  reactiverBoutique(id: string) {
    return this.http.patch(`${this.apiUrl}/${id}/reactiver`, {});
  }

  // createn' nante
  createBoutique(boutiqueData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, boutiqueData);
  }
  
  //recupere un boutique par id
  getBoutiqueById(id: string): Observable<Boutique> {
    return this.http.get<{ success: boolean; data: Boutique }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  getBoutiqueDetailsById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/details/${id}`);
  }
  
  

  getBoutiquesPublic(filters?: {
    categorie?: string;
    zone?: string;
    search?: string;
  }): Observable<Boutique[]> {

    let params = new HttpParams();

    if (filters?.categorie) params = params.set('categorie', filters.categorie);
    if (filters?.zone) params = params.set('zone', filters.zone);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<Boutique[]>(`${this.apiUrl}/public`, { params });
  }

}
