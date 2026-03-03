import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StatsTotaux {
  total_ca: number;
  total_commandes: number;
  total_articles: number;
}

export interface StatsEvolution {
  periode: { annee: number; mois?: number; jour?: number; heure?: number; semaine?: number };
  chiffre_affaires: number;
  nb_commandes: number;
  nb_articles: number;
}

export interface StatsCA {
  success: boolean;
  periode: { debut: string; fin: string };
  reel:         { totaux: StatsTotaux; evolution: StatsEvolution[] };
  previsionnel: { totaux: StatsTotaux; evolution: StatsEvolution[] };
  annees_dispos: number[];
}

export type Periode = 'jour' | 'semaine' | 'mois' | 'annee';
export interface StatsOptions { debut?: string; fin?: string; periode?: Periode; annee?: number | string;   boutique_id?: string; }

@Injectable({ providedIn: 'root' })
export class BoutiqueStatsService {
  private api = `${environment.apiUrl}/api/boutiques`;
  constructor(private http: HttpClient) {}

  getChiffreAffaires(boutiqueId: string, options: StatsOptions = {}): Observable<StatsCA> {
    let params = new HttpParams();
    if (options.periode) params = params.set('periode', options.periode);
    if (options.debut)   params = params.set('debut',   options.debut);
    if (options.fin)     params = params.set('fin',     options.fin);
    if (options.annee)   params = params.set('annee',   String(options.annee));
    return this.http.get<StatsCA>(`${this.api}/${boutiqueId}/chiffre-affaires`, { params });
  }

  // Dans getChiffreAffairesAdmin :
  getChiffreAffairesAdmin(options: StatsOptions = {}): Observable<StatsCA> {
    let params = new HttpParams();
    if (options.periode)     params = params.set('periode',     options.periode);
    if (options.debut)       params = params.set('debut',       options.debut);
    if (options.fin)         params = params.set('fin',         options.fin);
    if (options.annee)       params = params.set('annee',       String(options.annee));
    if (options.boutique_id) params = params.set('boutique_id', options.boutique_id); // 👈 ajout
    return this.http.get<StatsCA>(`${this.api}/chiffre-affaires`, { params });
  }

}
