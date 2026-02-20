import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {
  commandes: any[] = [];
  commandesFiltrees: any[] = [];
  commandeSelectionnee: any = null;
  loading = true;
  error: string | null = null;
  majEnCours: Set<string> = new Set();

  // Mode : 'temps-reel' ou 'historique'
  mode: 'temps-reel' | 'historique' = 'temps-reel';

  // Filtres historique
  dateDebut: string = '';
  dateFin: string = '';
  filtreStatutHistorique: string = 'TOUS';

  // Auto-refresh (temps réel)
  private refreshInterval: any;
  readonly REFRESH_DELAY = 30000; // 30 secondes
  derniereMaj: Date = new Date();

  // Flux simplifié : EN_ATTENTE → EN_COURS → LIVREE (= livré + payé)
  readonly transitions: { [k: string]: { label: string; valeur: string; classe: string }[] } = {
    'EN_ATTENTE': [
      { label: 'Prendre en charge',     valeur: 'EN_COURS', classe: 'btn-en-cours' },
      { label: 'Annuler la commande',   valeur: 'ANNULEE',  classe: 'btn-annuler'  }
    ],
    'EN_COURS': [
      { label: 'Confirmer livraison + paiement', valeur: 'LIVREE', classe: 'btn-livree' }
    ],
    'LIVREE':  [],
    'ANNULEE': []
  };

  readonly statuts = [
    { valeur: 'TOUS',       label: 'Toutes',    count: 0 },
    { valeur: 'EN_ATTENTE', label: 'En attente', count: 0 },
    { valeur: 'EN_COURS',   label: 'En cours',   count: 0 },
    { valeur: 'LIVREE',     label: 'Livrées',    count: 0 },
    { valeur: 'ANNULEE',    label: 'Annulées',   count: 0 }
  ];

  // Commandes temps réel = EN_ATTENTE et EN_COURS uniquement
  get commandesTempsReel(): any[] {
    return this.commandes.filter(c => ['EN_ATTENTE', 'EN_COURS'].includes(c.statut));
  }

  get totalCommandes(): number { return this.commandes.length; }
  get enAttente(): number { return this.commandes.filter(c => c.statut === 'EN_ATTENTE').length; }
  get enCours(): number { return this.commandes.filter(c => c.statut === 'EN_COURS').length; }
  get chiffreAffaires(): number {
    return this.commandes
      .filter(c => c.statut === 'LIVREE')
      .reduce((sum, c) => sum + c.total, 0);
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerCommandes();
    // Auto-refresh toutes les 30 secondes en mode temps réel
    this.refreshInterval = setInterval(() => {
      if (this.mode === 'temps-reel') {
        this.chargerCommandes(true);
      }
    }, this.REFRESH_DELAY);
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

    this.http.get<any[]>(`${environment.apiUrl}/api/commandes/boutique`).subscribe({
      next: (commandes) => {
        this.commandes = commandes;
        this.derniereMaj = new Date();
        this.mettreAJourCompteurs();
        this.appliquerFiltres();
        this.loading = false;

        // Sélectionner la première EN_ATTENTE si aucune sélection
        if (!this.commandeSelectionnee && this.commandesTempsReel.length > 0) {
          this.commandeSelectionnee = this.commandesTempsReel[0];
        }
      },
      error: () => {
        if (!silencieux) this.error = 'Impossible de charger les commandes';
        this.loading = false;
      }
    });
  }

  // ============================================
  // MODE
  // ============================================

  basculerMode(mode: 'temps-reel' | 'historique'): void {
    this.mode = mode;
    this.commandeSelectionnee = null;
    this.appliquerFiltres();
    if (mode === 'temps-reel' && this.commandesFiltrees.length > 0) {
      this.commandeSelectionnee = this.commandesFiltrees[0];
    }
  }

  // ============================================
  // FILTRES
  // ============================================

  appliquerFiltres(): void {
    let res = [...this.commandes];

    if (this.mode === 'temps-reel') {
      // Temps réel : uniquement EN_ATTENTE et EN_COURS
      res = res.filter(c => ['EN_ATTENTE', 'EN_COURS'].includes(c.statut));
    } else {
      // Historique : LIVREE et ANNULEE + filtres date/statut
      res = res.filter(c => ['LIVREE', 'ANNULEE'].includes(c.statut));

      if (this.filtreStatutHistorique !== 'TOUS') {
        res = res.filter(c => c.statut === this.filtreStatutHistorique);
      }

      if (this.dateDebut) {
        const debut = new Date(this.dateDebut);
        res = res.filter(c => new Date(c.date_creation) >= debut);
      }

      if (this.dateFin) {
        const fin = new Date(this.dateFin);
        fin.setHours(23, 59, 59);
        res = res.filter(c => new Date(c.date_creation) <= fin);
      }
    }

    this.commandesFiltrees = res;

    if (this.commandeSelectionnee && !res.find(c => c._id === this.commandeSelectionnee._id)) {
      this.commandeSelectionnee = res.length > 0 ? res[0] : null;
    }
  }

  reinitialiserFiltresHistorique(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.filtreStatutHistorique = 'TOUS';
    this.appliquerFiltres();
  }

  mettreAJourCompteurs(): void {
    this.statuts.forEach(s => {
      if (s.valeur === 'TOUS') s.count = this.commandes.length;
      else s.count = this.commandes.filter(c => c.statut === s.valeur).length;
    });
  }

  selectionner(commande: any): void { this.commandeSelectionnee = commande; }

  // ============================================
  // CHANGEMENT STATUT
  // ============================================

  changerStatut(commande: any, nouveauStatut: string): void {
    const transition = this.transitions[commande.statut]?.find(t => t.valeur === nouveauStatut);
    if (!confirm(`Confirmer : "${transition?.label}" pour ${commande.reference} ?`)) return;
    if (this.majEnCours.has(commande._id)) return;

    this.majEnCours.add(commande._id);
    this.http.patch(`${environment.apiUrl}/api/commandes/${commande._id}/statut`, { statut: nouveauStatut }).subscribe({
      next: (updated: any) => {
        this.majEnCours.delete(commande._id);
        const maj = (liste: any[]) => {
          const idx = liste.findIndex(c => c._id === commande._id);
          if (idx !== -1) liste[idx] = { ...liste[idx], ...updated };
        };
        maj(this.commandes);
        this.mettreAJourCompteurs();
        this.appliquerFiltres();
        // Si LIVREE ou ANNULEE → désélectionner en mode temps réel
        if (this.mode === 'temps-reel' && ['LIVREE', 'ANNULEE'].includes(nouveauStatut)) {
          this.commandeSelectionnee = this.commandesFiltrees.length > 0 ? this.commandesFiltrees[0] : null;
        } else {
          if (this.commandeSelectionnee?._id === commande._id) {
            this.commandeSelectionnee = { ...this.commandeSelectionnee, ...updated };
          }
        }
      },
      error: (err) => {
        this.majEnCours.delete(commande._id);
        alert(err.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  getTransitions(commande: any): any[] { return this.transitions[commande?.statut] || []; }

  getStatutClass(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'statut-attente', 'EN_COURS': 'statut-en-cours',
      'LIVREE': 'statut-livree', 'ANNULEE': 'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'En attente', 'EN_COURS': 'En cours',
      'LIVREE': 'Livrée', 'ANNULEE': 'Annulée'
    };
    return map[statut] || statut;
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(prix || 0);
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateLong(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatHeure(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}