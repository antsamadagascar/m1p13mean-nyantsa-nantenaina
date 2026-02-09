import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiqueService, Boutique } from '../../../services/boutique.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-boutiques',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutiques.component.html',
  styleUrls: ['./boutiques.component.css']
})
export class BoutiquesComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiquesFiltered: Boutique[] = [];
  loading = false;

  // Filtres
  filters = {
    statut: '',
    zone: '',
    search: ''
  };

  // Statistiques
  stats = {
    total: 0,
    actives: 0,
    en_attente: 0,
    suspendues: 0
  };

  constructor(
    private boutiqueService: BoutiqueService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadBoutiques();
  }

  loadBoutiques() {
    this.loading = true;
    this.boutiqueService.getBoutiques().subscribe({
      next: (data) => {
        this.boutiques = data;
        this.boutiquesFiltered = data;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        this.alertService.error('Erreur lors du chargement des boutiques');
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.stats.total = this.boutiques.length;
    this.stats.actives = this.boutiques.filter(b => 
      b.statut.actif && b.statut.valide_par_admin
    ).length;
    this.stats.en_attente = this.boutiques.filter(b => 
      b.statut.en_attente_validation
    ).length;
    this.stats.suspendues = this.boutiques.filter(b => 
      b.statut.suspendu
    ).length;
  }

  applyFilters() {
    this.boutiquesFiltered = this.boutiques.filter(boutique => {
      // Filtre par statut
      if (this.filters.statut) {
        if (this.filters.statut === 'actif' && 
            (!boutique.statut.actif || !boutique.statut.valide_par_admin)) {
          return false;
        }
        if (this.filters.statut === 'en_attente' && 
            !boutique.statut.en_attente_validation) {
          return false;
        }
        if (this.filters.statut === 'suspendu' && 
            !boutique.statut.suspendu) {
          return false;
        }
      }

      // Filtre par zone
      if (this.filters.zone && boutique.localisation.zone !== this.filters.zone) {
        return false;
      }

      // Filtre par recherche
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        return boutique.nom.toLowerCase().includes(search) ||
               boutique.gerant.nom.toLowerCase().includes(search) ||
               boutique.gerant.prenom.toLowerCase().includes(search);
      }

      return true;
    });
  }

  resetFilters() {
    this.filters = {
      statut: '',
      zone: '',
      search: ''
    };
    this.applyFilters();
  }

  getStatutBadgeClass(boutique: Boutique): string {
    if (boutique.statut.suspendu) {
      return 'bg-red-100 text-red-700';
    }
    if (boutique.statut.en_attente_validation) {
      return 'bg-yellow-100 text-yellow-700';
    }
    if (boutique.statut.actif && boutique.statut.valide_par_admin) {
      return 'bg-green-100 text-green-700';
    }
    return 'bg-gray-100 text-gray-700';
  }

  getStatutText(boutique: Boutique): string {
    if (boutique.statut.suspendu) return 'Suspendue';
    if (boutique.statut.en_attente_validation) return 'En attente';
    if (boutique.statut.actif && boutique.statut.valide_par_admin) return 'Active';
    return 'Inactive';
  }

  validerBoutique(id: string) {
    if (confirm('Voulez-vous valider cette boutique ?')) {
      this.boutiqueService.validerBoutique(id).subscribe({
        next: () => {
          this.alertService.success('Boutique validée avec succès');
          this.loadBoutiques();
        },
        error: () => {
          this.alertService.error('Erreur lors de la validation');
        }
      });
    }
  }

  suspendreBoutique(id: string) {
    const motif = prompt('Motif de suspension :');
    if (motif) {
      this.boutiqueService.suspendreBoutique(id, motif).subscribe({
        next: () => {
          this.alertService.success('Boutique suspendue');
          this.loadBoutiques();
        },
        error: () => {
          this.alertService.error('Erreur lors de la suspension');
        }
      });
    }
  }
}