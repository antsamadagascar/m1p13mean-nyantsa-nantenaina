import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface MouvementStock {
  _id: string;
  produit: { _id: string; nom: string; reference: string };
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

export interface ProduitSimple {
  _id: string;
  nom: string;
  reference: string;
  gestion_stock: string;
  variantes: { _id: string; nom: string; sku: string; attributs: { nom: string; valeur: string }[] }[];
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

  mouvements  = signal<MouvementStock[]>([]);
  produits:   ProduitSimple[] = [];
  loading     = false;
  total       = 0;
  stats: MouvementsResponse['stats'] | null = null;

  filtreType     = '';
  filtreProduit  = '';
  filtreVariante = '';

  currentPage = 1;
  totalPages  = 1;
  limite      = 15;

  private headers!: HttpHeaders;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    const token  = localStorage.getItem('token');
    this.headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.loadProduits();
    this.loadMouvements();
  }

  // ── Charger la liste des produits de la boutique ──
  loadProduits() {
    this.http.get<ProduitSimple[]>(`${environment.apiUrl}/api/produits/mes-produits`, { headers: this.headers })
      .subscribe({
        next: (data) => { this.produits = data; },
        error: (err)  => { console.error('Erreur chargement produits:', err); }
      });
  }

  // ── Variantes du produit sélectionné ──
  get variantesDisponibles() {
    if (!this.filtreProduit) return [];
    const p = this.produits.find(p => p._id === this.filtreProduit);
    return p?.variantes || [];
  }

  get produitSelectionne(): ProduitSimple | undefined {
    return this.produits.find(p => p._id === this.filtreProduit);
  }

  // ── Chargement mouvements ──
  loadMouvements() {
    this.loading = true;
    const params: any = { page: this.currentPage, limite: this.limite };
    if (this.filtreType)     params.type         = this.filtreType;
    if (this.filtreProduit)  params.produit_id   = this.filtreProduit;
    if (this.filtreVariante) params.variante_sku = this.filtreVariante;

    this.http.get<MouvementsResponse>(`${environment.apiUrl}/api/stock-movements`, { headers: this.headers, params })
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

  // ── Événements filtres ──
  setType(type: string) {
    this.filtreType  = type;
    this.currentPage = 1;
    this.loadMouvements();
  }

  onProduitChange() {
    this.filtreVariante = ''; // reset variante quand on change de produit
    this.currentPage    = 1;
    this.loadMouvements();
  }

  onVarianteChange() {
    this.currentPage = 1;
    this.loadMouvements();
  }

  clearProduit() {
    this.filtreProduit  = '';
    this.filtreVariante = '';
    this.currentPage    = 1;
    this.loadMouvements();
  }

  clearVariante() {
    this.filtreVariante = '';
    this.currentPage    = 1;
    this.loadMouvements();
  }

  resetFiltres() {
    this.filtreType     = '';
    this.filtreProduit  = '';
    this.filtreVariante = '';
    this.currentPage    = 1;
    this.loadMouvements();
  }

  // ── Helpers affichage ──
  formatAttributs(attributs: { nom: string; valeur: string }[]): string {
    return attributs.map(a => `${a.nom}: ${a.valeur}`).join(', ');
  }

  isNewDate(m: MouvementStock, index: number): boolean {
    if (index === 0) return true;
    const prev = this.mouvements()[index - 1];
    return new Date(m.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
  }

  labelDate(dateStr: string): string {
    const date  = new Date(dateStr);
    const today = new Date();
    const hier  = new Date(); hier.setDate(hier.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === hier.toDateString())  return 'Hier';
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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