import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BoutiqueService } from '../../../services/boutique.service';
import { Boutique } from '../../../models/boutique.model';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { SousCategorieService } from '../../../services/sous-categorie.service';

@Component({
  selector: 'app-boutiques',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './boutiques.component.html',
  styleUrls: ['./boutiques.component.css']
})
export class BoutiquesComponent implements OnInit {
  boutiques: Boutique[] = [];
  boutiquesFiltered: Boutique[] = [];
  loading = false;
  isModalOpen = false;

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

  // Modal création boutique
  categories: any[] = [];
  sousCategories: any[] = [];
  selectedCategorie: string = '';
  selectedSousCategorie: string = '';

  boutique = {
    nom: '',
    description: '',
    gerant: {
      nom: '',
      prenom: '',
      email: '',
      telephone: ''
    },
    localisation: {
      zone: '',
      etage: '',
      numero: '',
      surface: null
    },
    contact: {
      telephone: '',
      email: ''
    }
  };

  constructor(
    private boutiqueService: BoutiqueService,
    private alertService: AlertService,
    public authService: AuthService,
    private categoryService: CategoryService,
    private sousCategorieService: SousCategorieService
  ) {}

  ngOnInit() {
    console.log('📍 Page Boutiques chargée');
    console.log('👤 Utilisateur:', this.authService.getUserFullName());
    console.log('🔑 Rôle:', this.authService.getUserRole());
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

  // Méthodes pour le modal de création
  openModal() {
    this.isModalOpen = true;
    this.loadCategories();
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res: any) => {
        console.log('Catégories chargées :', res);
        this.categories = res.data;
      },
      error: (err) => console.error(err)
    });
  }

  onCategorieChange() {
    if (!this.selectedCategorie) {
      this.sousCategories = [];
      return;
    }
    this.sousCategorieService.getByCategorie(this.selectedCategorie).subscribe({
      next: (res: any) => {
        console.log('Sous-catégories chargées :', res);
        this.sousCategories = res.data || [];
      },
      error: (err) => console.error(err)
    });
  }

  resetForm() {
    this.categories = [];
    this.sousCategories = [];
    this.selectedCategorie = '';
    this.selectedSousCategorie = '';
    this.boutique = {
      nom: '',
      description: '',
      gerant: {
        nom: '',
        prenom: '',
        email: '',
        telephone: ''
      },
      localisation: {
        zone: '',
        etage: '',
        numero: '',
        surface: null
      },
      contact: {
        telephone: '',
        email: ''
      }
    };
  }

  submitBoutique() {
    const data = {
      ...this.boutique,
      categorie: this.selectedCategorie,
      sous_categories: this.selectedSousCategorie ? [this.selectedSousCategorie] : []
    };

    console.log('📤 Envoi:', data);

    this.boutiqueService.createBoutique(data).subscribe({
      next: (response) => {
        console.log('✅ Succès:', response);
        this.alertService.success('Boutique créée avec succès!');
        this.closeModal();
        this.loadBoutiques(); // Recharger la liste
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.alertService.error('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
      }
    });
  }
}