import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../../services/produit.service';
import { PanierService } from '../../../services/panier.service';
import { Produit } from '../../../models/produit.model';
// IMPORT DE L'UTILITAIRE
import * as HorairesUtils from '../../../utils/boutique-horaires.util';

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
    private router: Router,
    private panierService: PanierService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.chargerProduit(slug);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
      next: (produits: Produit[]) => {
        this.produitsSimilaires = produits;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des produits similaires:', err);
      }
    });
  }

  /**
   * Sélectionne une image
   */
  selectionnerImage(index: number): void {
    this.imageSelectionnee = index;
  }

  /**
   * Image précédente
   */
  imagePrecedente(): void {
    if (this.produit && this.imageSelectionnee > 0) {
      this.imageSelectionnee--;
    }
  }

  /**
   * Image suivante
   */
  imageSuivante(): void {
    if (this.produit && this.imageSelectionnee < this.produit.images.length - 1) {
      this.imageSelectionnee++;
    }
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
    if (this.produit && this.peutAcheter()) {
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
   * Ajoute au panier
   */
  ajouterAuPanier(): void {
    if (!this.produit || this.ajoutEnCours) return;
    
    this.ajoutEnCours = true;
    
    const varianteId = this.varianteSelectionnee?._id || undefined;
    
    this.panierService.ajouterArticle(this.produit._id, this.quantite, varianteId).subscribe({
      next: (panier) => {
        this.ajoutEnCours = false;
        alert(` ${this.quantite} ${this.produit!.nom} ajouté(s) au panier !`);
      },
      error: (err) => {
        this.ajoutEnCours = false;
        console.error('Erreur ajout panier:', err);
        
        if (err.status === 401) {
          // Non connecté
          alert(' Vous devez être connecté pour ajouter au panier');
          this.router.navigate(['/connexion'], {
            queryParams: { returnUrl: this.router.url }
          });
        } else if (err.error?.stock_disponible !== undefined) {
          alert(`Stock insuffisant. Seulement ${err.error.stock_disponible} disponible(s)`);
        } else {
          alert(' Erreur lors de l\'ajout au panier. Réessayez.');
        }
      }
    });
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
    
    //  Utilise promotion_active_valide au lieu de prix_final
    let prix = this.produit.promotion_active_valide 
      ? (this.produit.prix_promo || this.produit.prix) 
      : this.produit.prix;
    
    if (this.varianteSelectionnee?.prix_supplement) {
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

  // ============================================
  // MÉTHODES POUR GÉRER LES HORAIRES
  // ============================================

  /**
   * Vérifie si la boutique est ouverte
   */
  estBoutiqueOuverte(): boolean {
    if (!this.produit?.boutique?.horaires) {
      return false;
    }
    return HorairesUtils.estOuverte(this.produit.boutique.horaires);
  }

  /**
   * Obtient le message de statut de la boutique
   */
  getStatutBoutique(): string {
    if (!this.produit?.boutique?.horaires) {
      return 'Horaires non disponibles';
    }
    return HorairesUtils.getStatutMessage(this.produit.boutique.horaires);
  }

  /**
   * Obtient les horaires d'aujourd'hui
   */
  getHorairesAujourdhui(): string {
    if (!this.produit?.boutique?.horaires) {
      return 'Non disponible';
    }
    return HorairesUtils.getHorairesAujourdhui(this.produit.boutique.horaires);
  }

  /**
   * Vérifie si on peut acheter (boutique ouverte ET stock disponible)
   */
  peutAcheter(): boolean {
    return this.estBoutiqueOuverte() && this.isEnStock();
  }

  /**
   * Obtient le message pour le bouton d'achat
   */
  getMessageAchat(): string {
    if (!this.estBoutiqueOuverte()) {
      return 'Boutique fermée';
    }
    if (!this.isEnStock()) {
      return 'Rupture de stock';
    }
    return 'Ajouter au panier';
  }
  // Onglet actif
  ongletActif = 'description';

  changerOnglet(onglet: string): void {
    this.ongletActif = onglet;
  }

}