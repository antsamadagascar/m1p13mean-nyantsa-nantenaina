import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Zone {
  _id: string;
  nom: string;
  slug: string;
  description?: string;
  code: string;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
  actif: boolean;
  ordre: number;
  date_creation: Date;
  date_modification: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ZoneService {
  private apiUrl = `${environment.apiUrl}/api/zones`;

  constructor(private http: HttpClient) {}

  /**
   * Crée une nouvelle zone (Admin)
   */
  createZone(zoneData: any): Observable<any>
  {   return this.http.post(this.apiUrl, zoneData); }

  /**
   * Récupére toutes les zones
   * @param actifOnly - Si true, retourne uniquement les zones actives
   */
  getAllZones(actifOnly: boolean = false): Observable<any> {
    let params = new HttpParams();
    if (actifOnly) { params = params.set('actif', 'true'); }
    return this.http.get(this.apiUrl, { params });

  }

  /**
   * Récupére une zone par ID
   */
  getZoneById(id: string): Observable<any> { return this.http.get(`${this.apiUrl}/${id}`); }

  /**
   * Mis à jour une zone (Admin)
   */
  updateZone(id: string, zoneData: any): Observable<any> 
  {   return this.http.put(`${this.apiUrl}/${id}`, zoneData); }

  /**
   * Supprime une zone (Admin)
   */
  deleteZone(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/${id}`);  }

  /**
   * Activation/Désactivation une zone (Admin)
   */
  toggleZoneActif(id: string): Observable<any> 
  {   return this.http.patch(`${this.apiUrl}/${id}/toggle-actif`, {}); }
}