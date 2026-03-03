import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BoutiqueService } from '../../../services/boutique.service';
import { ZoneService } from '../../../services/zone.service';
import { Boutique } from '../../../models/boutique.model';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { SousCategorieService } from '../../../services/sous-categorie.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
  isSubmitting = false;

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

  //  Zones dynamiques
  zones: any[] = [];

  // Modal création boutique
  categories: any[] = [];
  sousCategories: any[] = [];
  selectedCategorie: string = '';
  selectedSousCategorie: string = '';

  //vao2
  locationsDisponibles: any[] = [];
  locationSelectionnee: any = null;

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
    //  zone: '' as any,
      numero: '',
      surface: null,
      latitude: null,
      longitude: null,
      adresse_complete: ''
    },
    contrat: {
      loyer_mensuel: null,
      date_debut: '',
      date_fin: '',
      notes:''
    },
    contact: {
      telephone: '',
      email: ''
    },
    //  Horaires par défaut
    horaires: {
      lundi: { ouvert: true, debut: '09:00', fin: '19:00' },
      mardi: { ouvert: true, debut: '09:00', fin: '19:00' },
      mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
      jeudi: { ouvert: true, debut: '09:00', fin: '19:00' },
      vendredi: { ouvert: true, debut: '09:00', fin: '21:00' },
      samedi: { ouvert: true, debut: '10:00', fin: '21:00' },
      dimanche: { ouvert: true, debut: '10:00', fin: '18:00' }
    }
  };

  constructor(
    private boutiqueService: BoutiqueService,
    private zoneService: ZoneService,
    private alertService: AlertService,
    public authService: AuthService,
    private categoryService: CategoryService,
    private sousCategorieService: SousCategorieService,
    private router: Router ,
    private http: HttpClient ,
  ) {}

   ngOnInit() {
  //   console.log('Page Boutiques chargée');
  //   console.log(' Utilisateur:', this.authService.getUserFullName());
  //   console.log(' Rôle:', this.authService.getUserRole());
    this.loadBoutiques();
    // this.loadZones();
    this.chargeEmplacement();
  }
  private api = `${environment.apiUrl}/api`;
  //  Charge tous  les zones actives (vao2)
  // loadZones() {
  //   this.zoneService.getAllZones(true).subscribe({
  //     next: (res: any) =>
  //     {   this.zones = res.data || []; console.log(' Zones chargées:', this.zones);

  //     },
  //     error: (err) => {
  //       console.error(' Erreur chargement zones:', err);
  //       this.alertService.error('Erreur lors du chargement des zones');
  //     }
  //   });
  // }

  getCategorieNom(categorie: any): string {
    return typeof categorie === 'string' ? categorie : categorie.nom;
  }

  // getZoneNom(zone: any): string {
  //   return typeof zone === 'string' ? zone : zone.nom;
  // }

  getZoneNom(zone: any): string {
    if (!zone) return 'Non renseignée';
    return typeof zone === 'string' ? zone : zone.nom || 'Non renseignée';
  }

 loadBoutiques() {
  this.loading = true;
  this.boutiqueService.getBoutiques().subscribe({
    next: (response: any) => {
      //  Vérifie si response.data existe
      this.boutiques = Array.isArray(response.data) ? response.data : [];
      this.boutiquesFiltered = this.boutiques;
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
      b.statut.actif
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
            (!boutique.statut.actif)) {
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
      if (this.filters.zone) {
        const zoneId = typeof boutique.localisation.zone === 'string'
          ? boutique.localisation.zone
          : boutique.localisation.zone?._id;

        if (zoneId !== this.filters.zone) {
          return false;
        }
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
    if (boutique.statut.actif) {
      return 'bg-green-100 text-green-700';
    }
    return 'bg-gray-100 text-gray-700';
  }

  getStatutText(boutique: Boutique): string {
    if (boutique.statut.suspendu) return 'Suspendue';
    if (boutique.statut.en_attente_validation) return 'En attente';
    if (boutique.statut.actif) return 'Active';
    return 'Inactive';
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
        // zone: '',
        numero: '',
        surface: null,
        latitude: null,
        longitude: null,
        adresse_complete: ''
      },
      contrat: { loyer_mensuel: null, date_debut: '', date_fin: '', notes: '' },
      contact: {
        telephone: '',
        email: ''
      },
      horaires: {
        lundi: { ouvert: true, debut: '09:00', fin: '19:00' },
        mardi: { ouvert: true, debut: '09:00', fin: '19:00' },
        mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
        jeudi: { ouvert: true, debut: '09:00', fin: '19:00' },
        vendredi: { ouvert: true, debut: '09:00', fin: '21:00' },
        samedi: { ouvert: true, debut: '10:00', fin: '21:00' },
        dimanche: { ouvert: true, debut: '10:00', fin: '18:00' }
      }
    };
  }

  // Formatage automatique du téléphone
  formatPhoneNumber(event: any, field: 'gerant' | 'contact') {
    let input = event.target.value;
    let cleaned = input.replace(/[^\d+]/g, '');

    if (cleaned === '' || cleaned === '+') {
      if (field === 'gerant') {
        this.boutique.gerant.telephone = '+261 ';
      } else {
        this.boutique.contact.telephone = '+261 ';
      }
      return;
    }

    if (!cleaned.startsWith('+261')) {
      if (cleaned.startsWith('3') || cleaned.startsWith('0')) {
        cleaned = '+261' + cleaned.replace(/^0/, '');
      } else if (cleaned.startsWith('+')) {
        cleaned = '+261' + cleaned.substring(1);
      } else {
        cleaned = '+261' + cleaned;
      }
    }

    const afterPrefix = cleaned.substring(4);
    const digitsOnly = afterPrefix.replace(/\D/g, '');

    let formatted = '+261';

    if (digitsOnly.length > 0) {
      formatted += ' ' + digitsOnly.substring(0, 2);
    }
    if (digitsOnly.length > 2) {
      formatted += ' ' + digitsOnly.substring(2, 4);
    }
    if (digitsOnly.length > 4) {
      formatted += ' ' + digitsOnly.substring(4, 7);
    }
    if (digitsOnly.length > 7) {
      formatted += ' ' + digitsOnly.substring(7, 9);
    }

    if (digitsOnly.length <= 9) {
      if (field === 'gerant') {
        this.boutique.gerant.telephone = formatted;
      } else {
        this.boutique.contact.telephone = formatted;
      }
    }

    setTimeout(() => {
      event.target.setSelectionRange(formatted.length, formatted.length);
    }, 0);
  }

  onPhoneFocus(field: 'gerant' | 'contact') {
    const currentValue = field === 'gerant'
      ? this.boutique.gerant.telephone
      : this.boutique.contact.telephone;

    if (!currentValue || currentValue.trim() === '') {
      if (field === 'gerant') {
        this.boutique.gerant.telephone = '+261 ';
      } else {
        this.boutique.contact.telephone = '+261 ';
      }
    }
  }

  submitBoutique() {
    if (!this.locationSelectionnee) {
      this.alertService.error('Veuillez sélectionner un emplacement');
      return;
    }

    //  Vérification contrat
    if (!this.boutique.contrat.loyer_mensuel) {
      this.alertService.error('Le loyer mensuel est requis');
      return;
    }

    if (!this.boutique.contrat.date_debut) {
      this.alertService.error('La date de début du contrat est requise');
      return;
    }

    this.isSubmitting = true;

    const localisationData = {
      ...this.boutique.localisation,
      adresse_complete: this.boutique.localisation.adresse_complete
    };

    const data = {
      ...this.boutique,
      localisation: localisationData,
      categorie: this.selectedCategorie,
      sous_categories: this.selectedSousCategorie ? [this.selectedSousCategorie] : []
    };

    this.boutiqueService.createBoutique(data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.alertService.success("Boutique créée avec succès !");
        this.closeModal();
        this.loadBoutiques();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.alertService.error('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
      }
    });
  }


  goToZones() {
    this.router.navigate(['/backoffice/zones']);
  }

  private h() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` }) };
  }

  // onZoneChange() {
  //   const zoneId = this.boutique.localisation.zone;
  //   if (!zoneId) { this.locationsDisponibles = []; this.locationSelectionnee = null; return; }
  //   this.http.get<{emplacements: any[]}>(`${this.api}/emplacements/disponibles?zone=${zoneId}`, this.h()).subscribe({
  //     next: (res) => { this.locationsDisponibles = res.emplacements; this.locationSelectionnee = null; },
  //     error: () => { this.alertService.error('Erreur chargement emplacements'); }
  //   });
  // }

  chargeEmplacement() {
    this.http.get<{ emplacements: any[] }>(
      `${this.api}/emplacements/disponibles`,
      this.h()
    ).subscribe({
      next: (res) => {
        this.locationsDisponibles = res.emplacements;
        this.locationSelectionnee = null;
      },
      error: () => {
        this.alertService.error('Erreur chargement emplacements');
      }
    });
  }


  onEmplacementChange(id: string) {
    const loc = this.locationsDisponibles.find(l => l._id === id);
    if (!loc) return;
    this.locationSelectionnee = loc;
    this.boutique.localisation.surface    = loc.surface;
    this.boutique.localisation.latitude   = loc.latitude;
    this.boutique.localisation.longitude  = loc.longitude;
    this.boutique.localisation.numero     = loc.numero_local;
    (this.boutique.localisation as any).emplacement = loc._id;
  }

}
