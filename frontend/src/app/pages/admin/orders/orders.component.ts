import { Component, OnInit } from '@angular/core';
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
export class OrdersComponent implements OnInit {
  commandes: any[] = [];
  commandesFiltrees: any[] = [];
  commandeSelectionnee: any = null;
  loading = true;
  error: string | null = null;
  majEnCours: Set<string> = new Set();
  filtreStatut = 'TOUS';
  filtreRecherche = '';

  // Transitions possibles selon statut actuel
  readonly transitions: { [k: string]: { label: string; valeur: string; classe: string }[] } = {
    'EN_ATTENTE': [
      { label: 'Marquer comme payée',   valeur: 'PAYEE',    classe: 'btn-payee'    },
      { label: 'Annuler la commande',   valeur: 'ANNULEE',  classe: 'btn-annuler'  }
    ],
    'PAYEE': [
      { label: 'Mettre en livraison',   valeur: 'EN_COURS', classe: 'btn-en-cours' }
    ],
    'EN_COURS': [
      { label: 'Confirmer la livraison', valeur: 'LIVREE',  classe: 'btn-livree'  }
    ],
    'LIVREE':  [],
    'ANNULEE': []
  };

  readonly statuts = [
    { valeur: 'TOUS',       label: 'Toutes',      count: 0 },
    { valeur: 'EN_ATTENTE', label: 'En attente',  count: 0 },
    { valeur: 'PAYEE',      label: 'Payées',       count: 0 },
    { valeur: 'EN_COURS',   label: 'En livraison', count: 0 },
    { valeur: 'LIVREE',     label: 'Livrées',      count: 0 },
    { valeur: 'ANNULEE',    label: 'Annulées',     count: 0 }
  ];

  get totalCommandes(): number { return this.commandes.length; }
  get enAttente(): number { return this.commandes.filter(c => c.statut === 'EN_ATTENTE').length; }
  get payees(): number { return this.commandes.filter(c => c.statut === 'PAYEE').length; }
  get enCours(): number { return this.commandes.filter(c => c.statut === 'EN_COURS').length; }
  get chiffreAffaires(): number {
    return this.commandes
      .filter(c => c.statut === 'LIVREE')
      .reduce((sum, c) => sum + c.total, 0);
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.chargerCommandes(); }

  chargerCommandes(): void {
    this.loading = true;
    this.error = null;
    this.http.get<any[]>(`${environment.apiUrl}/api/commandes/boutique`).subscribe({
      next: (commandes) => {
        this.commandes = commandes;
        this.mettreAJourCompteurs();
        this.appliquerFiltres();
        this.loading = false;
        if (commandes.length > 0) this.commandeSelectionnee = commandes[0];
      },
      error: () => { this.error = 'Impossible de charger les commandes'; this.loading = false; }
    });
  }

  mettreAJourCompteurs(): void {
    this.statuts.forEach(s => {
      if (s.valeur === 'TOUS') s.count = this.commandes.length;
      else s.count = this.commandes.filter(c => c.statut === s.valeur).length;
    });
  }

  appliquerFiltres(): void {
    let res = [...this.commandes];
    if (this.filtreStatut !== 'TOUS') res = res.filter(c => c.statut === this.filtreStatut);
    if (this.filtreRecherche.trim()) {
      const t = this.filtreRecherche.toLowerCase();
      res = res.filter(c =>
        c.reference.toLowerCase().includes(t) ||
        c.articles.some((a: any) => a.nom_produit.toLowerCase().includes(t)) ||
        c.utilisateur?.nom?.toLowerCase().includes(t) ||
        c.utilisateur?.email?.toLowerCase().includes(t)
      );
    }
    this.commandesFiltrees = res;
    if (this.commandeSelectionnee && !res.find(c => c._id === this.commandeSelectionnee._id)) {
      this.commandeSelectionnee = res.length > 0 ? res[0] : null;
    }
  }

  changerFiltre(statut: string): void { this.filtreStatut = statut; this.appliquerFiltres(); }
  onRecherche(): void { this.appliquerFiltres(); }
  reinitialiserFiltres(): void { this.filtreStatut = 'TOUS'; this.filtreRecherche = ''; this.appliquerFiltres(); }
  selectionner(commande: any): void { this.commandeSelectionnee = commande; }

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
        maj(this.commandesFiltrees);
        if (this.commandeSelectionnee?._id === commande._id) {
          this.commandeSelectionnee = { ...this.commandeSelectionnee, ...updated };
        }
        this.mettreAJourCompteurs();
      },
      error: (err) => {
        this.majEnCours.delete(commande._id);
        alert(err.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  getTransitions(commande: any): any[] { return this.transitions[commande?.statut] || []; }

  getStatutClass(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'statut-attente', 'PAYEE': 'statut-payee',
      'EN_COURS': 'statut-en-cours', 'LIVREE': 'statut-livree', 'ANNULEE': 'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'En attente', 'PAYEE': 'Payée',
      'EN_COURS': 'En livraison', 'LIVREE': 'Livrée', 'ANNULEE': 'Annulée'
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
}