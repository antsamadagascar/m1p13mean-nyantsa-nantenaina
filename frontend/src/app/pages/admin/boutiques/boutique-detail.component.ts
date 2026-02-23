import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoutiqueService } from '../../../services/boutique.service';
import { ZoneService } from '../../../services/zone.service';
import { CategoryService } from '../../../services/category.service';
import { SousCategorieService } from '../../../services/sous-categorie.service';
import { Boutique } from '../../../models/boutique.model';
import { AlertService } from '../../../services/alert.service';
import * as L from 'leaflet';
import {
  isValidUrl,
  isValidPhoneMG,
  isValidSocialHandle,
  cleanSocialHandle,
  isValidEmail
} from '../../../utils/formatters';


@Component({
  selector: 'app-boutique-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './boutique-detail.component.html'
})
export class BoutiqueDetailComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef;

  boutique: Boutique | null = null;
  loading = false;
  boutiqueId: string = '';
  showMap = false;
  private map: L.Map | null = null;

  // ============================================
  // ÉDITION
  // ============================================
  isEditing = false;
  isUpdating = false;
  editData: any = {};

  // Données pour les selects du formulaire
  zones: any[] = [];
  categories: any[] = [];
  sousCategories: any[] = [];
  selectedSousCategorie: string = '';
  urlErrors: Record<string, boolean> = {};
  uploadingImage: { [key: string]: boolean } = {};
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boutiqueService: BoutiqueService,
    private zoneService: ZoneService,
    private categoryService: CategoryService,
    private sousCategorieService: SousCategorieService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.boutiqueId = this.route.snapshot.paramMap.get('id') || '';

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = user.role || '';
      const monBoutiqueId = user.boutiqueId || user.boutique_id || user.boutique || '';
      if (role === 'BOUTIQUE' && monBoutiqueId && monBoutiqueId !== this.boutiqueId) {
        this.alertService.error('Accès refusé');
        return;
      }
    } catch {}

    this.loadBoutique();
    this.loadZones();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  // ============================================
  // CHARGEMENT DES DONNÉES POUR LE FORMULAIRE
  // ============================================
  loadZones() {
    this.zoneService.getAllZones(true).subscribe({
      next: (res: any) => this.zones = res.data || [],
      error: (err) => console.error('Erreur chargement zones:', err)
    });
  }

  validateUrl(field: string) {
    const value = this.editData.contact?.[field];
    this.urlErrors[field] = !isValidUrl(value);
  }

  validatePhone(field: string) {
    const value = this.editData.contact?.[field];
    this.urlErrors[field] = !isValidPhoneMG(value);
  }

  validateSocialHandle(field: string) {
    if (this.editData.contact?.[field]) {
      this.editData.contact[field] = cleanSocialHandle(this.editData.contact[field]);
    }
    const value = this.editData.contact?.[field];
    this.urlErrors[field] = !isValidSocialHandle(value);
  }

  validateEmail(field: 'email' | 'gerant') {
    if (field === 'gerant') {
      this.urlErrors['gerant_email'] = !isValidEmail(this.editData.gerant?.email);
    } else {
      this.urlErrors['contact_email'] = !isValidEmail(this.editData.contact?.email);
    }
  }

  validateGerantPhone() {
    this.urlErrors['gerant_telephone'] = !isValidPhoneMG(this.editData.gerant?.telephone);
  }

  hasUrlErrors(): boolean {
    return Object.values(this.urlErrors).some(e => e === true);
  }
  
  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res: any) => this.categories = res.data || [],
      error: (err) => console.error('Erreur chargement catégories:', err)
    });
  }

  onCategorieChange() {
    const categorieId = this.editData.categorie;
    if (!categorieId) {
      this.sousCategories = [];
      return;
    }
    this.sousCategorieService.getByCategorie(categorieId).subscribe({
      next: (res: any) => this.sousCategories = res.data || [],
      error: (err) => console.error(err)
    });
  }

  // ============================================
  // ÉDITION — MÉTHODES
  // ============================================
  startEdit() {
    if (!this.boutique) return;

    this.editData = {
      nom: this.boutique.nom,
      description: this.boutique.description,
      gerant: { ...this.boutique.gerant },
      localisation: {
        zone: typeof this.boutique.localisation.zone === 'object'
          ? (this.boutique.localisation.zone as any)._id
          : this.boutique.localisation.zone,
        adresse_complete: this.boutique.localisation.adresse_complete || '',
        latitude: this.boutique.localisation.latitude,
        longitude: this.boutique.localisation.longitude,
        surface: this.boutique.localisation.surface,
        emplacement_complet: this.boutique.localisation.emplacement_complet || ''
      },
      contact: { ...this.boutique.contact },
      categorie: typeof this.boutique.categorie === 'object'
        ? (this.boutique.categorie as any)._id
        : this.boutique.categorie,
      sous_categories: (this.boutique.sous_categories || []).map((s: any) =>
        typeof s === 'object' ? s._id : s
      )
    };

    // Pré-charge les sous-catégories si une catégorie est déjà sélectionnée
    if (this.editData.categorie) 
    {  this.onCategorieChange(); }

    // Pré-sélectionner la première sous-catégorie si elle existe
    this.selectedSousCategorie = this.editData.sous_categories?.[0] || '';

    this.isEditing = true;
  }

  cancelEdit() {
      this.isEditing = false;
      this.editData = {};
      this.sousCategories = [];
      this.selectedSousCategorie = '';
      this.urlErrors = {};
      this.uploadingImage = {};
    }

  onFileChange(event: any, field: 'logo' | 'banniere') {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.alertService.error('Image trop lourde (max 2MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.alertService.error('Fichier invalide');
      return;
    }

    // Prévisualisation immédiate
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.editData[field] = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    // Upload vers le serveur
    this.uploadingImage[field] = true;
    this.boutiqueService.uploadImageBoutique(this.boutique!._id, file, field).subscribe({
      next: (res: any) => {
        console.log('Upload OK:', res);
        this.editData[field] = res.url;
        this.uploadingImage[field] = false;
        this.cdr.detectChanges();
        this.alertService.success('Image uploadée');
      },
      error: () => {
        this.uploadingImage[field] = false;
        this.editData[field] = null;
        this.cdr.detectChanges();
        this.alertService.error('Erreur lors de l\'upload');
      }
    });
  }
  
  // Bloque submit si erreurs
  submitUpdate() {
    if (!this.boutique) return;

    if (this.hasUrlErrors()) {
      this.alertService.error('Veuillez corriger les erreurs avant d\'enregistrer');
      return;
    }

    // Vérifie qu'aucun upload est en cours
    if (Object.values(this.uploadingImage).some(v => v)) {
      this.alertService.error('Veuillez attendre la fin des uploads');
      return;
    }

    this.isUpdating = true;
    const dataToSend = {
      ...this.editData,
      sous_categories: this.selectedSousCategorie ? [this.selectedSousCategorie] : []
    };

    this.boutiqueService.updateBoutique(this.boutique._id, dataToSend).subscribe({
      next: (res: any) => {
        this.boutique = res.data;
        this.isEditing = false;
        this.isUpdating = false;
        this.alertService.success('Boutique mise à jour avec succès');
        this.loadBoutique();
      },
      error: (err: any) => {
        this.isUpdating = false;
        this.alertService.error(err.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }


  // ============================================
  // CARTE
  // ============================================
  destroyMap() {
    if (this.map) {
      try {
        this.map.off();
        this.map.remove();
      } catch (e) {}
      this.map = null;
    }
    const leafletContainers = document.querySelectorAll('.leaflet-container');
    leafletContainers.forEach(container => container.remove());
    this.showMap = false;
  }

  loadBoutique() {
    this.loading = true;
    this.destroyMap();

    this.boutiqueService.getBoutiqueDetailsById(this.boutiqueId).subscribe({
      next: (data) => {
        this.boutique = data;
        this.loading = false;
        setTimeout(() => {
          if (this.boutique?.localisation?.latitude && this.boutique?.localisation?.longitude) {
            this.showMap = true;
            this.cdr.detectChanges();
            setTimeout(() => this.initMap(), 300);
          }
        }, 100);
      },
      error: () => {
        this.alertService.error('Boutique non trouvée');
        this.router.navigate(['/backoffice/boutiques']);
        this.loading = false;
      }
    });
  }

  initMap() {
    if (!this.boutique?.localisation?.latitude || !this.boutique?.localisation?.longitude) return;
    if (!this.mapContainer?.nativeElement) return;
    if (this.map) { this.destroyMap(); return; }

    const mapElement = this.mapContainer.nativeElement;
    if (mapElement.classList.contains('leaflet-container')) {
      mapElement.innerHTML = '';
      mapElement.className = 'rounded-lg border border-gray-300';
    }

    const lat = this.boutique.localisation.latitude;
    const lng = this.boutique.localisation.longitude;

    try {
      this.map = L.map(mapElement, { center: [lat, lng], zoom: 16, scrollWheelZoom: false });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      const customIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker([lat, lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(`
          <div style="width:200px;font-family:Arial,sans-serif">
            <img src="${this.boutique.logo}" alt="${this.boutique.nom}"
              style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;"/>
            <h3 style="margin:0;font-size:16px;font-weight:bold;text-align:center">${this.boutique.nom}</h3>
          </div>
        `).openPopup();

      setTimeout(() => this.map?.invalidateSize(), 200);
    } catch (error) {
      console.error('Erreur initialisation carte:', error);
    }
  }

  // ============================================
  // ACTIONS BOUTIQUE
  // ============================================
  suspendre() {
    if (!this.boutique) return;
    const motif = prompt('Motif de suspension :');
    if (motif) {
      this.boutiqueService.suspendreBoutique(this.boutique._id, motif).subscribe({
        next: () => { this.alertService.success('Boutique suspendue'); this.loadBoutique(); },
        error: () => this.alertService.error('Erreur lors de la suspension')
      });
    }
  }

  reactiver() {
    if (!this.boutique) return;
    if (confirm('Voulez-vous réactiver cette boutique ?')) {
      this.boutiqueService.reactiverBoutique(this.boutique._id).subscribe({
        next: () => { this.alertService.success('Boutique réactivée'); this.loadBoutique(); },
        error: () => this.alertService.error('Erreur lors de la réactivation')
      });
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  getJours(): string[] {
    return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  }

  getZoneName(): string {
    if (!this.boutique?.localisation?.zone) return '-';
    return typeof this.boutique.localisation.zone === 'object'
      ? (this.boutique.localisation.zone as any).nom
      : this.boutique.localisation.zone;
  }
  
  isAdmin(): boolean {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role === 'ADMIN';
    } catch { return false; }
  }
}