import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavoriService {

  private apiUrl = `${environment.apiUrl}/api/favoris`;

  // Set des IDs en favori — partagé dans toute l'app
  private favorisIds$ = new BehaviorSubject<Set<string>>(new Set());
  favorisIds = this.favorisIds$.asObservable();

  
  constructor(private http: HttpClient) {
      this.chargerFavorisIds();
  }

  // Charge tous les IDs au login
  chargerFavorisIds(): void {
    this.http.get<{ success: boolean; data: string[] }>(`${this.apiUrl}/ids`)
      .subscribe({
        next: (res) => this.favorisIds$.next(new Set(res.data)),
        error: () => {}
      });
  }

  // Vérifie localement si un produit est favori
  estFavori(produitId: string): boolean {
    return this.favorisIds$.getValue().has(produitId);
  }

  // Toggle favori
  toggleFavori(produitId: string): Observable<any> {
    if (this.estFavori(produitId)) {
      return this.http.delete(`${this.apiUrl}/${produitId}`).pipe(
        tap(() => {
          const ids = new Set(this.favorisIds$.getValue());
          ids.delete(produitId);
          this.favorisIds$.next(ids);
        })
      );
    } else {
      return this.http.post(`${this.apiUrl}/${produitId}`, {}).pipe(
        tap(() => {
          const ids = new Set(this.favorisIds$.getValue());
          ids.add(produitId);
          this.favorisIds$.next(ids);
        })
      );
    }
  }

  getMesFavoris(): Observable<{ success: boolean; count: number; data: any[] }> {
    return this.http.get<any>(`${this.apiUrl}`);
  }

  viderFavoris(): void {
    this.favorisIds$.next(new Set());
  }

  
}