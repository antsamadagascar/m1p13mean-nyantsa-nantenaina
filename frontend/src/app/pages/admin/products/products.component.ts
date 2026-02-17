import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/produit.service';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { Produit, FiltresProduits, FiltresDisponibles } from '../../../models/produit.model';
interface BoutiqueSimple {
  _id: string;
  nom: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  produits: Produit[] = [];
  filtresDisponibles: FiltresDisponibles | null = null;
  toutesBoutiques: BoutiqueSimple[] = [];
  loading = false;
  
  filtres: FiltresProduits = {
    page: 1,
    limite: 20,
    tri: 'nouveaute'
  };
  
  totalProduits = 0;
  totalPages = 0;
  
  rechercheTexte = '';
  boutiqueSelectionnee = '';
  categorieSelectionnee = '';
  statutSelectionne = '';

  constructor(
    private productService: ProductService,
    public authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.chargerToutesBoutiques();
    this.productService.getFiltresDisponibles().subscribe({
      next: (filtres) => this.filtresDisponibles = filtres
    });
    this.chargerProduits();
  }

  chargerToutesBoutiques(): void {
    this.productService.getAllBoutiques().subscribe({
      next: (boutiques) => {
        this.toutesBoutiques = boutiques;
      },
      error: (error) => {
        console.error('Erreur chargement boutiques:', error);
      }
    });
  }

  chargerProduits() {
    this.loading = true;
    
    // Passer isAdmin=true pour voir tous les statuts
    this.productService.getProduits(this.filtres, true).subscribe({
      next: (resultats) => {
        this.produits = resultats.produits;
        this.totalProduits = resultats.total;
        this.totalPages = resultats.pages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement produits:', error);
        this.alertService.error('Erreur lors du chargement des produits');
        this.loading = false;
      }
    });
  }

  appliquerFiltres() {
    this.filtres = {
      ...this.filtres,
      page: 1,
      recherche: this.rechercheTexte || undefined,
      boutique: this.boutiqueSelectionnee || undefined,
      categorie: this.categorieSelectionnee || undefined,
      statut: this.statutSelectionne || undefined
    };
    this.chargerProduits();
  }

  changerTri(tri: string) {
    this.filtres.tri = tri;
    this.chargerProduits();
  }

  changerPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.filtres.page = page;
      this.chargerProduits();
    }
  }

  onStatutChange(event: Event, produit: Produit): void {
    const target = event.target as HTMLSelectElement;
    const nouveauStatut = target.value;
    const ancienStatut = produit.statut;
    
    if (confirm(`Changer le statut de "${produit.nom}" en "${nouveauStatut}" ?`)) {
      this.productService.updateStatutProduit(produit._id, nouveauStatut).subscribe({
        next: (response: any) => {

          // Le backend retourne { message, produit }
          const produitMisAJour = response.produit || response;
          
          const index = this.produits.findIndex(p => p._id === produit._id);
          if (index !== -1) {
            this.produits[index] = produitMisAJour;
          }
          this.alertService.success('Statut mis à jour avec succès');
        },
        error: (error) => {
          console.error('Erreur mise à jour statut:', error);
          this.alertService.error('Erreur lors de la mise à jour du statut');
          target.value = ancienStatut;
        }
      });
    } else {
      target.value = ancienStatut;
    }
  }

  peutModifier(produit: Produit): boolean {
    return true;
  }

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'BROUILLON': 'bg-yellow-100 text-yellow-800',
      'ACTIF': 'bg-green-100 text-green-800',
      'RUPTURE': 'bg-red-100 text-red-800',
      'ARCHIVE': 'bg-gray-100 text-gray-800'
    };
    return classes[statut] || 'bg-gray-100 text-gray-800';
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'BROUILLON': 'Brouillon',
      'ACTIF': 'Actif',
      'RUPTURE': 'Rupture de stock',
      'ARCHIVE': 'Archivé'
    };
    return labels[statut] || statut;
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}