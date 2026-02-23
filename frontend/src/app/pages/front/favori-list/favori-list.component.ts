import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoriService } from '../../../services/favori.service';
import { BtnFavoriComponent } from '../btn-favori/btn-favori.component';
import { Produit } from '../../../models/produit.model';

@Component({
  selector: 'app-favori-list',
  standalone: true,
  imports: [CommonModule, RouterModule, BtnFavoriComponent],
  templateUrl: './favori-list.component.html',
  styleUrls: ['./favori-list.component.css'] // ✅ corrigé ici
})
export class FavoriListComponent {
  produits: Produit[] = [];
  loading = true;

  constructor(private favoriService: FavoriService) {}

  ngOnInit(): void {
    this.chargerFavoris();
    this.favoriService.favorisIds.subscribe((ids) => {
      this.produits = this.produits.filter(p => ids.has(p._id));
    });
  }

  chargerFavoris() {
    this.loading = true;
    this.favoriService.getMesFavoris().subscribe({
      next: (res) => {
        if (res.success) {
          this.produits = res.data
          .map(fav => fav.produit)   // récupère le produit
          .filter(p => p != null); // liste des produits favoris
          console.log(this.produits);
        } else {
          this.produits = [];
        }
        this.loading = false;
      },
      error: () => {
        this.produits = [];
        this.loading = false;
      }
    });
  }

  getImagePrincipale(produit: Produit): string {
    if (produit.images && Array.isArray(produit.images) && produit.images.length > 0) {
      const imagePrincipale = produit.images.find(img => img.principale);
      return imagePrincipale?.url || produit.images[0].url;
    }
    return 'assets/images/placeholder-product.png'; // image par défaut
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix);
  }
}
