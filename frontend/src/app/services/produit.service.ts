import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

  private apiUrl = 'http://localhost:5000/api/produits';

  constructor(private http: HttpClient) { }

  // Récupérer les produits de la boutique connectée
  getMesProduits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mes-produits`);
  }

  // Supprimer un produit
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Créer un produit avec image
  create(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  // Ajouter du stock
  addStock(produitId: string, quantite: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${produitId}/stock`, { quantite });
  }

  // Mettre à jour un produit avec image possible
  update(id: string, formData: FormData): Observable<any> {
    console.log('🔄 Service: Mise à jour produit', id);
    return this.http.put(`${this.apiUrl}/${id}`, formData);
  }
  softDelete(id: string, motif?: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/soft`, {
      body: { motif }
    });
  }
}
