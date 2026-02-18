import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { Router, RouterModule } from '@angular/router';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmation: ''
  };

  constructor(
    private http: HttpClient,
    private alertService: AlertService, 
    private router: Router 
  ) {}

  onRegister() {
    // Vérification des mots de passe
    if (this.user.motDePasse !== this.user.confirmation) {
      this.alertService.error('Les mots de passe ne correspondent pas'); 
      return;
    }

    const payload = {
      nom: this.user.nom,
      prenom: this.user.prenom,
      email: this.user.email,
      telephone: this.user.telephone,
      motDePasse: this.user.motDePasse
    };

    // Appel API
    this.http.post<any>(`${environment.apiUrl}/api/users/register`, payload)
      .subscribe({
        next: (res) => {
          this.alertService.success(
            'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.'
          ); 
          
          // Optionnel : Redirection après 3 secondes
          setTimeout(() => {
            this.router.navigate(['/connexion']);
          }, 3000);
        },
        error: (err) => {
          this.alertService.error(
            err.error?.message || 'Erreur lors de l\'inscription'
          ); 
        }
      });
  }
}