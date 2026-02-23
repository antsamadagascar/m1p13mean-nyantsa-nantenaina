import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { formatPrix, formatDate, formatDateLong, formatHeure } from '../../../utils/formatters';

@Component({
  selector: 'app-mes-commandes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MesCommandesComponent implements OnInit, OnDestroy {

  commandes: any[] = [];
  loading = true;
  error: string | null = null;
  annulationEnCours: Set<string> = new Set();
  commandeSelectionnee: any = null;

  //utils formatage
  formatHeureFn = formatHeure;
  formatDateFn = formatDate;
  formatDateLongFn = formatDateLong;
  formatPrixFn = formatPrix;


  // Switch historique
  afficherHistorique = false;

  // Filtres historique
  filtreHistoriqueStatut: string = 'TOUS';
  filtreHistoriqueDateDebut: string = '';
  filtreHistoriqueDateFin: string = '';

  //  Stats calculées par le backend
  statsTempsReel = { total: 0, enCours: 0, totalDepense: 0 };
  statsHistorique = { total: 0, enCours: 0, totalDepense: 0 };

  private refreshInterval: any;
  derniereMaj: Date = new Date();

  // ============================================================
  // SECTION 1 : Commandes en cours (temps réel)
  // ============================================================
  get commandesTempsReel(): any[] {
    return this.commandes.filter(c =>
      c.statut === 'EN_ATTENTE' ||
      c.statut === 'EN_COURS' ||
      (c.statut === 'LIVREE' && c.statut_paiement === 'IMPAYE')
    );
  }

  // ============================================================
  // SECTION 2 : Historique — avec filtres
  // ============================================================
  get commandesHistorique(): any[] {
    return this.commandes.filter(c => {
      const estTerminee = c.statut === 'ANNULEE' ||
        (c.statut === 'LIVREE' && c.statut_paiement === 'PAYE');
      if (!estTerminee) return false;

      if (this.filtreHistoriqueStatut !== 'TOUS' && c.statut !== this.filtreHistoriqueStatut) return false;

      if (this.filtreHistoriqueDateDebut) {
        const debut = new Date(this.filtreHistoriqueDateDebut);
        debut.setHours(0, 0, 0, 0);
        if (new Date(c.date_creation) < debut) return false;
      }

      if (this.filtreHistoriqueDateFin) {
        const fin = new Date(this.filtreHistoriqueDateFin);
        fin.setHours(23, 59, 59, 999);
        if (new Date(c.date_creation) > fin) return false;
      }

      return true;
    });
  }

  readonly statutsHistorique = [
    { valeur: 'TOUS',    label: 'Toutes'        },
    { valeur: 'LIVREE',  label: 'Livrée & Payée' },
    { valeur: 'ANNULEE', label: 'Annulée'        },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerCommandes();
    this.chargerStatsTempsReel();
    this.refreshInterval = setInterval(() => {
      this.chargerCommandes(true);
      this.chargerStatsTempsReel();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ============================================
  // CHARGEMENT
  // ============================================
  chargerCommandes(silencieux = false): void {
    if (!silencieux) this.loading = true;
    this.error = null;
    this.http.get<any[]>(`${environment.apiUrl}/api/commandes`).subscribe({
      next: (commandes) => {
        this.commandes = commandes;
        this.derniereMaj = new Date();
        this.loading = false;
        if (this.commandeSelectionnee) {
          const maj = commandes.find(c => c._id === this.commandeSelectionnee._id);
          if (maj) this.commandeSelectionnee = maj;
        } else if (this.commandesTempsReel.length > 0) {
          this.selectionnerCommande(this.commandesTempsReel[0]);
        }
      },
      error: () => {
        if (!silencieux) this.error = 'Impossible de charger vos commandes';
        this.loading = false;
      }
    });
  }

  // ============================================
  // STATS — backend
  // ============================================
  chargerStatsTempsReel(): void {
    this.http.get<any>(`${environment.apiUrl}/api/commandes/stats`, {
      params: { mode: 'temps-reel' }
    }).subscribe({ next: (s) => this.statsTempsReel = s });
  }

  chargerStatsHistorique(): void {
    const params: any = { mode: 'historique' };
    if (this.filtreHistoriqueStatut !== 'TOUS') params.statut   = this.filtreHistoriqueStatut;
    if (this.filtreHistoriqueDateDebut)          params.dateDebut = this.filtreHistoriqueDateDebut;
    if (this.filtreHistoriqueDateFin)            params.dateFin   = this.filtreHistoriqueDateFin;

    this.http.get<any>(`${environment.apiUrl}/api/commandes/stats`, { params })
      .subscribe({ next: (s) => this.statsHistorique = s });
  }

  // ============================================
  // TOGGLE & FILTRES
  // ============================================
  selectionnerCommande(commande: any): void { this.commandeSelectionnee = commande; }

  toggleHistorique(): void {
    this.afficherHistorique = !this.afficherHistorique;
    if (this.afficherHistorique) {
      this.chargerStatsHistorique(); 
    } else {
      this.commandeSelectionnee = null;
    }
  }

  onFiltreHistoriqueChange(): void {
    this.chargerStatsHistorique(); 
  }

  reinitialiserFiltresHistorique(): void {
    this.filtreHistoriqueStatut  = 'TOUS';
    this.filtreHistoriqueDateDebut = '';
    this.filtreHistoriqueDateFin   = '';
    this.chargerStatsHistorique();
  }

  // ============================================
  // ANNULATION
  // ============================================
  annulerCommande(commande: any): void {
    if (!confirm(`Annuler la commande ${commande.reference} ?`)) return;
    if (this.annulationEnCours.has(commande._id)) return;
    this.annulationEnCours.add(commande._id);
    this.http.patch(`${environment.apiUrl}/api/commandes/${commande._id}/annuler`, {}).subscribe({
      next: (updated: any) => {
        this.annulationEnCours.delete(commande._id);
        const idx = this.commandes.findIndex(c => c._id === commande._id);
        if (idx !== -1) this.commandes[idx] = { ...this.commandes[idx], ...updated };
        if (this.commandeSelectionnee?._id === commande._id) {
          this.commandeSelectionnee = { ...this.commandeSelectionnee, ...updated };
        }
        this.chargerStatsTempsReel(); 
      },
      error: (err) => {
        this.annulationEnCours.delete(commande._id);
        alert(err.error?.message || "Erreur lors de l'annulation");
      }
    });
  }

  peutAnnuler(commande: any): boolean { return commande?.statut === 'EN_ATTENTE'; }


  getStatutClass(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'statut-attente', 'EN_COURS': 'statut-en-cours',
      'LIVREE': 'statut-livree',      'ANNULEE': 'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'En attente', 'EN_COURS': 'En cours',
      'LIVREE': 'Livrée',         'ANNULEE': 'Annulée'
    };
    return map[statut] || statut;
  }

  getStatutPaiementClass(p: string): string { return p === 'PAYE' ? 'paiement-paid' : 'paiement-unpaid'; }
  getStatutPaiementLabel(p: string): string { return p === 'PAYE' ? 'Payée' : 'Impayée'; }

}