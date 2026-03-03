import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  motDePasse = '';
  confirmation = '';
  loading = false;
  showPassword = false;
  showConfirmation = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.alertService.error('Token manquant ou invalide');
      this.router.navigate(['/connexion']);
    }
  }

  onSubmit() {
    // Validation
    if (!this.motDePasse || !this.confirmation) {
      this.alertService.error('Veuillez remplir tous les champs');
      return;
    }

    if (this.motDePasse.length < 6) {
      this.alertService.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (this.motDePasse !== this.confirmation) {
      this.alertService.error('Les mots de passe ne correspondent pas');
      return;
    }

    this.loading = true;

    // Appel API
    this.http.post(`${environment.apiUrl}/api/users/reset-password?token=${this.token}`, {
      motDePasse: this.motDePasse
    }).subscribe({
      next: (response: any) => {
        this.alertService.success('Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
        this.loading = false;
        
        // Redirection après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/connexion']);
        }, 2000);
      },
      error: (error) => {
        this.alertService.error(
          error.error?.error || 'Token invalide ou expiré. Veuillez refaire une demande.'
        );
        this.loading = false;
      }
    });
  }
}