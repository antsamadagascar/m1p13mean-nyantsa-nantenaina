import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../services/boutique.service';
import { EvaluationService } from '../../../services/evaluation.service';
import { Boutique,EvaluationClient } from '../../../models/boutique.model';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
// Import des utilitaires
import * as HorairesUtils from '../../../utils/boutique-horaires.util';
@Component({
  selector: 'app-boutiques-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  boutiques: Boutique[] = [];
  boutiquesFiltered: Boutique[] = [];
  boutiquesPaginated: Boutique[] = [];
  loading = false;
  heures: string[] = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // USER CONNECTÉ
  currentUser: any = null;

  // Filtres
  filters = {
    categorie: '',
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

  // ============================================
  // ÉVALUATION
  // ============================================
  evaluationsMap: { [boutiqueId: string]: EvaluationClient[] } = {};

  // Modal d'évaluation
  modalOuvert = false;
  boutiqueSelectionnee: Boutique | null = null;
  noteSelectionnee = 0;
  noteHover = 0;
  commentaire = '';
  soumissionEnCours = false;
  messageRetour = '';
  messageErreur = '';

  constructor(
    private boutiqueService: BoutiqueService,
    private evaluationService: EvaluationService,
    private alertService: AlertService,
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

      // Filtre par catégorie
      const categorieId = typeof boutique.categorie === 'string' ? boutique.categorie : boutique.categorie._id;
      if (this.filters.categorie && categorieId !== this.filters.categorie) {
        return false;
      }

      // Filtre par recherche
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        const nomMatch = boutique.nom.toLowerCase().includes(search);
        const descMatch = boutique.description.toLowerCase().includes(search);
        if (!nomMatch && !descMatch) return false;
      }

      // Filtre par boutiques ouvertes - UTILISE L'UTILITAIRE
      if (this.filters.ouvertes && !HorairesUtils.estOuverte(boutique.horaires)) {
        return false;
      }

      // Filtre par heure d'ouverture - UTILISE L'UTILITAIRE
      if (this.filters.heure_ouverture) {
        const heureRecherche = this.filters.heure_ouverture + ':00';
        const jourActuel = HorairesUtils.getJourActuel();
        
        if (!HorairesUtils.seraOuverte(boutique.horaires, heureRecherche, jourActuel)) {
          return false;
        }
      }

      // Filtre par lieu
      if (this.filters.lieu) {
        const lieu = this.filters.lieu.toLowerCase();

        const zoneNom =
          typeof boutique.localisation.zone === 'string'
            ? boutique.localisation.zone
            : boutique.localisation.zone?.nom || '';

        const adresse = boutique.localisation.adresse_complete || '';

        const zoneMatch = zoneNom.toLowerCase().includes(lieu);
        const adresseMatch = adresse.toLowerCase().includes(lieu);

        if (!zoneMatch && !adresseMatch) return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.filters = {
      categorie: '',
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
    const categories = this.boutiques
      .map(b => b.categorie)
      .filter(cat => typeof cat !== 'string');
    
    return categories.filter((cat, index, self) =>
      index === self.findIndex(c => 
        (typeof c !== 'string' && typeof cat !== 'string') && c._id === cat._id
      )
    );
  }

  getCategorieNom(categorie: any): string {
    return typeof categorie === 'string' ? categorie : categorie.nom;
  }

  getZoneNom(zone: any): string {
    return typeof zone === 'string' ? zone : zone.nom;
  }

  voirDetails(id: string) {
    this.router.navigate(['/boutiques', id]);
  }

  getAdresseComplete(boutique: Boutique): string {
    return boutique.localisation.adresse_complete || '';
  }

  /**
   * MÉTHODES UTILITAIRES POUR LE TEMPLATE
   * Exposent les fonctions utilitaires pour une utilisation dans le HTML
   */

  /**
   * Vérifie si une boutique est ouverte
   */
  estOuverte(boutique: Boutique): boolean {
    return HorairesUtils.estOuverte(boutique.horaires);
  }


  // ============================================
  // MÉTHODES ÉVALUATION
  // ============================================

  /** Retourne un tableau [1,2,3,4,5] pour les étoiles */
  get etoiles(): number[] {
    return [1, 2, 3, 4, 5];
  }

  /** Ouvre le modal d'évaluation pour une boutique */
  ouvrirEvaluation(boutique: Boutique, event: Event) {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.boutiqueSelectionnee = boutique;
    this.noteSelectionnee = 0;
    this.noteHover = 0;
    this.commentaire = '';
    this.messageRetour = '';
    this.messageErreur = '';
    this.modalOuvert = true;
  }

  fermerModal() {
    this.modalOuvert = false;
    this.boutiqueSelectionnee = null;
  }

  survolEtoile(note: number) {
    this.noteHover = note;
  }

  quitterSurvol() {
    this.noteHover = 0;
  }

  selectionnerNote(note: number) {
    this.noteSelectionnee = note;
  }
  getClassEtoile(star: number, moyenne: number): string {
    if (star <= Math.floor(moyenne)) return 'fa-solid';
    if (star === Math.ceil(moyenne) && moyenne % 1 >= 0.5) return 'fa-solid'; // demi arrondi
    return 'fa-regular';
  }
  /** Détermine si une étoile doit être pleine (survol ou sélection) */
  etoilePleine(index: number): boolean {
    return index <= (this.noteHover || this.noteSelectionnee);
  }
  soumettrEvaluation() {
    if (!this.boutiqueSelectionnee || this.noteSelectionnee === 0) {
      this.alertService.error('Veuillez sélectionner une note.');
      return;
    }
  
    this.soumissionEnCours = true;
  
    this.evaluationService.soumettre(this.boutiqueSelectionnee._id, {
      note: this.noteSelectionnee,
      commentaire: this.commentaire
    }).subscribe({
      next: () => {
        
        this.soumissionEnCours = false;  
        this.loadBoutiques();
        this.fermerModal();
        this.alertService.success('Merci pour votre avis !');
      },
      error: (err) => {
        console.error('Erreur soumission évaluation:', err);
        this.soumissionEnCours = false;
  
        this.alertService.error(
          err?.error?.message || 'Une erreur est survenue lors de l\'envoi de votre avis.'
        );
      }
    });
  }
  


}