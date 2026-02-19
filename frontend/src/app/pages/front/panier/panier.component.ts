import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PanierService, Panier, ArticlePanier } from '../../../services/panier.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.css']
})

export class PanierComponent implements OnInit, OnDestroy {
  panier: Panier | null = null;
  loading = true;
  error: string | null = null;
  processingItems: Set<string> = new Set();

  tempsRestant: string = '';
  panierExpire: boolean = false;
  private timerSubscription?: Subscription;

  constructor(private panierService: PanierService) {}

  // ============================================
  // LIFECYCLE
  // ============================================

  ngOnInit(): void {
    this.chargerPanier();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  // ============================================
  // TIMER
  // ============================================

  /**
   * Démarre le countdown après chargement du panier
   */
  demarrerTimer(dateExpiration: Date): void {
    this.timerSubscription?.unsubscribe();
    this.panierExpire = false;

    this.timerSubscription = interval(1000).subscribe(() => {
      const maintenant = new Date().getTime();
      const expiration = new Date(dateExpiration).getTime();
      const diff = expiration - maintenant;

      if (diff <= 0) {
        this.tempsRestant = '00:00';
        this.panierExpire = true;
        this.timerSubscription?.unsubscribe();

        setTimeout(() => {
          this.chargerPanier();
        }, 2000); 

      } else {
        const minutes = Math.floor(diff / 60000);
        const secondes = Math.floor((diff % 60000) / 1000);
        this.tempsRestant = `${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
      }
    });
  }

  /**
   * Vérifie si le temps restant est inférieur à 5 minutes (urgence)
   */
  get estUrgent(): boolean {
    if (!this.tempsRestant) return false;
    const [minutes] = this.tempsRestant.split(':').map(Number);
    return minutes < 5;
  }

  // ============================================
  // CHARGEMENT
  // ============================================

  chargerPanier(): void {
    this.loading = true;
    this.error = null;

    this.panierService.getPanier().subscribe({
      next: (panier) => {
        this.panier = panier;
        this.loading = false;
        // Démarre le timer si le panier a une date d'expiration
        if (panier.date_expiration) {
          this.demarrerTimer(panier.date_expiration);
        }
      },
      error: (err) => {
        this.error = 'Impossible de charger le panier';
        this.loading = false;
        console.error('Erreur chargement panier:', err);
      }
    });
  }

  // ============================================
  // ACTIONS PANIER
  // ============================================

  /**
   * Augmente la quantité d'un article
   */
  augmenterQuantite(article: ArticlePanier): void {
    if (this.processingItems.has(article._id)) return;

    const stockDisponible = this.getStockDisponible(article);
    if (article.quantite >= stockDisponible) {
      alert('Stock insuffisant');
      return;
    }

    this.processingItems.add(article._id);
    this.panierService.mettreAJourQuantite(article._id, article.quantite + 1).subscribe({
      next: (panier) => {
        this.panier = panier;
        this.processingItems.delete(article._id);
        // Réinitialise le timer à chaque activité
        if (panier.date_expiration) {
          this.demarrerTimer(panier.date_expiration);
        }
      },
      error: (err) => {
        console.error('Erreur augmentation quantité:', err);
        this.processingItems.delete(article._id);
        alert('Erreur lors de la mise à jour');
      }
    });
  }

  /**
   * Diminue la quantité d'un article
   */
  diminuerQuantite(article: ArticlePanier): void {
    if (this.processingItems.has(article._id)) return;
    if (article.quantite <= 1) return;

    this.processingItems.add(article._id);
    this.panierService.mettreAJourQuantite(article._id, article.quantite - 1).subscribe({
      next: (panier) => {
        this.panier = panier;
        this.processingItems.delete(article._id);
        // Réinitialise le timer à chaque activité
        if (panier.date_expiration) {
          this.demarrerTimer(panier.date_expiration);
        }
      },
      error: (err) => {
        console.error('Erreur diminution quantité:', err);
        this.processingItems.delete(article._id);
        alert('Erreur lors de la mise à jour');
      }
    });
  }

  /**
   * Supprime un article du panier
   */
  supprimerArticle(article: ArticlePanier): void {
    if (!confirm('Voulez-vous vraiment retirer cet article du panier ?')) return;
    if (this.processingItems.has(article._id)) return;

    this.processingItems.add(article._id);
    this.panierService.supprimerArticle(article._id).subscribe({
      next: (panier) => {
        this.panier = panier;
        this.processingItems.delete(article._id);
      },
      error: (err) => {
        console.error('Erreur suppression article:', err);
        this.processingItems.delete(article._id);
        alert('Erreur lors de la suppression');
      }
    });
  }

  /**
   * Vide complètement le panier
   */
  viderPanier(): void {
    if (!confirm('Voulez-vous vraiment vider votre panier ?')) return;

    this.panierService.viderPanier().subscribe({
      next: (panier) => {
        this.panier = panier;
        // Arrête le timer si le panier est vidé
        this.timerSubscription?.unsubscribe();
        this.tempsRestant = '';
        this.panierExpire = false;
      },
      error: (err) => {
        console.error('Erreur vidage panier:', err);
        alert('Erreur lors du vidage du panier');
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Récupère le stock disponible pour un article
   */
  getStockDisponible(article: ArticlePanier): number {
    if (!article.produit) return 0;

    if (article.variante && article.produit.variantes) {
      const variante = article.produit.variantes.find((v: any) => v._id === article.variante);
      return variante?.quantite || 0;
    }

    return article.produit.quantite || 0;
  }

  /**
   * Calcule le prix unitaire final (avec ou sans promo)
   */
  getPrixUnitaire(article: ArticlePanier): number {
    return article.prix_promo_unitaire || article.prix_unitaire;
  }

  /**
   * Calcule le sous-total d'un article
   */
  getSousTotal(article: ArticlePanier): number {
    return this.getPrixUnitaire(article) * article.quantite;
  }

  /**
   * Vérifie si un article est en promotion
   */
  enPromotion(article: ArticlePanier): boolean {
    return !!article.prix_promo_unitaire;
  }

  /**
   * Vérifie si le panier est vide
   */
  estVide(): boolean {
    return !this.panier || this.panier.articles.length === 0;
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

  /**
   * Récupère l'image principale d'un produit
   */
  getImageProduit(article: ArticlePanier): string {
    if (article.produit?.images && article.produit.images.length > 0) {
      return article.produit.images[0].url;
    }
    return 'assets/images/placeholder.png';
  }

  /**
   * Procède au paiement
   */
  procederAuPaiement(): void {
    if (this.panierExpire) {
      alert('Votre panier a expiré. Veuillez actualiser et recommencer.');
      this.chargerPanier();
      return;
    }
    // TODO: Redirection vers le checkout
    alert('Redirection vers le paiement...');
  }
}