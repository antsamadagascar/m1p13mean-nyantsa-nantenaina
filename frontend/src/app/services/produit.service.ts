import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Produit,
  FiltresProduits,
  ResultatsProduits,
  FiltresDisponibles
} from '../models/produit.model';


@Injectable({
  providedIn: 'root'
})

export class ProductService {
  private apiUrl = `${environment.apiUrl}/api/produits`; // lit environment local
  
  // BehaviorSubject pour les filtres actifs
  private filtresActifsSubject = new BehaviorSubject<FiltresProduits>({
    page: 1,
    limite: 12,
    tri: 'nouveaute'
  });
  
  public filtresActifs$ = this.filtresActifsSubject.asObservable();

  constructor(private http: HttpClient) {}

  
  /**
   * Récupère les produits
   * @param filtres - Filtres à appliquer
   * @param isAdmin - Si true, affiche tous les statuts
   */
  getProduits(filtres: FiltresProduits = {}, isAdmin: boolean = false): Observable<ResultatsProduits> {
    let params = new HttpParams();

    // Paramètre admin
    if (isAdmin) {
      params = params.set('admin', 'true');
    }

    if (filtres.recherche) params = params.set('recherche', filtres.recherche);
    if (filtres.categorie) params = params.set('categorie', filtres.categorie);
    if (filtres.sous_categorie) params = params.set('sous_categorie', filtres.sous_categorie);
    if (filtres.boutique) params = params.set('boutique', filtres.boutique);
    if (filtres.statut) params = params.set('statut', filtres.statut);
    if (filtres.prix_min !== undefined) params = params.set('prix_min', filtres.prix_min.toString());
    if (filtres.prix_max !== undefined) params = params.set('prix_max', filtres.prix_max.toString());
    if (filtres.marque && filtres.marque.length > 0) params = params.set('marque', filtres.marque.join(','));
    if (filtres.condition && filtres.condition.length > 0) params = params.set('condition', filtres.condition.join(','));
    if (filtres.en_promotion) params = params.set('en_promotion', 'true');
    if (filtres.en_stock) params = params.set('en_stock', 'true');
    if (filtres.tags && filtres.tags.length > 0) params = params.set('tags', filtres.tags.join(','));
    if (filtres.tri) params = params.set('tri', filtres.tri);
    if (filtres.page) params = params.set('page', filtres.page.toString());
    if (filtres.limite) params = params.set('limite', filtres.limite.toString());

    return this.http.get<ResultatsProduits>(this.apiUrl, { params });
  }


  /**
   * Récupère les filtres disponibles
   */
  getFiltresDisponibles(filtres: Partial<FiltresProduits> = {}): Observable<FiltresDisponibles> {
    let params = new HttpParams();
    
    if (filtres.categorie) {
      params = params.set('categorie', filtres.categorie);
    }
    if (filtres.sous_categorie) {
      params = params.set('sous_categorie', filtres.sous_categorie);
    }

    return this.http.get<FiltresDisponibles>(`${this.apiUrl}/filtres`, { params });
  }

  /**
   * Récupère un produit par son ID ou slug
   */
  getProduit(idOrSlug: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${idOrSlug}`);
  }

  /**
   * Récupère les produits similaires
   */
  getProduitsSimilaires(produitId: string, limite: number = 4): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/${produitId}/similaires`, {
      params: new HttpParams().set('limite', limite.toString())
    });
  }


  /**
   * Réinitialise les filtres
   */
  resetFiltres(): void {
    this.filtresActifsSubject.next({
      page: 1,
      limite: 12,
      tri: 'nouveaute'
    });
  }

  /**
   * Met à jour les filtres actifs
   */
  updateFiltres(filtres: Partial<FiltresProduits>): void {
    const filtresActuels = this.filtresActifsSubject.value;
    this.filtresActifsSubject.next({ ...filtresActuels, ...filtres, page: 1 });
  }

  /**
   * Met à jour le statut d'un produit (ADMIN/BOUTIQUE)
   */
  updateStatutProduit(produitId: string, statut: string): Observable<Produit> {
    return this.http.patch<Produit>(`${this.apiUrl}/${produitId}/statut`, { statut });
  }

  /**
   * Récupère TOUTES les boutiques (pour le filtre admin)
   */
 getAllBoutiques(): Observable<Array<{ _id: string; nom: string; slug: string }>> {
    return this.http.get<Array<{ _id: string; nom: string; slug: string }>>(
      `${environment.apiUrl}/api/boutiques/all`
    );
  }
  
}