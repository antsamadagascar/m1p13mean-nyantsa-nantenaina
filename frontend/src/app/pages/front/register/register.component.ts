import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // ✅ Nécessaire pour ngIf, ngClass, ngFor
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule,RouterModule], // ✅ Ajout de CommonModule
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

  message = '';
  messageType: 'success' | 'error' | '' = ''; // pour gérer le style de notification

  constructor(private http: HttpClient) {}

  onRegister() {
    this.message = '';
    this.messageType = '';

    // Vérification des mots de passe
    if (this.user.motDePasse !== this.user.confirmation) {
      this.message = 'Les mots de passe ne correspondent pas';
      this.messageType = 'error';
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
    this.http.post<any>('http://localhost:5000/api/register', payload)
      .subscribe({
        next: (res) => {
          this.message = res.message || 'Inscription réussie';
          this.messageType = 'success';
        },
        error: (err) => {
          this.message = err.error?.message || 'Erreur lors de l’inscription';
          this.messageType = 'error';
        }
      });
  }
}
