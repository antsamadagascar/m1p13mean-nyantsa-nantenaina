import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ZoneService, Zone } from '../../../services/zone.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zones.component.html'
})
export class ZonesComponent implements OnInit {

  zones: Zone[] = [];
  selectedZone: Zone = this.initZone();
  showModal = false;
  isEditing = false;
  loading = false;

  constructor(private zoneService: ZoneService, private alertService: AlertService) {}

  ngOnInit(): void {
    this.loadZones();
  }

  initZone(): Zone {
    return {
      _id: '', nom: '', slug: '', description: '', code: '',
       actif: true, ordre: 1,
      coordonnees: { latitude: 0, longitude: 0 },
      date_creation: new Date(),
      date_modification: new Date()
    };
  }

  loadZones() {
    this.loading = true;
    this.zoneService.getAllZones().subscribe({
      next: (res: any) => {
        this.zones = res.data;
        this.loading = false;
      },
      error: () => {
        this.alertService.error('Erreur lors du chargement des zones');
        this.loading = false;
      }
    });
  }

  openCreateModal() {
    this.selectedZone = this.initZone();
    this.isEditing = false;
    this.showModal = true;
  }

  openEditModal(zone: Zone) {
    this.selectedZone = { ...zone, coordonnees: zone.coordonnees || { latitude: 0, longitude: 0 } };
    this.isEditing = true;
    this.showModal = true;
  }

  saveZone(form: NgForm) {
    if (form.invalid) return;

    if (this.isEditing) {
      this.zoneService.updateZone(this.selectedZone._id, this.selectedZone).subscribe({
        next: () => { this.alertService.success('Zone mise à jour avec succès'); this.loadZones(); this.showModal = false; },
        error: err => this.alertService.error(err.error.message || 'Erreur mise à jour')
      });
    } else {
      this.zoneService.createZone(this.selectedZone).subscribe({
        next: () => { this.alertService.success('Zone créée avec succès'); this.loadZones(); this.showModal = false; },
        error: err => this.alertService.error(err.error.message || 'Erreur création')
      });
    }
  }

  deleteZone(zone: Zone) {
    if (!confirm(`Voulez-vous vraiment supprimer la zone "${zone.nom}" ?`)) return;
    this.zoneService.deleteZone(zone._id).subscribe({
      next: () => { this.alertService.success('Zone supprimée avec succès'); this.loadZones(); },
      error: err => this.alertService.error(err.error.message || 'Erreur suppression')
    });
  }

  toggleActif(zone: Zone) {
    this.zoneService.toggleZoneActif(zone._id).subscribe({
      next: () => this.loadZones(),
      error: err => this.alertService.error(err.error.message || 'Erreur activation/désactivation')
    });
  }
}
