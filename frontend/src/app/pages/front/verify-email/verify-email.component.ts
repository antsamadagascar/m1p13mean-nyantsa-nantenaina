import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertService: AlertService 
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.isLoading = false;
      this.errorMessage = 'Token de vérification manquant';
      this.alertService.error('Token de vérification manquant');
      return;
    }

    this.verifyEmail(token);
  }

  verifyEmail(token: string): void {
    this.http.get(`http://localhost:5000/api/verify-email?token=${token}`)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.isSuccess = true;
          
          this.alertService.success(
            'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'
          ); 
          
          setTimeout(() => {
            this.router.navigate(['/connexion']);
          }, 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.error || 'Token invalide ou expiré';
          
          this.alertService.error(this.errorMessage); 
        }
      });
  }
}