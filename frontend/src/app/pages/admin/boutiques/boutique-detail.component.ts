import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoutiqueService, Boutique } from '../../../services/boutique.service';
import { AlertService } from '../../../services/alert.service';
import * as L from 'leaflet'; // ✅ IMPORT LEAFLET

@Component({
  selector: 'app-boutique-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-detail.component.html'
})
export class BoutiqueDetailComponent implements OnInit, AfterViewInit {
  boutique: Boutique | null = null;
  loading = false;
  boutiqueId: string = '';
  private map: L.Map | null = null; // ✅ CARTE

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boutiqueService: BoutiqueService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.boutiqueId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBoutique();
  }

  ngAfterViewInit() {
    // La carte sera initialisée après le chargement de la boutique
  }

  loadBoutique() {
    this.loading = true;
    this.boutiqueService.getBoutiqueById(this.boutiqueId).subscribe({
      next: (data) => {
        this.boutique = data;
        this.loading = false;
        
        // ✅ Initialiser la carte après chargement
        setTimeout(() => this.initMap(), 100);
      },
      error: (error) => {
        this.alertService.error('Boutique non trouvée');
        this.router.navigate(['/backoffice/boutiques']);
        this.loading = false;
      }
    });
  }

  // ✅ INITIALISER LA CARTE
  initMap() {
    if (!this.boutique?.localisation.latitude || !this.boutique?.localisation.longitude) {
      return; // Pas de coordonnées
    }

    const lat = this.boutique.localisation.latitude;
    const lng = this.boutique.localisation.longitude;

    // Créer la carte
    this.map = L.map('map').setView([lat, lng], 15);

    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // ✅ Icône personnalisée (marker bleu)
    const customIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Ajouter un marker
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

    // Popup avec infos
    marker.bindPopup(`
      <div style="width:200px;font-family:Arial,sans-serif">

        <img 
          src="${this.boutique?.logo}" 
          alt="${this.boutique?.nom}"
          style="
            width:100%;
            height:100px;
            object-fit:cover;
            border-radius:8px;
            margin-bottom:8px;
          "
        />

        <h3 style="margin:0;font-size:16px;font-weight:bold;text-align:center">
          ${this.boutique?.nom}
        </h3>

        <p style="margin:6px 0 0 0;text-align:center;color:#666">
          📍 ${this.boutique?.localisation.zone} • ${this.boutique?.localisation.etage}
        </p>

      </div>
    `, { maxWidth: 250 }).openPopup();

  }

  valider() {
    if (!this.boutique) return;
    if (confirm('Voulez-vous valider cette boutique ?')) {
      this.boutiqueService.validerBoutique(this.boutique._id).subscribe({
        next: () => {
          this.alertService.success('Boutique validée avec succès');
          this.loadBoutique();
        },
        error: () => {
          this.alertService.error('Erreur lors de la validation');
        }
      });
    }
  }

  suspendre() {
    if (!this.boutique) return;
    const motif = prompt('Motif de suspension :');
    if (motif) {
      this.boutiqueService.suspendreBoutique(this.boutique._id, motif).subscribe({
        next: () => {
          this.alertService.success('Boutique suspendue');
          this.loadBoutique();
        },
        error: () => {
          this.alertService.error('Erreur lors de la suspension');
        }
      });
    }
  }

  reactiver() {
    if (!this.boutique) return;
    if (confirm('Voulez-vous réactiver cette boutique ?')) {
      this.boutiqueService.reactiverBoutique(this.boutique._id).subscribe({
        next: () => {
          this.alertService.success('Boutique réactivée');
          this.loadBoutique();
        },
        error: () => {
          this.alertService.error('Erreur lors de la réactivation');
        }
      });
    }
  }

  getJours(): string[] {
    return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  }
}