import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SousCategorieService {

  private apiUrl = 'http://localhost:5000/api/sous-categories'; // adapter selon ton backend

  constructor(private http: HttpClient) { }

  // Récupérer toutes les sous-catégories d'une catégorie
  getByCategorie(categorieId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categorie/${categorieId}`);
  }

  // Récupérer toutes les sous-catégories
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
