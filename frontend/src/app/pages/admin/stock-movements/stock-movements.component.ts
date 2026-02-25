import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface MouvementStock {
  _id: string;
  produit: { _id: string; nom: string; reference: string; images?: any[] };
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  quantite: number;
  motif: string;
  quantite_avant: number | null;
  quantite_apres: number | null;
  variante_sku: string | null;
  variante_nom: string | null;
  variante_attributs: { nom: string; valeur: string }[];
  cree_par: { nom: string; prenom: string } | null;
  createdAt: string;
}

export interface MouvementsResponse {
  mouvements: MouvementStock[];
  total: number;
  page: number;
  pages: number;
  stats: {
    ENTREE: { count: number; quantite: number };
    SORTIE: { count: number; quantite: number };
  };
}

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock-movements.component.html',
  styleUrls: ['./stock-movements.component.css']
})
export class StockMovementsComponent implements OnInit {

  mouvements = signal<MouvementStock[]>([]);
  loading    = false;
  total      = 0;
  stats: MouvementsResponse['stats'] | null = null;

  filtreType  = '';
  recherche   = '';
  currentPage = 1;
  totalPages  = 1;
  limite      = 15;

  private searchTimeout: any;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() { this.loadMouvements(); }

  loadMouvements() {
    this.loading = true;
    const token   = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const params: any = { page: this.currentPage, limite: this.limite };
    if (this.filtreType) params.type      = this.filtreType;
    if (this.recherche)  params.recherche = this.recherche;

    this.http.get<MouvementsResponse>(`${environment.apiUrl}/api/stock-movements`, { headers, params })
      .subscribe({
        next: (data) => {
          this.mouvements.set(data.mouvements);
          this.total      = data.total;
          this.totalPages = data.pages;
          this.stats      = data.stats;
          this.loading    = false;
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
        }
      });
  }

  // Retourne true si ce mouvement est le premier de sa journée
  isNewDate(m: MouvementStock, index: number): boolean {
    if (index === 0) return true;
    const prev = this.mouvements()[index - 1];
    const d1 = new Date(m.createdAt).toDateString();
    const d2 = new Date(prev.createdAt).toDateString();
    return d1 !== d2;
  }

  // Libellé date humain
  labelDate(dateStr: string): string {
    const date  = new Date(dateStr);
    const today = new Date();
    const hier  = new Date(); hier.setDate(hier.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === hier.toDateString())  return 'Hier';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  setType(type: string) {
    this.filtreType  = type;
    this.currentPage = 1;
    this.loadMouvements();
  }

  onRecherche() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadMouvements();
    }, 350);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.loadMouvements();
  }

  get pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end   = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  trackById(_: number, m: MouvementStock): string { return m._id; }
}