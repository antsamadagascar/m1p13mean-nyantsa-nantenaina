import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../services/produit.service';
import { Produit } from '../../../models/produit.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  produit: Produit | null = null;
  produitsSimilaires: Produit[] = [];
  loading = true;
  error: string | null = null;
  
  // Images
  imageSelectionnee = 0;
  
  // Quantité
  quantite = 1;
  
  // Variante sélectionnée
  varianteSelectionnee: any = null;
  
  // État ajout panier
  ajoutEnCours = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.chargerProduit(slug);
      }
    });
  }

  ngOnDestroy(): void
  {   this.destroy$.next();  this.destroy$.complete(); }

  /**
   * Charge les détails du produit
   */
  chargerProduit(slug: string): void {
    this.loading = true;
    this.error = null;

    this.productService.getProduit(slug).subscribe({
      next: (produit: Produit) => {
        this.produit = produit;
        this.loading = false;
        
        // Charge tous les produits similaires
        this.chargerProduitsSimilaires(produit._id);
        
        // Scroll en haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement du produit:', err);
        this.error = 'Produit introuvable.';
        this.loading = false;
      }
    });
  }

  /**
   * Charge les produits similaires
   */
  chargerProduitsSimilaires(produitId: string): void {
    this.productService.getProduitsSimilaires(produitId, 4).subscribe({
      next: (produits: Produit[]) => 
      {   this.produitsSimilaires = produits; },
      error: (err: any) => 
      {   console.error('Erreur lors du chargement des produits similaires:', err);  }
    });
  }

  /**
   * Sélectionne une image
   */
  selectionnerImage(index: number): void
  {   this.imageSelectionnee = index ; }

  /**
   * Image précédente
   */
  imagePrecedente(): void 
  {
    if (this.produit && this.imageSelectionnee > 0) 
    {    this.imageSelectionnee--; }
  }

  /**
   * Image suivante
   */
  imageSuivante(): void {
    if (this.produit && this.imageSelectionnee < this.produit.images.length - 1) 
    {   this.imageSelectionnee++; }
  }

  /**
   * Obtient l'image principale
   */
  getImagePrincipale(): string {
    if (!this.produit) return '';
    const image = this.produit.images[this.imageSelectionnee];
    return image?.url || 'assets/images/placeholder-product.png';
  }

  /**
   * Augmente la quantité
   */
  augmenterQuantite(): void {
    if (this.produit) {
      const stockDisponible = this.varianteSelectionnee 
        ? this.varianteSelectionnee.quantite 
        : this.produit.quantite;
      
      if (this.quantite < stockDisponible) {
        this.quantite++;
      }
    }
  }

  /**
   * Diminue la quantité
   */
  diminuerQuantite(): void {
    if (this.quantite > 1) {
      this.quantite--;
    }
  }

  /**
   * Sélectionne une variante
   */
  selectionnerVariante(variante: any): void {
    this.varianteSelectionnee = variante;
    this.quantite = 1; // Reset quantité
  }


  /**
   * Acheter maintenant
   */
  acheterMaintenant(): void {
    if (!this.produit) return;

    // Rediriger vers le panier après un court délai
    setTimeout(() => {
      if (!this.ajoutEnCours) {
        this.router.navigate(['/panier']);
      }
    }, 500);
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
   * Obtient le stock disponible
   */
  getStockDisponible(): number {
    if (!this.produit) return 0;
    
    if (this.varianteSelectionnee) {
      return this.varianteSelectionnee.quantite;
    }
    
    return this.produit.quantite;
  }

  /**
   * Vérifie si le produit est en stock
   */
  isEnStock(): boolean {
    return this.getStockDisponible() > 0;
  }

  /**
   * Obtient le prix final (avec variante si applicable)
   */
  getPrixFinal(): number {
    if (!this.produit) return 0;
    
    let prix = this.produit.prix_final || this.produit.prix;
    
    if (this.varianteSelectionnee && this.varianteSelectionnee.prix_supplement) {
      prix += this.varianteSelectionnee.prix_supplement;
    }
    
    return prix;
  }

  /**
   * Génère les étoiles de notation
   */
  getEtoiles(): boolean[] {
    if (!this.produit) return [];
    const note = Math.round(this.produit.note_moyenne);
    return Array(5).fill(false).map((_, i) => i < note);
  }

}