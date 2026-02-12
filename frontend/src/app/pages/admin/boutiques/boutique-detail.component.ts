import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoutiqueService } from '../../../services/boutique.service';
import { Boutique } from '../../../models/boutique.model';
import { AlertService } from '../../../services/alert.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-boutique-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-detail.component.html'
})
export class BoutiqueDetailComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer?: ElementRef;
  
  boutique: Boutique | null = null;
  loading = false;
  boutiqueId: string = '';
  showMap = false;
  private map: L.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boutiqueService: BoutiqueService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.boutiqueId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBoutique();
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  destroyMap() {
    console.log(' Destruction de la carte...');
    
    if (this.map) {
      try {
        this.map.off();
        this.map.remove();
        console.log('Carte détruite');
      } catch (e) {
        console.error(' Erreur destruction:', e);
      }
      this.map = null;
    }

    //  Nettoye tous les conteneurs Leaflet orphelins
    const leafletContainers = document.querySelectorAll('.leaflet-container');
    leafletContainers.forEach((container, index) => {
      console.log(`Nettoyage conteneur orphelin ${index + 1}`);
      container.remove();
    });

    this.showMap = false;
  }

  loadBoutique() {
    this.loading = true;
    
    //  Detruit complètement avant de charger
    this.destroyMap();
    
    this.boutiqueService.getBoutiqueDetailsById(this.boutiqueId).subscribe({
      next: (data) => {
        this.boutique = data;
        this.loading = false;
        
        //  Attendre avant d'afficher la carte
        setTimeout(() => {
          if (this.boutique?.localisation?.latitude && this.boutique?.localisation?.longitude) {
            this.showMap = true;
            this.cdr.detectChanges();
            
            // Initialise après que le DOM soit prêt
            setTimeout(() => this.initMap(), 300);
          }
        }, 100);
      },
      error: (error) => {
        this.alertService.error('Boutique non trouvée');
        this.router.navigate(['/backoffice/boutiques']);
        this.loading = false;
      }
    });
  }

  initMap() {
    console.log(' Initialisation de la carte...');

    if (!this.boutique?.localisation?.latitude || !this.boutique?.localisation?.longitude) {
      console.warn(' Pas de coordonnées');
      return;
    }

    if (!this.mapContainer?.nativeElement) {
      console.error(' Conteneur introuvable');
      return;
    }

    //  Si la carte existe déjà, la détruire
    if (this.map) {
      console.warn(' Carte existante, destruction...');
      this.destroyMap();
      return;
    }

    const mapElement = this.mapContainer.nativeElement;

    //  Vérifier que l'élément est propre
    if (mapElement.classList.contains('leaflet-container')) {
      console.warn(' Leaflet déjà attaché, nettoyage complet...');
      mapElement.innerHTML = '';
      mapElement.className = 'rounded-lg border border-gray-300';
    }

    const lat = this.boutique.localisation.latitude;
    const lng = this.boutique.localisation.longitude;

    try {
      // Création de  la carte
      this.map = L.map(mapElement, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false
      });

      console.log(' Carte créée');

      // Tuiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      // Icône
      const customIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Marker
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

      marker.bindPopup(`
        <div style="width:200px;font-family:Arial,sans-serif">
          <img 
            src="${this.boutique.logo}" 
            alt="${this.boutique.nom}"
            style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;"
          />
          <h3 style="margin:0;font-size:16px;font-weight:bold;text-align:center">
            ${this.boutique.nom}
          </h3>
          <p style="margin:6px 0 0 0;text-align:center;color:#666">
             ${this.boutique.localisation.zone} • ${this.boutique.localisation.etage}
          </p>
        </div>
      `).openPopup();

      // Force le recalcul
      setTimeout(() => {
        this.map?.invalidateSize();
        console.log(' Carte complètement initialisée');
      }, 200);

    } catch (error) {
      console.error(' Erreur initialisation:', error);
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

  getZoneName(): string {
  if (!this.boutique?.localisation?.zone) return '-';
  return typeof this.boutique.localisation.zone === 'object'
    ? this.boutique.localisation.zone.nom
    : this.boutique.localisation.zone;
}

}