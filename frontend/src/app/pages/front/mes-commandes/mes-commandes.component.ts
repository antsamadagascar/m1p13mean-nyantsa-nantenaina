import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mes-commandes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './mes-commandes.component.html',
  styleUrls: ['./mes-commandes.component.css']
})
export class MesCommandesComponent implements OnInit {
  commandes: any[] = [];
  commandesFiltrees: any[] = [];
  loading = true;
  error: string | null = null;
  annulationEnCours: Set<string> = new Set();
  commandeSelectionnee: any = null;
  filtreStatut: string = 'TOUS';
  filtreRecherche: string = '';

  get totalCommandes(): number { return this.commandes.length; }
  get totalDepense(): number {
    return this.commandes
      .filter(c => c.statut !== 'ANNULEE')
      .reduce((sum, c) => sum + c.total, 0);
  }
  get commandesEnCours(): number {
    return this.commandes.filter(c => ['EN_ATTENTE', 'PAYEE', 'EN_COURS'].includes(c.statut)).length;
  }

  readonly statuts = [
    { valeur: 'TOUS',       label: 'Toutes' },
    { valeur: 'EN_ATTENTE', label: 'En attente' },
    { valeur: 'PAYEE',      label: 'Payee' },
    { valeur: 'EN_COURS',   label: 'En cours' },
    { valeur: 'LIVREE',     label: 'Livree' },
    { valeur: 'ANNULEE',    label: 'Annulee' },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.chargerCommandes(); }

  chargerCommandes(): void {
    this.loading = true;
    this.error = null;
    this.http.get<any[]>(`${environment.apiUrl}/api/commandes`).subscribe({
      next: (commandes) => {
        this.commandes = commandes;
        this.appliquerFiltres();
        this.loading = false;
        if (commandes.length > 0) this.selectionnerCommande(commandes[0]);
      },
      error: (err) => {
        this.error = 'Impossible de charger vos commandes';
        this.loading = false;
      }
    });
  }

  appliquerFiltres(): void {
    let resultat = [...this.commandes];
    if (this.filtreStatut !== 'TOUS') {
      resultat = resultat.filter(c => c.statut === this.filtreStatut);
    }
    if (this.filtreRecherche.trim()) {
      const terme = this.filtreRecherche.toLowerCase().trim();
      resultat = resultat.filter(c =>
        c.reference.toLowerCase().includes(terme) ||
        c.articles.some((a: any) => a.nom_produit.toLowerCase().includes(terme))
      );
    }
    this.commandesFiltrees = resultat;
    if (this.commandeSelectionnee && !resultat.find(c => c._id === this.commandeSelectionnee._id)) {
      this.commandeSelectionnee = resultat.length > 0 ? resultat[0] : null;
    }
  }

  changerFiltre(statut: string): void {
    this.filtreStatut = statut;
    this.appliquerFiltres();
  }

  onRecherche(): void { this.appliquerFiltres(); }

  reinitialiserFiltres(): void {
    this.filtreStatut = 'TOUS';
    this.filtreRecherche = '';
    this.appliquerFiltres();
  }

  selectionnerCommande(commande: any): void {
    this.commandeSelectionnee = commande;
  }

  annulerCommande(commande: any): void {
    if (!confirm(`Annuler la commande ${commande.reference} ?`)) return;
    if (this.annulationEnCours.has(commande._id)) return;
    this.annulationEnCours.add(commande._id);
    this.http.patch(`${environment.apiUrl}/api/commandes/${commande._id}/annuler`, {}).subscribe({
      next: () => {
        this.annulationEnCours.delete(commande._id);
        const maj = (liste: any[]) => {
          const idx = liste.findIndex(c => c._id === commande._id);
          if (idx !== -1) liste[idx] = { ...liste[idx], statut: 'ANNULEE' };
        };
        maj(this.commandes);
        maj(this.commandesFiltrees);
        if (this.commandeSelectionnee?._id === commande._id) {
          this.commandeSelectionnee = { ...this.commandeSelectionnee, statut: 'ANNULEE' };
        }
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
      'EN_ATTENTE': 'statut-attente', 'PAYEE': 'statut-payee',
      'EN_COURS': 'statut-en-cours', 'LIVREE': 'statut-livree', 'ANNULEE': 'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'En attente', 'PAYEE': 'Payee',
      'EN_COURS': 'En cours', 'LIVREE': 'Livree', 'ANNULEE': 'Annulee'
    };
    return map[statut] || statut;
  }

  getPrixUnitaire(article: any): number { return article.prix_promo_unitaire || article.prix_unitaire; }
  getSousTotal(article: any): number { return this.getPrixUnitaire(article) * article.quantite; }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', minimumFractionDigits: 0 }).format(prix || 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateLong(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}