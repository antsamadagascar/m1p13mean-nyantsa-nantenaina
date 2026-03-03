import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.email) {
      this.alertService.error('Veuillez saisir votre email');
      return;
    }

    this.loading = true;

    this.http.post(`${environment.apiUrl}/api/users/forgot-password`, { email: this.email })
      .subscribe({
        next: () => {
          this.alertService.success(
            'Si cet email existe, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail.'
          );
          this.email = '';
          this.loading = false;

          setTimeout(() => {
            this.router.navigate(['/connexion']);
          }, 3000);
        },
        error: () => {
          this.alertService.error('Une erreur est survenue. Veuillez réessayer.');
          this.loading = false;
        }
      });
  }
}