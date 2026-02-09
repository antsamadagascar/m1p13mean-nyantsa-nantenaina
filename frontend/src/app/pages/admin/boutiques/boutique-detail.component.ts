import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoutiqueService, Boutique } from '../../../services/boutique.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-boutique-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-detail.component.html'
})
export class BoutiqueDetailComponent implements OnInit {
  boutique: Boutique | null = null;
  loading = false;
  boutiqueId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private boutiqueService: BoutiqueService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.boutiqueId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBoutique();
  }

  loadBoutique() {
    this.loading = true;
    this.boutiqueService.getBoutiqueById(this.boutiqueId).subscribe({
      next: (data) => {
        this.boutique = data;
        this.loading = false;
      },
      error: (error) => {
        this.alertService.error('Boutique non trouvée');
        this.router.navigate(['/backoffice/boutiques']);
        this.loading = false;
      }
    });
  }

  valider() {
    if (!this.boutique) return;
    
    if (confirm('Voulez-vous valider cette boutique ?')) {
      this.boutiqueService.validerBoutique(this.boutique._id).subscribe({
        next: () => {
          this.alertService.success('Boutique validée avec succès');
          this.loadBoutique();
        },
        error: () => {
          this.alertService.error('Erreur lors de la validation');
        }
      });
    }
  }

  suspendre() {
    if (!this.boutique) return;
    
    const motif = prompt('Motif de suspension :');
    if (motif) {
      this.boutiqueService.suspendreBoutique(this.boutique._id, motif).subscribe({
        next: () => {
          this.alertService.success('Boutique suspendue');
          this.loadBoutique();
        },
        error: () => {
          this.alertService.error('Erreur lors de la suspension');
        }
      });
    }
  }

  reactiver() {
    if (!this.boutique) return;
    
    if (confirm('Voulez-vous réactiver cette boutique ?')) {
      this.boutiqueService.reactiverBoutique(this.boutique._id).subscribe({
        next: () => {
          this.alertService.success('Boutique réactivée');
          this.loadBoutique();
        },
        error: () => {
          this.alertService.error('Erreur lors de la réactivation');
        }
      });
    }
  }

  getJours(): string[] {
    return ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  }
}