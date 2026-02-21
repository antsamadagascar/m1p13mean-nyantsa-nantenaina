import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-stores.component.html',
  styleUrls: ['./orders-stores.component.css']
})
export class OrdersComponent implements OnInit, OnDestroy {

  commandes: any[] = [];
  commandesFiltrees: any[] = [];
  commandeSelectionnee: any = null;
  loading = true;
  error: string | null = null;
  majEnCours: Set<string> = new Set();

  mode: 'temps-reel' | 'historique' = 'temps-reel';
  dateDebut = '';
  dateFin = '';
  filtreStatutHistorique = 'TOUS';

  //  Stats calculées par le backend
  stats = {
    total: 0,
    enAttente: 0,
    enCours: 0,
    livreesImpayees: 0,
    chiffreAffaires: 0
  };

  private refreshInterval: any;
  derniereMaj: Date = new Date();

  readonly transitions: { [k: string]: { label: string; valeur: string; classe: string }[] } = {
    'EN_ATTENTE': [
      { label: 'Prendre en charge',   valeur: 'EN_COURS', classe: 'btn-en-cours' },
      { label: 'Annuler la commande', valeur: 'ANNULEE',  classe: 'btn-annuler'  }
    ],
    'EN_COURS': [
      { label: 'Marquer comme livrée',  valeur: 'LIVREE',  classe: 'btn-livree'  },
      { label: 'Annuler la commande',   valeur: 'ANNULEE', classe: 'btn-annuler' }
    ],
    'LIVREE': [
      { label: 'Annuler — refus client', valeur: 'ANNULEE', classe: 'btn-annuler' }
    ],
    'ANNULEE': []
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerCommandes();
    this.refreshInterval = setInterval(() => {
      if (this.mode === 'temps-reel') this.chargerCommandes(true);
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ============================================
  // CHARGEMENT COMMANDES
  // ============================================
  chargerCommandes(silencieux = false): void {
    if (!silencieux) this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/commandes/boutique`).subscribe({
      next: (commandes) => {
        this.commandes = commandes;
        this.derniereMaj = new Date();
        this.appliquerFiltres();
        this.chargerStats(); 
        this.loading = false;
        if (!this.commandeSelectionnee && this.commandesFiltrees.length > 0) {
          this.commandeSelectionnee = this.commandesFiltrees[0];
        }
      },
      error: () => {
        if (!silencieux) this.error = 'Impossible de charger les commandes';
        this.loading = false;
      }
    });
  }

  // ============================================
  // STATS — calculées par le backend
  // ============================================
  chargerStats(): void {
    const params: any = { mode: this.mode };

    if (this.mode === 'historique') {
      if (this.dateDebut)              params.dateDebut        = this.dateDebut;
      if (this.dateFin)                params.dateFin          = this.dateFin;
      if (this.filtreStatutHistorique) params.statutHistorique = this.filtreStatutHistorique;
    }

    this.http.get<any>(`${environment.apiUrl}/api/commandes/boutique/stats`, { params })
      .subscribe({
        next: (stats) => this.stats = stats,
        error: () => {} // non bloquant
      });
  }

  // ============================================
  // MODE & FILTRES
  // ============================================
  basculerMode(mode: 'temps-reel' | 'historique'): void {
    this.mode = mode;
    this.commandeSelectionnee = null;
    this.appliquerFiltres();
    this.chargerStats();
    if (this.commandesFiltrees.length > 0) this.commandeSelectionnee = this.commandesFiltrees[0];
  }

  appliquerFiltres(): void {
    let res = [...this.commandes];

    if (this.mode === 'temps-reel') {
      res = res.filter(c =>
        !(c.statut === 'ANNULEE') &&
        !(c.statut === 'LIVREE' && c.statut_paiement === 'PAYE')
      );
    } else {
      res = res.filter(c =>
        c.statut === 'ANNULEE' ||
        (c.statut === 'LIVREE' && c.statut_paiement === 'PAYE')
      );
      if (this.filtreStatutHistorique === 'LIVREE')  res = res.filter(c => c.statut === 'LIVREE');
      if (this.filtreStatutHistorique === 'ANNULEE') res = res.filter(c => c.statut === 'ANNULEE');
      if (this.dateDebut) res = res.filter(c => new Date(c.date_creation) >= new Date(this.dateDebut));
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
    this.chargerStats();
  }

  selectionner(commande: any): void {
    this.commandeSelectionnee = commande;
  }

  // ============================================
  // ACTIONS
  // ============================================
  changerStatut(commande: any, nouveauStatut: string): void {
    const transition = this.transitions[commande.statut]?.find(t => t.valeur === nouveauStatut);
    if (!confirm(`Confirmer : "${transition?.label}" ?`)) return;
    if (this.majEnCours.has(commande._id)) return;

    this.majEnCours.add(commande._id);
    this.http.patch(`${environment.apiUrl}/api/commandes/${commande._id}/statut`, { statut: nouveauStatut }).subscribe({
      next: (updated: any) => {
        this.majEnCours.delete(commande._id);
        this.mettreAJourCommande(commande._id, updated);
        this.chargerStats(); 
      },
      error: (err) => {
        this.majEnCours.delete(commande._id);
        alert(err.error?.message || 'Erreur');
      }
    });
  }

  confirmerPaiement(commande: any): void {
    if (!confirm(`Confirmer la réception du paiement de ${this.formatPrix(commande.total)} pour ${commande.reference} ?`)) return;
    if (this.majEnCours.has(commande._id)) return;

    this.majEnCours.add(commande._id);
    this.http.patch(`${environment.apiUrl}/api/commandes/${commande._id}/confirmer-paiement`, {}).subscribe({
      next: (updated: any) => {
        this.majEnCours.delete(commande._id);
        this.mettreAJourCommande(commande._id, updated);
        this.chargerStats();
        if (this.mode === 'temps-reel') {
          this.appliquerFiltres();
          this.commandeSelectionnee = this.commandesFiltrees.length > 0 ? this.commandesFiltrees[0] : null;
        }
      },
      error: (err) => {
        this.majEnCours.delete(commande._id);
        alert(err.error?.message || 'Erreur');
      }
    });
  }

  mettreAJourCommande(id: string, updated: any): void {
    const idx = this.commandes.findIndex(c => c._id === id);
    if (idx !== -1) this.commandes[idx] = { ...this.commandes[idx], ...updated };
    this.appliquerFiltres();
    if (this.commandeSelectionnee?._id === id) {
      this.commandeSelectionnee = { ...this.commandeSelectionnee, ...updated };
    }
  }

  // ============================================
  // TRANSITIONS — affichage uniquement
  // La validation réelle est côté backend
  // ============================================
  getTransitions(commande: any): any[] {
    if (!commande) return [];
    const transitions = this.transitions[commande.statut] || [];

    if (commande.statut_paiement === 'PAYE') {
      return transitions.filter(t => t.valeur !== 'ANNULEE');
    }

    return transitions;
  }

  // ============================================
  // HELPERS AFFICHAGE
  // ============================================
  getStatutLivraisonClass(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'statut-attente',
      'EN_COURS':   'statut-en-cours',
      'LIVREE':     'statut-livree',
      'ANNULEE':    'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLivraisonLabel(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS':   'En cours',
      'LIVREE':     'Livrée',
      'ANNULEE':    'Annulée'
    };
    return map[statut] || statut;
  }

  getStatutPaiementClass(statut_paiement: string): string {
    return statut_paiement === 'PAYE' ? 'paiement-paid' : 'paiement-unpaid';
  }

  getStatutPaiementLabel(statut_paiement: string): string {
    return statut_paiement === 'PAYE' ? 'Payée' : 'Impayée';
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix || 0);
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatDateLong(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  onFiltreHistoriqueChange(): void {
    this.appliquerFiltres();
    this.chargerStats();
  }
  formatHeure(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}