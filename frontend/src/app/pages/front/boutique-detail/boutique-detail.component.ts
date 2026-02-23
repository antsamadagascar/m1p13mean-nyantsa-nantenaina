import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BoutiqueService } from '../../../services/boutique.service';
import { ProductService } from '../../../services/produit.service';
import { Boutique,EvaluationClient } from '../../../models/boutique.model';
import { Produit } from '../../../models/produit.model';
import { EvaluationService } from '../../../services/evaluation.service';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import * as L from 'leaflet';

// Import des utilitaires
import * as HorairesUtils from '../../../utils/boutique-horaires.util';

import { BtnFavoriComponent } from '../btn-favori/btn-favori.component';

@Component({
  selector: 'app-boutique-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,BtnFavoriComponent],
  templateUrl: './boutique-detail.component.html',
  styleUrls: ['./boutique-detail.component.css']
})

export class BoutiqueDetailComponent implements OnInit, OnDestroy {
  boutique: Boutique | null = null;
  produits: Produit[] = [];
  currentUser: any = null;
  
  loading = true;
  loadingProduits = true;
  error: string | null = null;
  
  page = 1;
  limite = 12;
  totalProduits = 0;
  totalPages = 0;
  
  triProduits = 'nouveaute';
  ongletActif: 'produits' | 'apropos' | 'horaires' = 'produits';

  // ============================================
  // ÉVALUATIONS PRODUIT
  // ============================================
  modalProduitOuvert = false;
  produitSelectionne: Produit | null = null;
  noteSelectProduit = 0;
  noteHoverProduit = 0;
  commentaireProduit = '';
  soumissionProduitEnCours = false;
  messageRetourProduit = '';
  messageErreurProduit = '';
  
  // Utiliser l'utilitaire pour l'ordre des jours
  joursOrdre = HorairesUtils.getJoursOrdre();
  private map: L.Map | null = null;


  private destroy$ = new Subject<void>();

  constructor(
    private boutiqueService: BoutiqueService,
    private productService: ProductService,
    private evaluationService: EvaluationService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router

  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.chargerBoutique(id);
        this.chargerProduitsBoutique(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) { this.map.remove(); this.map = null; }
  }


  // Modifie changerOnglet
  changerOnglet(onglet: 'produits' | 'apropos' | 'horaires'): void {
    this.ongletActif = onglet;
    if (onglet === 'apropos') {
      setTimeout(() => this.initMap(), 300);
    }
  }



  /**
   * Vérifie si c'est aujourd'hui - utilise l'utilitaire
   */
  estAujourdhui(jour: string): boolean {
    return HorairesUtils.estAujourdhui(jour);
  }

  chargerBoutique(id: string): void {
    this.loading = true;
    this.error = null;

    this.boutiqueService.getBoutiqueById(id).subscribe({
      next: (boutique) => {
        this.boutique = boutique;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement boutique:', err);
        this.error = 'Boutique introuvable';
        this.loading = false;
      }
    });
  }

  chargerProduitsBoutique(boutiqueId: string): void {
    this.loadingProduits = true;

    this.productService.getProduits({
      boutique: boutiqueId,
      tri: this.triProduits,
      page: this.page,
      limite: this.limite
    }).subscribe({
      next: (resultats) => {
        this.produits = resultats.produits;
        this.totalProduits = resultats.total;
        this.totalPages = resultats.pages;
        this.loadingProduits = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.loadingProduits = false;
      }
    });
  }

  changerTri(tri: string): void {
    this.triProduits = tri;
    this.page = 1;
    if (this.boutique) {
      this.chargerProduitsBoutique(this.boutique._id);
    }
  }

  onTriChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.changerTri(target.value);
  }

  changerPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.page = page;
    if (this.boutique) {
      this.chargerProduitsBoutique(this.boutique._id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Vérifie si la boutique est ouverte - utilise l'utilitaire
   */
  estOuverte(): boolean {
    return HorairesUtils.estOuverte(this.boutique?.horaires);
  }

  /**
   * Obtient le message de statut - utilise l'utilitaire
   */
  getStatutMessage(): string {
    if (!this.boutique) {
      return 'Chargement...';
    }
    return HorairesUtils.getStatutMessage(this.boutique.horaires);
  }

  peutAcheter(produit: Produit): boolean {
    return this.estOuverte() && !produit.en_rupture;
  }

  getMessageAchat(produit: Produit): string {
    if (!this.estOuverte()) {
      return 'Boutique fermée';
    }
    if (produit.en_rupture) {
      return 'Rupture de stock';
    }
    return 'Ajouter au panier';
  }

  getImagePrincipale(produit: Produit): string {
    const imagePrincipale = produit.images.find(img => img.principale);
    return imagePrincipale?.url || produit.images[0]?.url || 'assets/images/placeholder-product.png';
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix);
  }

  getCategorieNom(): string {
    if (!this.boutique?.categorie) return '';
    return typeof this.boutique.categorie === 'string' 
      ? this.boutique.categorie 
      : this.boutique.categorie.nom;
  }

  getZoneNom(): string {
    if (!this.boutique?.localisation?.zone) {
      return 'Non renseignée';
    }
    
    if (typeof this.boutique.localisation.zone === 'object' && this.boutique.localisation.zone.nom) {
      return this.boutique.localisation.zone.nom;
    }
    
    if (typeof this.boutique.localisation.zone === 'string') {
      return 'Zone ID: ' + this.boutique.localisation.zone;
    }
    
    return 'Non définie';
  }

  /**
   * Obtient les horaires du jour - utilise l'utilitaire
   */
  getHorairesAujourdhui(): string {
    if (!this.boutique) {
      return 'Chargement...';
    }
    return HorairesUtils.getHorairesAujourdhui(this.boutique.horaires);
  }

  voirProduit(slug: string): void {
    this.router.navigate(['/produits', slug]);
  }

  getPagesArray(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.page - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }


    // Ajouter initMap
  initMap(): void {
    if (!this.boutique?.localisation?.latitude || !this.boutique?.localisation?.longitude) return;

    const mapEl = document.getElementById('map-front');
    if (!mapEl || this.map) return;

    const lat = this.boutique.localisation.latitude;
    const lng = this.boutique.localisation.longitude;

    this.map = L.map(mapEl, { center: [lat, lng], zoom: 16, scrollWheelZoom: false });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const icon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(`<strong>${this.boutique.nom}</strong>`)
      .openPopup();

    setTimeout(() => this.map?.invalidateSize(), 200);
  }
    // ============================================
  // MODAL PRODUIT
  // ============================================
  ouvrirModalProduit(produit: Produit, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // if (!this.currentUser) { this.router.navigate(['/auth/login']); return; }

    this.produitSelectionne = produit;
    this.noteSelectProduit = 0;
    this.noteHoverProduit = 0;
    this.commentaireProduit = '';
    this.messageRetourProduit = '';
    this.messageErreurProduit = '';
    this.modalProduitOuvert = true;
  }

  fermerModalProduit(): void { this.modalProduitOuvert = false; this.produitSelectionne = null; }

  soumettreEvaluationProduit(): void {
    if (!this.produitSelectionne || this.noteSelectProduit === 0) return;

    this.soumissionProduitEnCours = true;
    this.evaluationService.soumettreEvaluationProduit(this.produitSelectionne._id, {
      note: this.noteSelectProduit,
      commentaire: this.commentaireProduit
    }).subscribe({
      next: (res) => {
        // this.messageRetourProduit = 'Merci pour votre avis !';
        this.soumissionProduitEnCours = false;
        if (this.boutique) {
          this.chargerProduitsBoutique(this.boutique._id);
        }
        this.fermerModalProduit();
        this.alertService.success('Merci pour votre avis !');
      },
      error: (err) => {
        // this.messageErreurProduit = err?.error?.message || 'Une erreur est survenue.';
        this.soumissionProduitEnCours = false;
        this.alertService.error(
          err?.error?.message || 'Une erreur est survenue lors de l\'envoi de votre avis.'
        );
      }
    });
  }

  // ============================================
  // UTILITAIRES ÉTOILES
  // ============================================
  getClassEtoile(star: number, moyenne: number): string {
    return star <= Math.round(moyenne) ? 'fa-solid' : 'fa-regular';
  }

  getClassEtoileProduit(star: number, moyenne: number): string {
    if (star <= Math.floor(moyenne)) return 'fa-solid';
    if (star === Math.ceil(moyenne) && moyenne % 1 >= 0.5) return 'fa-solid';
    return 'fa-regular';
  }
}