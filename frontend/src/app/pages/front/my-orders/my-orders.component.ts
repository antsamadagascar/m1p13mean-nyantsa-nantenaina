import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

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

  // Switch historique
  afficherHistorique = false;

  // Filtres historique
  filtreHistoriqueStatut: string = 'TOUS';
  filtreHistoriqueDateDebut: string = '';
  filtreHistoriqueDateFin: string = '';

  private refreshInterval: any;
  derniereMaj: Date = new Date();

  // ============================================================
  // SECTION 1 : Commandes en cours (temps réel)
  // EN_ATTENTE, EN_COURS, LIVREE+IMPAYE
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
      // Terminées : ANNULEE ou LIVREE+PAYE
      const estTerminee = c.statut === 'ANNULEE' ||
        (c.statut === 'LIVREE' && c.statut_paiement === 'PAYE');
      if (!estTerminee) return false;

      // Filtre statut
      if (this.filtreHistoriqueStatut !== 'TOUS' && c.statut !== this.filtreHistoriqueStatut) return false;

      // Filtre date début
      if (this.filtreHistoriqueDateDebut) {
        const debut = new Date(this.filtreHistoriqueDateDebut);
        debut.setHours(0, 0, 0, 0);
        if (new Date(c.date_creation) < debut) return false;
      }

      // Filtre date fin
      if (this.filtreHistoriqueDateFin) {
        const fin = new Date(this.filtreHistoriqueDateFin);
        fin.setHours(23, 59, 59, 999);
        if (new Date(c.date_creation) > fin) return false;
      }

      return true;
    });
  }

  get totalCommandes(): number { return this.commandes.length; }
  get totalDepense(): number {
    return this.commandes
      .filter(c => c.statut_paiement === 'PAYE')
      .reduce((sum, c) => sum + c.total, 0);
  }
  get commandesEnCours(): number { return this.commandesTempsReel.length; }

  readonly statutsHistorique = [
    { valeur: 'TOUS',     label: 'Toutes' },
    { valeur: 'LIVREE',   label: 'Livrée & Payée' },
    { valeur: 'ANNULEE',  label: 'Annulée' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerCommandes();
    this.refreshInterval = setInterval(() => this.chargerCommandes(true), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

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

  selectionnerCommande(commande: any): void { this.commandeSelectionnee = commande; }
  toggleHistorique(): void {
    this.afficherHistorique = !this.afficherHistorique;
    if (!this.afficherHistorique) this.commandeSelectionnee = null;
  }

  reinitialiserFiltresHistorique(): void {
    this.filtreHistoriqueStatut = 'TOUS';
    this.filtreHistoriqueDateDebut = '';
    this.filtreHistoriqueDateFin = '';
  }

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
      },
      error: (err) => {
        this.annulationEnCours.delete(commande._id);
        alert(err.error?.message || "Erreur lors de l'annulation");
      }
    });
  }

  peutAnnuler(commande: any): boolean { return commande?.statut === 'EN_ATTENTE'; }

  // Retourne les attributs de la variante — supporte les deux formats
  getVarianteLabel(article: any): string {
    const details = article.variante_details;
    if (!details) return '';

    // Format 1 : attributs = [{ nom, valeur }]
    const attrs = details.attributs || details.attributes || [];
    if (Array.isArray(attrs) && attrs.length > 0) {
      return attrs.map((a: any) => `${a.nom || a.key} : ${a.valeur || a.value}`).join(' — ');
    }

    // Format 2 : nom simple
    if (details.nom) return details.nom;

    return article.sku ? `Réf. ${article.sku}` : '';
  }

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

  getStatutPaiementClass(p: string): string { return p === 'PAYE' ? 'paiement-paid' : 'paiement-unpaid'; }
  getStatutPaiementLabel(p: string): string { return p === 'PAYE' ? 'Payée' : 'Impayée'; }
  getPrixUnitaire(a: any): number { return a.prix_promo_unitaire || a.prix_unitaire; }
  getSousTotal(a: any): number { return this.getPrixUnitaire(a) * a.quantite; }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(prix || 0);
  }
  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  formatDateLong(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  formatHeure(date: Date): string {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}