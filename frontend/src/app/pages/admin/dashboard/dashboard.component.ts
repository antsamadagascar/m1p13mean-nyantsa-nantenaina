import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BoutiqueStatsService,
  StatsCA,
  StatsEvolution,
  StatsOptions,
  Periode
} from '../../../services/boutique-stats.service';
import { BoutiqueService } from '../../../services/boutique.service';
import { Boutique } from '../../../models/boutique.model';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  stats: StatsCA | null = null;
  loading  = false;
  erreur   = '';
  vueActive: 'reel' | 'previsionnel' = 'reel';

  periodeActive:      Periode = 'annee';
  dateDebut           = '';
  dateFin             = '';
  anneeSelectionnee   = '';
  boutiqueId          = '';
  anneesDispo:        number[] = [];

  tooltip: { visible: boolean; x: number; y: number; label: string; ca: string; commandes: number } =
    { visible: false, x: 0, y: 0, label: '', ca: '', commandes: 0 };

  private chartPoints: { x: number; y: number; data: StatsEvolution }[] = [];

  readonly MOIS_COURTS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  readonly MOIS_LONGS  = ['Janvier','Février','Mars','Avril','Mai','Juin',
                           'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  periodes: { label: string; value: Periode }[] = [
    { label: "Aujourd'hui", value: 'jour'    },
    { label: '7 jours',     value: 'semaine' },
    { label: 'Ce mois',     value: 'mois'    },
    { label: 'Cette année', value: 'annee'   }
  ];

  isAdmin = false;
  boutiqueIdFiltreAdmin = ''; // 👈 ajout (filtre admin uniquement)
  boutiquesDispos: { _id: string; nom: string }[] = []; // 👈 liste des boutiques

  constructor(private statsService: BoutiqueStatsService,private boutiqueService: BoutiqueService) {}

  // ngOnInit() {
  //   try {
  //     const user = JSON.parse(localStorage.getItem('user') || '{}');
  //     this.boutiqueId = user.boutiqueId || user.boutique_id || user.boutique || '';
  //   } catch {}
  //   this.chargerStats();
  // }
  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.isAdmin = user.role === 'ADMIN';

    if (!this.isAdmin) {
      this.boutiqueId = user.boutiqueId || '';
    } else {
      this.boutiqueService.getBoutiques().subscribe(res => {
        console.log('boutiques res:', res); // 👈 regarde la structure dans la console
        this.boutiquesDispos = Array.isArray(res) ? res : (res as any).data || [];
      });
    }

    this.chargerStats();
  }


  ngAfterViewInit() {}

  // Données actives selon l'onglet
  get evolutionActive(): StatsEvolution[] {
    return this.vueActive === 'reel'
      ? (this.stats?.reel.evolution ?? [])
      : (this.stats?.previsionnel.evolution ?? []);
  }

  get totauxActifs() {
    const vide = { total_ca: 0, total_commandes: 0, total_articles: 0 };
    return this.vueActive === 'reel'
      ? (this.stats?.reel.totaux ?? vide)
      : (this.stats?.previsionnel.totaux ?? vide);
  }

  changerPeriode(p: Periode) {
    this.periodeActive     = p;
    this.dateDebut         = '';
    this.dateFin           = '';
    this.anneeSelectionnee = '';
    this.chargerStats();
  }

  filtrerParAnnee() {
    this.dateDebut = '';
    this.dateFin   = '';
    this.chargerStats();
  }

  reinitialiserFiltres() {
    this.dateDebut         = '';
    this.dateFin           = '';
    this.anneeSelectionnee = '';
    this.periodeActive     = 'annee';
    this.boutiqueIdFiltreAdmin  = '';
    this.chargerStats();
  }

  // chargerStats() {
  //   if (!this.boutiqueId) { this.erreur = 'ID boutique introuvable.'; return; }
  //   this.loading = true;
  //   this.erreur  = '';

  //   const options: StatsOptions = { periode: this.periodeActive };
  //   if (this.anneeSelectionnee)             options.annee = this.anneeSelectionnee;
  //   else if (this.dateDebut)                options.debut = this.dateDebut;
  //   if (this.dateFin && !this.anneeSelectionnee) options.fin = this.dateFin;

  //   this.statsService.getChiffreAffaires(this.boutiqueId, options).subscribe({
  //     next: (res) => {
  //       this.stats       = res;
  //       this.anneesDispo = res.annees_dispos ?? [];
  //       this.loading     = false;
  //       this.tooltip.visible = false;
  //       setTimeout(() => this.dessinerCourbe(), 100);
  //     },
  //     error: () => { this.erreur = 'Impossible de charger les statistiques.'; this.loading = false; }
  //   });
  // }
  chargerStats() {
    this.loading = true;
    this.erreur  = '';

    const options: StatsOptions = { periode: this.periodeActive };
    if (this.anneeSelectionnee) {
      options.annee = this.anneeSelectionnee;
    } else {
      if (this.dateDebut) options.debut = this.dateDebut;
      if (this.dateFin)   options.fin   = this.dateFin;
    }

    // 👇 Filtre boutique admin
    if (this.isAdmin && this.boutiqueIdFiltreAdmin) {
      options.boutique_id = this.boutiqueIdFiltreAdmin;
    }

    const request$ = this.isAdmin
      ? this.statsService.getChiffreAffairesAdmin(options)
      : this.statsService.getChiffreAffaires(this.boutiqueId, options);

    request$.subscribe({
      next: (res) => {
        this.stats = res;
        this.anneesDispo = res.annees_dispos ?? [];
        this.loading = false;
        setTimeout(() => this.dessinerCourbe(), 100);
      },
      error: () => {
        this.erreur = 'Impossible de charger les statistiques.';
        this.loading = false;
      }
    });
  }


  // Redessine la courbe quand on change d'onglet
  changerVue(vue: 'reel' | 'previsionnel') {
    this.vueActive = vue;
    this.tooltip.visible = false;
    setTimeout(() => this.dessinerCourbe(), 50);
  }

  // ============================================
  // COURBE CANVAS
  // ============================================
  dessinerCourbe() {
    if (!this.chartCanvas || !this.evolutionActive.length) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    const data  = this.evolutionActive;
    const W     = canvas.offsetWidth;
    const H     = canvas.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    const couleur = this.vueActive === 'reel' ? '#22c55e' : '#f97316';
    const couleurAlpha = this.vueActive === 'reel' ? 'rgba(34,197,94,' : 'rgba(249,115,22,';

    const pad    = { top: 30, right: 20, bottom: 50, left: 75 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const maxCA  = Math.max(...data.map(d => d.chiffre_affaires), 1);
    const xStep  = chartW / Math.max(data.length - 1, 1);

    const toX = (i: number) => pad.left + i * xStep;
    const toY = (v: number) => pad.top + chartH - (v / maxCA) * chartH;

    ctx.clearRect(0, 0, W, H);

    // Grille
    for (let i = 0; i <= 5; i++) {
      const y   = pad.top + (chartH / 5) * i;
      const val = maxCA - (maxCA / 5) * i;
      ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(this.formatMontant(val), pad.left - 8, y + 4);
    }

    // Gradient
    const gradient = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    gradient.addColorStop(0, couleurAlpha + '0.18)');
    gradient.addColorStop(1, couleurAlpha + '0)');
    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(d.chiffre_affaires)) : ctx.lineTo(toX(i), toY(d.chiffre_affaires));
    });
    ctx.lineTo(toX(data.length - 1), H - pad.bottom);
    ctx.lineTo(toX(0), H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient; ctx.fill();

    // Ligne
    ctx.beginPath(); ctx.strokeStyle = couleur; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(d.chiffre_affaires)) : ctx.lineTo(toX(i), toY(d.chiffre_affaires));
    });
    ctx.stroke();

    // Points + labels
    this.chartPoints = [];
    data.forEach((d, i) => {
      const x = toX(i); const y = toY(d.chiffre_affaires);
      this.chartPoints.push({ x, y, data: d });
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = couleur; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(this.formatPeriodeLabel(d.periode), x, H - pad.bottom + 20);
    });
  }

  onCanvasClick(event: MouseEvent) {
    if (!this.chartCanvas) return;
    const rect   = this.chartCanvas.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const found  = this.chartPoints.find(p => Math.hypot(p.x - mouseX, p.y - mouseY) < 20);
    if (found) {
      this.tooltip = {
        visible: true, x: found.x, y: found.y,
        label:     this.formatPeriodeTableau(found.data.periode),
        ca:        found.data.chiffre_affaires.toLocaleString('fr-MG') + ' Ar',
        commandes: found.data.nb_commandes
      };
    } else {
      this.tooltip.visible = false;
    }
  }

  fermerTooltip() { this.tooltip.visible = false; }

  formatMontant(val: number): string {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000)     return (val / 1_000).toFixed(0) + 'k';
    return val.toFixed(0);
  }

  formatPeriodeLabel(p: StatsEvolution['periode']): string {
    if (p.jour)    return `${p.jour} ${this.MOIS_COURTS[(p.mois ?? 1) - 1]}`;
    if (p.semaine) return `S${p.semaine}`;
    if (p.mois)    return this.MOIS_COURTS[(p.mois ?? 1) - 1];
    return `${p.annee}`;
  }

  formatPeriodeTableau(p: StatsEvolution['periode']): string {
    if (p.jour)    return `${p.jour} ${this.MOIS_LONGS[(p.mois ?? 1) - 1]} ${p.annee}`;
    if (p.semaine) return `Semaine ${p.semaine} — ${p.annee}`;
    if (p.mois)    return `${this.MOIS_LONGS[(p.mois ?? 1) - 1]} ${p.annee}`;
    return `${p.annee}`;
  }
}
