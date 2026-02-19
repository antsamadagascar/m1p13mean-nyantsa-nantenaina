import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EvaluationClient } from '../models/boutique.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EvaluationService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Récupérer les évaluations d'une boutique
  getEvaluations(boutiqueId: string): Observable<{ success: boolean; data: EvaluationClient[] }> {
    return this.http.get<{ success: boolean; data: EvaluationClient[] }>(
      `${this.apiUrl}/api/boutiques/${boutiqueId}/evaluations`
    );
  }

  // Créer ou modifier son évaluation
  soumettre(boutiqueId: string, payload: { note: number; commentaire?: string }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/boutiques/${boutiqueId}/evaluations`,
      payload
    );
  }

  // Supprimer son évaluation
  supprimer(boutiqueId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/boutiques/${boutiqueId}/evaluations`);
  }
}