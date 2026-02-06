import { Component } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; 
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../../services/alert.service';


@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './connexion.component.html',    
  styleUrls: ['./connexion.component.css'] 
})
export class ConnexionComponent {
  credentials = {
    email: '',
    motDePasse: ''
  };
  
  errorMessage = '';
  loading = false;
  showPassword = false;


  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private route: ActivatedRoute // activation route de protection
  ) {}

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    

    this.authService.connexion(this.credentials).subscribe({
      next: (response) => {
        this.alertService.success('Connexion réussie ');

        setTimeout(() => {
          switch(response.user.role) {
            case 'ADMIN':
            case 'BOUTIQUE':
              this.router.navigate(['/backoffice']);
              break;
            case 'ACHETEUR':
              this.router.navigate(['/']);
              break;
          }
        }, 500); 
      },

      error: (error) => {
        this.alertService.error(error.error?.message || 'Email ou mot de passe incorrect');
        this.loading = false;
      }
    });

  }

  // Fonction pour remplir automatiquement les champs (démo)
  fillDemo(role: 'admin' | 'boutique' | 'client') {
    switch(role) {
      case 'admin':
        this.credentials.email = 'admin@citymall.mg';
        this.credentials.motDePasse = 'admin123';
        break;
      case 'boutique':
        this.credentials.email = 'boutique@fashion.mg';
        this.credentials.motDePasse = 'boutique123';
        break;
      case 'client':
        this.credentials.email = 'client@mail.mg';
        this.credentials.motDePasse = 'client123';
        break;
    }
  }
}