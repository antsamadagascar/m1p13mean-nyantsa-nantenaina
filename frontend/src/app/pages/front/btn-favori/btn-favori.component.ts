import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FavoriService } from '../../../services/favori.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-btn-favori',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './btn-favori.component.html',
  styleUrls: ['./btn-favori.component.css']
})
export class BtnFavoriComponent implements OnInit, OnDestroy {

  @Input() produitId!: string;
  @Input() taille: 'sm' | 'md' | 'lg' = 'md';

  estFavori = false;
  enCours = false;
  estConnecte = false;

  private destroy$ = new Subject<void>();

  constructor(
    private favoriService: FavoriService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Écoute le user connecté
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.estConnecte = !!user;
      });

    // Écoute les changements de favoris en temps réel
    this.favoriService.favorisIds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.estFavori = this.favoriService.estFavori(this.produitId);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Redirige vers login si non connecté
    if (!this.estConnecte) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.enCours) return;

    this.enCours = true;

    this.favoriService.toggleFavori(this.produitId).subscribe({
      next: () => this.enCours = false,
      error: () => this.enCours = false
    });
  }
}