// services/promotion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // Créer une promotion pour un produit
  createPromotionProduit(produitId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/produits/${produitId}/promotion`, data);
  }

  // Mettre à jour une promotion
  updatePromotionProduit(produitId: string, promotionId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/produits/${produitId}/promotion/${promotionId}`, data);
  }

  // Supprimer une promotion
  deletePromotionProduit(produitId: string, promotionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/produits/${produitId}/promotion/${promotionId}`);
  }

  // Obtenir la promotion d'un produit
  getPromotionProduit(produitId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/produits/${produitId}/promotion`);
  }

  // Obtenir toutes les promotions de la boutique
  getMesPromotions(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/promotions`, { params });
  }
}
