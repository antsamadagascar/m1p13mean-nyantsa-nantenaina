import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProduitService } from '../../../services/produit.service';

@Component({
  selector: 'app-produit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.css']
})
export class ProduitComponent implements OnInit {

  produits: any[] = [];
  produitsFiltered: any[] = [];
  categories: any[] = [];

  stats = {
    total: 0,
    actifs: 0,
    stockFaible: 0,
    rupture: 0
  };

  filters = {
    search: '',
    categorie: ''
  };

  constructor(private produitService: ProduitService) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits() {
    this.produitService.getMesProduits().subscribe(data => {
      this.produits = data;
      this.produitsFiltered = data;
      this.extractCategories();
      this.calculateStats();
    });
  }

  extractCategories() {
    const map = new Map();
    this.produits.forEach(p => {
      if (p.categorie) map.set(p.categorie._id, p.categorie);
    });
    this.categories = Array.from(map.values());
  }

  calculateStats() {
    this.stats.total = this.produits.length;
    this.stats.actifs = this.produits.filter(p => p.actif).length;
    this.stats.stockFaible = this.produits.filter(p => p.quantite > 0 && p.quantite <= 5).length;
    this.stats.rupture = this.produits.filter(p => p.quantite === 0).length;
  }

  applyFilters() {
    this.produitsFiltered = this.produits.filter(p => {
      const matchSearch =
        p.nom.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        p.reference.toLowerCase().includes(this.filters.search.toLowerCase());
      const matchCategorie =
        !this.filters.categorie || p.categorie?._id === this.filters.categorie;
      return matchSearch && matchCategorie;
    });
  }

  resetFilters() {
    this.filters = { search: '', categorie: '' };
    this.produitsFiltered = this.produits;
  }

  deleteProduit(id: string) {
    if (confirm('Supprimer ce produit ?')) {
      this.produitService.delete(id).subscribe(() => this.loadProduits());
    }
  }

}
