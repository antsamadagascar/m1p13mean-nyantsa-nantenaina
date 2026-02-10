import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BoutiqueService, Boutique } from '../../../services/boutique.service';
import { AuthService } from '../../../services/auth.service'; 

@Component({
  selector: 'app-boutiques-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  boutiques: Boutique[] = [];
  boutiquesFiltered: Boutique[] = [];
  boutiquesPaginated: Boutique[] = [];
  loading = false;

  // USER CONNECTÉ
  currentUser: any = null;

  // Filtres
  filters = {
    categorie: '',
    zone: '',
    search: '',
    ouvertes: false,
    heure_ouverture: '',
    lieu: ''
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  // Vue
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private boutiqueService: BoutiqueService,
    private router: Router,
    private authService: AuthService   
  ) {}

  ngOnInit() {
    this.loadBoutiques();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Current user dans boutiques:', user);
    });
  }

  loadBoutiques() {
    this.loading = true;
    this.boutiqueService.getBoutiquesPublic().subscribe({
      next: (data) => {
        this.boutiques = data;
        this.boutiquesFiltered = data;
        this.updatePagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement boutiques:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.boutiquesFiltered = this.boutiques.filter(boutique => {

      if (this.filters.categorie && boutique.categorie._id !== this.filters.categorie) {
        return false;
      }

      if (this.filters.zone && boutique.localisation.zone !== this.filters.zone) {
        return false;
      }

      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        const nomMatch = boutique.nom.toLowerCase().includes(search);
        const descMatch = boutique.description.toLowerCase().includes(search);
        if (!nomMatch && !descMatch) return false;
      }

      if (this.filters.ouvertes && !boutique.estOuverte) {
        return false;
      }

      if (this.filters.heure_ouverture) {
        const maintenant = new Date();
        const jour = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][maintenant.getDay()];
        const horaireJour = boutique.horaires[jour];

        if (!horaireJour.ouvert) return false;

        const heureRecherche = this.filters.heure_ouverture;
        const [hD] = horaireJour.debut.split(':');
        const [hF] = horaireJour.fin.split(':');

        if (heureRecherche < hD || heureRecherche > hF) {
          return false;
        }
      }

      if (this.filters.lieu) {
        const lieu = this.filters.lieu.toLowerCase();
        const zoneMatch = boutique.localisation.zone.toLowerCase().includes(lieu);
        const etageMatch = boutique.localisation.etage.toLowerCase().includes(lieu);
        const numeroMatch = boutique.localisation.numero.toLowerCase().includes(lieu);
        if (!zoneMatch && !etageMatch && !numeroMatch) return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.filters = {
      categorie: '',
      zone: '',
      search: '',
      ouvertes: false,
      heure_ouverture: '',
      lieu: ''
    };
    this.applyFilters();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.boutiquesFiltered.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.boutiquesPaginated = this.boutiquesFiltered.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() { this.goToPage(this.currentPage + 1); }
  previousPage() { this.goToPage(this.currentPage - 1); }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  getUniqueCategories() {
    const categories = this.boutiques.map(b => b.categorie);
    return categories.filter((cat, index, self) =>
      index === self.findIndex(c => c._id === cat._id)
    );
  }

  voirDetails(id: string) {
    this.router.navigate(['/boutiques', id]);
  }
}
