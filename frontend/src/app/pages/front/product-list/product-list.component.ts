import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProductService } from '../../../services/produit.service';
import { Produit } from '../../../models/produit.model';

import {
  FiltresProduits,
  FiltresDisponibles,
  ResultatsProduits
} from '../../../models/produit.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, OnDestroy {
  produits: Produit[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  page = 1;
  totalPages = 0;
  totalProduits = 0;
  limite = 12;
  
  // Filtres
  filtres: FiltresProduits = {
    page: 1,
    limite: 12,
    tri: 'nouveaute'
  };
  
  filtresDisponibles: FiltresDisponibles | null = null;
  
  // État des filtres
  recherche = '';
  rechercheSubject = new Subject<string>();
  
  prixMin: number | null = null;
  prixMax: number | null = null;
  
  marquesSelectionnees: string[] = [];
  conditionsSelectionnees: string[] = [];
  
  enPromotion = false;
  enStock = false;
  
  // UI
  mobileFiltersOpen = false;
  affichage: 'grille' | 'liste' = 'grille';
  
  // Options de tri
  optionsTri = [
    { value: 'nouveaute', label: 'Nouveautés' },
    { value: 'prix_asc', label: 'Prix croissant' },
    { value: 'prix_desc', label: 'Prix décroissant' },
    { value: 'populaire', label: 'Les plus populaires' },
    { value: 'meilleures_notes', label: 'Meilleures notes' }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Écoute les changements de recherche avec debounce
    this.rechercheSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(terme => {
      this.filtres.recherche = terme;
      this.appliquerFiltres();
    });

    // Récupère les paramètres de l'URL
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.initialiserFiltresDepuisURL(params);
      this.chargerProduits();
    });

    // Charge les filtres disponibles
    this.chargerFiltresDisponibles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise les filtres depuis les paramètres URL
   */
  private initialiserFiltresDepuisURL(params: any): void {
    this.filtres = {
      recherche: params['q'] || '',
      categorie: params['categorie'] || undefined,
      sous_categorie: params['sous_categorie'] || undefined,
      boutique: params['boutique'] || undefined,
      prix_min: params['prix_min'] ? +params['prix_min'] : undefined,
      prix_max: params['prix_max'] ? +params['prix_max'] : undefined,
      marque: params['marque'] ? params['marque'].split(',') : [],
      condition: params['condition'] ? params['condition'].split(',') : [],
      en_promotion: params['promo'] === 'true',
      en_stock: params['stock'] === 'true',
      tri: params['tri'] || 'nouveaute',
      page: params['page'] ? +params['page'] : 1,
      limite: this.limite
    };

    // Synchronise les variables locales
    this.recherche = this.filtres.recherche || '';
    this.prixMin = this.filtres.prix_min || null;
    this.prixMax = this.filtres.prix_max || null;
    this.marquesSelectionnees = this.filtres.marque || [];
    this.conditionsSelectionnees = this.filtres.condition || [];
    this.enPromotion = this.filtres.en_promotion || false;
    this.enStock = this.filtres.en_stock || false;
    this.page = this.filtres.page || 1;
  }

  /**
   * Charge les produits
   */
  chargerProduits(): void {
    this.loading = true;
    this.error = null;

    this.productService.getProduits(this.filtres).subscribe({
      next: (resultats: ResultatsProduits) => {
        // Calculer promotion_active_valide pour chaque produit
        resultats.produits.forEach(produit => {
          produit.promotion_active_valide = !!(
            produit.promotion_active &&
            produit.promotion_active.actif &&
            !produit.promotion_active.supprime &&
            !produit.promotion_active.date_suppression &&
            new Date() <= new Date(produit.promotion_active.date_fin)
          );
        });
    
        // Stocker les produits et infos pour le template
        this.produits = resultats.produits;
        this.totalProduits = resultats.total;
        this.totalPages = resultats.pages;
        this.page = resultats.page;
        this.loading = false;
    
        // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des produits:', err);
        this.error = 'Impossible de charger les produits. Veuillez réessayer.';
        this.loading = false;
      }
    });    
  }

  /**
   * Charge les filtres disponibles
   */
  chargerFiltresDisponibles(): void {
    this.productService.getFiltresDisponibles({
      categorie: this.filtres.categorie,
      sous_categorie: this.filtres.sous_categorie
    }).subscribe({
      next: (filtres: FiltresDisponibles) => {
        this.filtresDisponibles = filtres;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des filtres:', err);
      }
    });
  }

  /**
   * Applique les filtres et met à jour l'URL
   */
  appliquerFiltres(): void {
    // Construit les query params
    const queryParams: any = {};

    if (this.filtres.recherche) queryParams.q = this.filtres.recherche;
    if (this.filtres.categorie) queryParams.categorie = this.filtres.categorie;
    if (this.filtres.sous_categorie) queryParams.sous_categorie = this.filtres.sous_categorie;
    if (this.filtres.boutique) queryParams.boutique = this.filtres.boutique;
    if (this.prixMin) queryParams.prix_min = this.prixMin;
    if (this.prixMax) queryParams.prix_max = this.prixMax;
    if (this.marquesSelectionnees.length > 0) queryParams.marque = this.marquesSelectionnees.join(',');
    if (this.conditionsSelectionnees.length > 0) queryParams.condition = this.conditionsSelectionnees.join(',');
    if (this.enPromotion) queryParams.promo = 'true';
    if (this.enStock) queryParams.stock = 'true';
    if (this.filtres.tri) queryParams.tri = this.filtres.tri;
    queryParams.page = 1; // Reset à la page 1

    // Met à jour l'URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Gestion de la recherche
   */
  onRechercheChange(terme: string): void {
    this.rechercheSubject.next(terme);
  }

  /**
   * Gestion du changement de tri
   */
  onTriChange(tri: string): void {
    this.filtres.tri = tri;
    this.appliquerFiltres();
  }

  /**
   * Toggle marque
   */
  toggleMarque(marque: string): void {
    const index = this.marquesSelectionnees.indexOf(marque);
    if (index > -1) {
      this.marquesSelectionnees.splice(index, 1);
    } else {
      this.marquesSelectionnees.push(marque);
    }
    this.filtres.marque = this.marquesSelectionnees;
    this.appliquerFiltres();
  }

  /**
   * Toggle condition
   */
  toggleCondition(condition: string): void {
    const index = this.conditionsSelectionnees.indexOf(condition);
    if (index > -1) {
      this.conditionsSelectionnees.splice(index, 1);
    } else {
      this.conditionsSelectionnees.push(condition);
    }
    this.filtres.condition = this.conditionsSelectionnees;
    this.appliquerFiltres();
  }

  /**
   * Applique le filtre de prix
   */
  appliquerFiltrePrix(): void {
    this.filtres.prix_min = this.prixMin || undefined;
    this.filtres.prix_max = this.prixMax || undefined;
    this.appliquerFiltres();
  }

  /**
   * Toggle promotion
   */
  togglePromotion(): void {
    this.enPromotion = !this.enPromotion;
    this.filtres.en_promotion = this.enPromotion || undefined;
    this.appliquerFiltres();
  }

  /**
   * Toggle stock
   */
  toggleStock(): void {
    this.enStock = !this.enStock;
    this.filtres.en_stock = this.enStock || undefined;
    this.appliquerFiltres();
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFiltres(): void {
    this.recherche = '';
    this.prixMin = null;
    this.prixMax = null;
    this.marquesSelectionnees = [];
    this.conditionsSelectionnees = [];
    this.enPromotion = false;
    this.enStock = false;
    
    this.filtres = {
      page: 1,
      limite: this.limite,
      tri: 'nouveaute'
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  /**
   * Change de page
   */
  changerPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.filtres.page = page;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Toggle affichage grille/liste
   */
  toggleAffichage(): void {
    this.affichage = this.affichage === 'grille' ? 'liste' : 'grille';
  }

  /**
   * Toggle filtres mobiles
   */
  toggleMobileFilters(): void {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
  }

  /**
   * Obtient l'image principale du produit
   */
  getImagePrincipale(produit: Produit): string {
    const imagePrincipale = produit.images.find(img => img.principale);
    return imagePrincipale?.url || produit.images[0]?.url || 'assets/images/placeholder-product.png';
  }

  /**
   * Formate le prix
   */
  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix);
  }

  /**
   * Génère le tableau des pages pour la pagination
   */
  getPagesArray(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.page - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Vérifie si des marques sont disponibles
   */
  hasMarques(): boolean {
    return !!(this.filtresDisponibles?.marques && this.filtresDisponibles.marques.length > 0);
  }

  /**
   * Retourne les marques disponibles de manière sûre
   */
  getMarques(): Array<{ nom: string; count: number }> {
    return this.filtresDisponibles?.marques || [];
  }
}