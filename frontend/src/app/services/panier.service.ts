import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ArticlePanier {
  _id: string;
  produit: {
    _id: string;
    nom: string;
    slug: string;
    prix: number;
    prix_promo?: number;
    images: Array<{ url: string; alt?: string }>;
    quantite: number;
    variantes?: any[];
    promotion_active?: { valeur?: number; type?: string; nom?: string };
  };
  quantite: number;
  variante?: string;
  prix_unitaire: number;
  prix_promo_unitaire?: number;
  date_ajout: Date;
}

export interface Panier {
  _id: string;
  utilisateur: string;
  articles: ArticlePanier[];
  sous_total: number;
  total_remise: number;
  total: number;
  nombre_articles: number;
  statut: string;
  date_expiration?: Date;
  date_creation: Date;
  expiry_minutes?: number; 
  date_modification: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private apiUrl = `${environment.apiUrl}/api/panier`;
  
  // État du panier
  private panierSubject = new BehaviorSubject<Panier | null>(null);
  public panier$ = this.panierSubject.asObservable();
  
  // Nombre d'articles (pour badge)
  private nombreArticlesSubject = new BehaviorSubject<number>(0);
  public nombreArticles$ = this.nombreArticlesSubject.asObservable();
  
  // Clé pour localStorage
  private readonly STORAGE_KEY = 'panier_count';

  constructor(private http: HttpClient) {
    // Charger le nombre depuis localStorage au démarrage
    this.loadFromStorage();
    
    // Charger le panier complet depuis l'API
    this.getPanier().subscribe({
      next: () => console.log('Panier chargé avec succès'),
      error: (err) => {
        console.error('Erreur chargement panier initial:', err);
        // En cas d'erreur (ex: non connecté), on garde juste le localStorage
      }
    });
  }

  /**
   * Charge le nombre d'articles depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const nombre = parseInt(saved, 10);
        if (!isNaN(nombre) && nombre >= 0) {
          this.nombreArticlesSubject.next(nombre);
        }
      }
    } catch (error) {
      console.error('Erreur lecture localStorage:', error);
    }
  }

  /**
   * Sauvegarde le nombre d'articles dans localStorage
   */
  private saveToStorage(nombre: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, nombre.toString());
    } catch (error) {
      console.error('Erreur écriture localStorage:', error);
    }
  }

  /**
   * Met à jour l'état du panier et persiste dans localStorage
   */
  private updatePanier(panier: Panier): void {
    this.panierSubject.next(panier);
    const nombre = panier.nombre_articles || 0;
    this.nombreArticlesSubject.next(nombre);
    this.saveToStorage(nombre);
  }

  /**
   * Récupère le panier de l'utilisateur
   */
  getPanier(): Observable<Panier> {
    return this.http.get<Panier>(this.apiUrl).pipe(
      tap(panier => this.updatePanier(panier)),
      catchError(error => {
        console.error('Erreur chargement panier:', error);
        // En cas d'erreur, retourne un panier vide
        return of({
          _id: '',
          utilisateur: '',
          articles: [],
          sous_total: 0,
          total_remise: 0,
          total: 0,
          nombre_articles: 0,
          statut: 'ACTIF',
          date_creation: new Date(),
          date_modification: new Date()
        } as Panier);
      })
    );
  }

  /**
   * Ajoute un article au panier
   */
  ajouterArticle(produit_id: string, quantite: number = 1, variante_id?: string): Observable<Panier> {
    return this.http.post<Panier>(`${this.apiUrl}/ajouter`, {
      produit_id,
      quantite,
      variante_id
    }).pipe(
      tap(panier => this.updatePanier(panier))
    );
  }

  /**
   * Met à jour la quantité d'un article
   */
  mettreAJourQuantite(articleId: string, quantite: number): Observable<Panier> {
    return this.http.put<Panier>(`${this.apiUrl}/article/${articleId}`, {
      quantite
    }).pipe(
      tap(panier => this.updatePanier(panier))
    );
  }

  /**
   * Supprime un article du panier
   */
  supprimerArticle(articleId: string): Observable<Panier> {
    return this.http.delete<Panier>(`${this.apiUrl}/article/${articleId}`).pipe(
      tap(panier => this.updatePanier(panier))
    );
  }

  /**
   * Vide le panier
   */
  viderPanier(): Observable<Panier> {
    return this.http.delete<Panier>(this.apiUrl).pipe(
      tap(panier => this.updatePanier(panier))
    );
  }


  /**
   * Efface le panier du localStorage (à appeler lors de la déconnexion)
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.nombreArticlesSubject.next(0);
      this.panierSubject.next(null);
    } catch (error) {
      console.error('Erreur nettoyage localStorage:', error);
    }
  }

  /**
   * Formate un prix en Ariary malgache
   */
  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix);
  }
}