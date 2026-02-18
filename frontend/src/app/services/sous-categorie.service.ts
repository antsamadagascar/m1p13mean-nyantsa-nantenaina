import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SousCategorieService {

  private apiUrl = `${environment.apiUrl}/api/sous-categories`;

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
