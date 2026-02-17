import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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

  private apiUrl = `${environment.apiUrl}/api/produits`;

  constructor(private http: HttpClient) {}

  /* =========================================================
     ==================== PARTIE CATALOGUE ===================
  ========================================================= */

  private filtresActifsSubject = new BehaviorSubject<FiltresProduits>({
    page: 1,
    limite: 12,
    tri: 'nouveaute'
  });

  public filtresActifs$ = this.filtresActifsSubject.asObservable();


  getProduits(
    filtres: FiltresProduits = {},
    isAdmin: boolean = false
  ): Observable<ResultatsProduits> {

    let params = new HttpParams();

    if (isAdmin) params = params.set('admin', 'true');

    if (filtres.recherche) params = params.set('recherche', filtres.recherche);
    if (filtres.categorie) params = params.set('categorie', filtres.categorie);
    if (filtres.sous_categorie) params = params.set('sous_categorie', filtres.sous_categorie);
    if (filtres.boutique) params = params.set('boutique', filtres.boutique);
    if (filtres.statut) params = params.set('statut', filtres.statut);
    if (filtres.prix_min !== undefined) params = params.set('prix_min', filtres.prix_min.toString());
    if (filtres.prix_max !== undefined) params = params.set('prix_max', filtres.prix_max.toString());
    if (filtres.marque?.length) params = params.set('marque', filtres.marque.join(','));
    if (filtres.condition?.length) params = params.set('condition', filtres.condition.join(','));
    if (filtres.en_promotion) params = params.set('en_promotion', 'true');
    if (filtres.en_stock) params = params.set('en_stock', 'true');
    if (filtres.tags?.length) params = params.set('tags', filtres.tags.join(','));
    if (filtres.tri) params = params.set('tri', filtres.tri);
    if (filtres.page) params = params.set('page', filtres.page.toString());
    if (filtres.limite) params = params.set('limite', filtres.limite.toString());

    return this.http.get<ResultatsProduits>(this.apiUrl, { params });
  }


  getFiltresDisponibles(
    filtres: Partial<FiltresProduits> = {}
  ): Observable<FiltresDisponibles> {

    let params = new HttpParams();

    if (filtres.categorie) params = params.set('categorie', filtres.categorie);
    if (filtres.sous_categorie) params = params.set('sous_categorie', filtres.sous_categorie);

    return this.http.get<FiltresDisponibles>(`${this.apiUrl}/filtres`, { params });
  }


  getProduit(idOrSlug: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${idOrSlug}`);
  }


  getProduitsSimilaires(
    produitId: string,
    limite: number = 4
  ): Observable<Produit[]> {

    return this.http.get<Produit[]>(
      `${this.apiUrl}/${produitId}/similaires`,
      { params: new HttpParams().set('limite', limite.toString()) }
    );
  }


  updateStatutProduit(produitId: string, statut: string): Observable<Produit> {
    return this.http.patch<Produit>(
      `${this.apiUrl}/${produitId}/statut`,
      { statut }
    );
  }


  resetFiltres(): void {
    this.filtresActifsSubject.next({
      page: 1,
      limite: 12,
      tri: 'nouveaute'
    });
  }

  updateFiltres(filtres: Partial<FiltresProduits>): void {
    const actuels = this.filtresActifsSubject.value;
    this.filtresActifsSubject.next({ ...actuels, ...filtres, page: 1 });
  }


  /* =========================================================
     ==================== PARTIE BOUTIQUE ====================
  ========================================================= */

  getMesProduits(): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/mes-produits`);
  }

  create(formData: FormData): Observable<Produit> {
    return this.http.post<Produit>(this.apiUrl, formData);
  }

  update(id: string, formData: FormData): Observable<Produit> {
    return this.http.put<Produit>(`${this.apiUrl}/${id}`, formData);
  }

  addStock(produitId: string, quantite: number): Observable<Produit> {
    return this.http.post<Produit>(
      `${this.apiUrl}/${produitId}/stock`,
      { quantite }
    );
  }

  softDelete(id: string, motif?: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/soft`, {
      body: { motif }
    });
  }

  deleteImage(produitId: string, imageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${produitId}/images/${imageId}`);
  }
  /* =========================================================
     ===================== ADMIN BONUS =======================
  ========================================================= */

  getAllBoutiques(): Observable<
    Array<{ _id: string; nom: string; slug: string }>
  > {
    return this.http.get<
      Array<{ _id: string; nom: string; slug: string }>
    >(`${environment.apiUrl}/api/boutiques/all`);
  }

}
