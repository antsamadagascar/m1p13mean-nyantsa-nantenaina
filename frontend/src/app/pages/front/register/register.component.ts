import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user = {
    nom: '',
    prenom: '',
    email: '',
    telephone:'',
    motDePasse: '',
    confirmation: ''
  };

  message = '';

  constructor(private http: HttpClient) {}

  onRegister() {
    if (this.user.motDePasse !== this.user.confirmation) {
      this.message = 'Les mots de passe ne correspondent pas';
      return;
    }

    const payload = {
      nom: this.user.nom,
      prenom: this.user.prenom,
      email: this.user.email,
      telephone: this.user.telephone,
      motDePasse: this.user.motDePasse
    };

    this.http.post('http://localhost:5000/api/register', payload)
      .subscribe({
        next: () => this.message = 'Inscription réussie',
        error: () => this.message = 'Erreur lors de l’inscription'
      });
  }
}
