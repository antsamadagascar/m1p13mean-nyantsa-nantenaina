import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

  private apiUrl = 'http://localhost:5000/api/produits'; // adapter selon ton backend

  constructor(private http: HttpClient) { }

  // Produits de la boutique connectée
  getMesProduits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mes-produits`);
  }

  // Optionnel : méthode delete
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
