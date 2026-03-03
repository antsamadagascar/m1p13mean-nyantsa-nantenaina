import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-commande-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-orders-confirmation.component.html',
  styleUrls: ['./customer-orders-confirmation.component.css']
})
export class CommandeConfirmationComponent implements OnInit {
  commande: any = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get(`${environment.apiUrl}/api/commandes/${id}`).subscribe({
        next: (commande) => { this.commande = commande; this.loading = false; },
        error: () => { this.loading = false; }
      });
    }
  }

  getStatutClass(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'statut-attente',
      'EN_COURS':   'statut-en-cours',
      'LIVREE':     'statut-livree',
      'ANNULEE':    'statut-annulee'
    };
    return map[statut] || '';
  }

  getStatutLabel(statut: string): string {
    const map: { [k: string]: string } = {
      'EN_ATTENTE': 'En attente de traitement',
      'EN_COURS':   'En cours de livraison',
      'LIVREE':     'Livrée',
      'ANNULEE':    'Annulée'
    };
    return map[statut] || statut;
  }

  getPrixUnitaire(article: any): number {
    return article.prix_promo_unitaire || article.prix_unitaire;
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix || 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}