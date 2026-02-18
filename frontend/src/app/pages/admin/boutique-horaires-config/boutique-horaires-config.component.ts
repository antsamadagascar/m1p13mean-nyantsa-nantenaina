import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';

interface JourHoraire {
  ouvert: boolean;
  debut: string;
  fin: string;
}

interface Horaires {
  lundi: JourHoraire;
  mardi: JourHoraire;
  mercredi: JourHoraire;
  jeudi: JourHoraire;
  vendredi: JourHoraire;
  samedi: JourHoraire;
  dimanche: JourHoraire;
}

@Component({
  selector: 'app-boutique-horaires-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique-horaires-config.component.html',
  styleUrl: './boutique-horaires-config.component.css'
})

export class BoutiqueHorairesConfigComponent implements OnInit {

  boutiqueName: string = '';
  fetchLoading = false;
  saving = false;

  joursKeys: (keyof Horaires)[] = [
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ];

  joursLabels: Record<keyof Horaires, string> = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche'
  };

  //default horaire
  horaires: Horaires = {
    lundi:    { ouvert: true, debut: '09:00', fin: '19:00' },
    mardi:    { ouvert: true, debut: '09:00', fin: '19:00' },
    mercredi: { ouvert: true, debut: '09:00', fin: '19:00' },
    jeudi:    { ouvert: true, debut: '09:00', fin: '19:00' },
    vendredi: { ouvert: true, debut: '09:00', fin: '21:00' },
    samedi:   { ouvert: true, debut: '10:00', fin: '21:00' },
    dimanche: { ouvert: true, debut: '10:00', fin: '18:00' },
  };

  private boutiqueId: string = '';
  private apiUrl = `${environment.apiUrl}/api/boutiques`;

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    // Récupére le boutiqueId depuis le localStorage
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.boutiqueId = user.boutiqueId || user.boutique_id || user.boutique || '';
    } catch {
      this.boutiqueId = '';
    }

    if (!this.boutiqueId) {
      this.alertService.error('Boutique introuvable, veuillez vous reconnecter');
      return;
    }

    this.chargerMesHoraires();
  }

  chargerMesHoraires() {
    this.fetchLoading = true;
    this.http.get<any>(`${this.apiUrl}/horaires/${this.boutiqueId}`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.boutiqueName = data.nom || '';
        if (data.horaires) {
          this.horaires = data.horaires;
        }
        this.fetchLoading = false;
      },
      error: () => {
        this.alertService.error('Impossible de charger les horaires');
        this.fetchLoading = false;
      }
    });
  }

  sauvegarder() {
    if (!this.boutiqueId) return;
    this.saving = true;
    this.http.patch<any>(`${this.apiUrl}/horaires/${this.boutiqueId}`, { horaires: this.horaires }).subscribe({
      next: () => {
        this.alertService.success('Horaires mis à jour avec succès');
        this.saving = false;
      },
      error: () => {
        this.alertService.error('Erreur lors de la sauvegarde');
        this.saving = false;
      }
    });
  }

  toutOuvrir() {
    this.joursKeys.forEach(j => this.horaires[j].ouvert = true);
  }

  toutFermer() {
    this.joursKeys.forEach(j => this.horaires[j].ouvert = false);
  }

  isWeekend(jour: keyof Horaires): boolean {
    return jour === 'samedi' || jour === 'dimanche';
  }
}