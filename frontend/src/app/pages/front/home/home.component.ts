import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service'; // 👈 ajouter le service

interface StatusResponse {
  connected: boolean;
  database?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  loading = true;
  connectionStatus: StatusResponse | null = null;
  currentUser: any = null; 
  private apiStatusUrl = `${environment.apiUrl}/api/status`; 

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.checkStatus();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  checkStatus() {
    this.loading = true;
    this.http.get<StatusResponse>(this.apiStatusUrl).subscribe({  
      next: (data) => {
        this.connectionStatus = {
          connected: data.connected,
          database: data.database
        };
        this.loading = false;
        console.log('Statut:', this.connectionStatus);
      },
      error: (error) => {
        this.connectionStatus = { 
          connected: false,
          database: 'Déconnectée' 
        };
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  reloadStatus() {
    this.checkStatus();
  }

  get isProduction(): boolean {
    return false;
  }

}
