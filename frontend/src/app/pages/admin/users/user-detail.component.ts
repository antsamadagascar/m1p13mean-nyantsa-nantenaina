import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';

interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: 'ADMIN' | 'BOUTIQUE' | 'ACHETEUR';
  actif: boolean;
  emailVerifie: boolean;
  dateInscription: Date;
  dateSuspension?: Date;
  raisonSuspension?: string;
  dateReactivation?: Date;
  boutiqueId?: {
    _id: string;
    nom: string;
    adresse?: string;
  };
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="user-detail-container">
      <!-- Header avec actions -->
      <div class="detail-header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
          <h1>Détails de l'utilisateur</h1>
        </div>
        
        <div class="header-actions" *ngIf="user">
          <button 
            class="btn-action btn-suspend" 
            *ngIf="user.actif"
            (click)="suspendUser()">
            <i class="fas fa-ban"></i> Suspendre
          </button>
          <button 
            class="btn-action btn-activate" 
            *ngIf="!user.actif"
            (click)="activateUser()">
            <i class="fas fa-check-circle"></i> Activer
          </button>
          <button 
            class="btn-action btn-delete"
            (click)="deleteUser()">
            <i class="fas fa-trash"></i> Supprimer
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i> Chargement...
      </div>

      <!-- Error -->
      <div class="error-message" *ngIf="error">
        <i class="fas fa-exclamation-circle"></i> {{ error }}
      </div>

      <!-- User Details -->
      <div class="user-details" *ngIf="user && !loading">
        <!-- Status Badge -->
        <div class="status-badge" [class.active]="user.actif" [class.suspended]="!user.actif">
          <i class="fas" [class.fa-check-circle]="user.actif" [class.fa-ban]="!user.actif"></i>
          {{ user.actif ? 'Actif' : 'Suspendu' }}
        </div>

        <!-- Informations personnelles -->
        <section class="detail-section">
          <h2><i class="fas fa-user"></i> Informations personnelles</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Nom complet</label>
              <p>{{ user.nom }} {{ user.prenom }}</p>
            </div>
            <div class="info-item">
              <label>Email</label>
              <p>
                {{ user.email }}
                <span class="badge" [class.verified]="user.emailVerifie" [class.unverified]="!user.emailVerifie">
                  <i class="fas" [class.fa-check]="user.emailVerifie" [class.fa-times]="!user.emailVerifie"></i>
                  {{ user.emailVerifie ? 'Vérifié' : 'Non vérifié' }}
                </span>
              </p>
            </div>
            <div class="info-item" *ngIf="user.telephone">
              <label>Téléphone</label>
              <p>{{ user.telephone }}</p>
            </div>
            <div class="info-item">
              <label>Rôle</label>
              <p>
                <span class="role-badge" [class]="'role-' + user.role.toLowerCase()">
                  {{ getRoleLabel(user.role) }}
                </span>
              </p>
            </div>
          </div>
        </section>

        <!-- Boutique associée (si rôle BOUTIQUE) -->
        <section class="detail-section" *ngIf="user.role === 'BOUTIQUE' && user.boutiqueId">
          <h2><i class="fas fa-store"></i> Boutique associée</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Nom de la boutique</label>
              <p>{{ user.boutiqueId.nom }}</p>
            </div>
            <div class="info-item" *ngIf="user.boutiqueId.adresse">
              <label>Adresse</label>
              <p>{{ user.boutiqueId.adresse }}</p>
            </div>
          </div>
          <button 
            class="btn-link" 
            [routerLink]="['/backoffice/boutiques', user.boutiqueId._id]">
            Voir la boutique <i class="fas fa-arrow-right"></i>
          </button>
        </section>

        <!-- Historique du compte -->
        <section class="detail-section">
          <h2><i class="fas fa-history"></i> Historique du compte</h2>
          <div class="timeline">
            <div class="timeline-item">
              <i class="fas fa-user-plus"></i>
              <div>
                <strong>Inscription</strong>
                <p>{{ user.dateInscription | date:'dd/MM/yyyy à HH:mm' }}</p>
              </div>
            </div>
            
            <div class="timeline-item warning" *ngIf="user.dateSuspension">
              <i class="fas fa-ban"></i>
              <div>
                <strong>Suspension</strong>
                <p>{{ user.dateSuspension | date:'dd/MM/yyyy à HH:mm' }}</p>
                <p class="reason" *ngIf="user.raisonSuspension">
                  Raison: {{ user.raisonSuspension }}
                </p>
              </div>
            </div>
            
            <div class="timeline-item success" *ngIf="user.dateReactivation">
              <i class="fas fa-check-circle"></i>
              <div>
                <strong>Réactivation</strong>
                <p>{{ user.dateReactivation | date:'dd/MM/yyyy à HH:mm' }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Zone de danger -->
        <section class="detail-section danger-zone">
          <h2><i class="fas fa-exclamation-triangle"></i> Zone de danger</h2>
          <p class="warning-text">
            Les actions suivantes sont irréversibles. Soyez certain avant de procéder.
          </p>
          <button 
            class="btn-danger" 
            (click)="deleteUser()"
            *ngIf="user.role !== 'ADMIN'">
            <i class="fas fa-trash"></i> Supprimer définitivement cet utilisateur
          </button>
          <p class="info-text" *ngIf="user.role === 'ADMIN'">
            <i class="fas fa-shield-alt"></i> Les administrateurs ne peuvent pas être supprimés.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .user-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
      background: white;
      border: 1px solid #ddd;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-back:hover {
      background: #f5f5f5;
      transform: translateX(-3px);
    }

    h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
    }

    .btn-suspend {
      background: #ff9800;
      color: white;
    }

    .btn-suspend:hover {
      background: #f57c00;
    }

    .btn-activate {
      background: #4caf50;
      color: white;
    }

    .btn-activate:hover {
      background: #388e3c;
    }

    .btn-delete {
      background: #f44336;
      color: white;
    }

    .btn-delete:hover {
      background: #d32f2f;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      font-size: 1.2rem;
      color: #666;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #c62828;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      margin-bottom: 2rem;
    }

    .status-badge.active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-badge.suspended {
      background: #ffebee;
      color: #c62828;
    }

    .detail-section {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .detail-section h2 {
      margin: 0 0 1.5rem 0;
      font-size: 1.3rem;
      color: #333;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .info-item label {
      display: block;
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.3rem;
      font-weight: 500;
    }

    .info-item p {
      margin: 0;
      font-size: 1rem;
      color: #333;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.verified {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge.unverified {
      background: #fff3e0;
      color: #e65100;
    }

    .role-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .role-admin {
      background: #e3f2fd;
      color: #1565c0;
    }

    .role-boutique {
      background: #f3e5f5;
      color: #6a1b9a;
    }

    .role-acheteur {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .timeline-item.warning {
      border-left-color: #ff9800;
      background: #fff3e0;
    }

    .timeline-item.success {
      border-left-color: #4caf50;
      background: #e8f5e9;
    }

    .timeline-item i {
      font-size: 1.5rem;
      color: #666;
    }

    .timeline-item strong {
      display: block;
      margin-bottom: 0.3rem;
    }

    .timeline-item p {
      margin: 0.2rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .reason {
      font-style: italic;
      color: #ff6f00 !important;
    }

    .danger-zone {
      border: 2px solid #f44336;
    }

    .danger-zone h2 {
      color: #d32f2f;
    }

    .warning-text {
      color: #666;
      margin-bottom: 1rem;
    }

    .btn-danger {
      background: #f44336;
      color: white;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .btn-danger:hover {
      background: #d32f2f;
      transform: translateY(-2px);
    }

    .info-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      font-style: italic;
    }

    .btn-link {
      background: #2196f3;
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1rem;
      transition: all 0.3s;
    }

    .btn-link:hover {
      background: #1976d2;
    }
  `]
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error: string | null = null;
  userId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.params['id'];
    this.loadUser();
  }

  loadUser() {
    this.loading = true;
    this.error = null;

    this.userService.getUserById(this.userId).subscribe({
      next: (response: any) => {
        this.user = response.data || response;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateur:', err);
        this.error = 'Impossible de charger les détails de l\'utilisateur';
        this.loading = false;
      }
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrateur',
      'BOUTIQUE': 'Propriétaire de boutique',
      'ACHETEUR': 'Acheteur'
    };
    return labels[role] || role;
  }

  suspendUser() {
    const raison = prompt('Raison de la suspension:');
    if (!raison) return;

    if (confirm(`Êtes-vous sûr de vouloir suspendre ${this.user?.prenom} ${this.user?.nom}?`)) {
      this.userService.suspendUser(this.userId, raison).subscribe({
        next: () => {
          alert('Utilisateur suspendu avec succès');
          this.loadUser();
        },
        error: (err) => {
          console.error('Erreur suspension:', err);
          alert('Erreur lors de la suspension');
        }
      });
    }
  }

  activateUser() {
    if (confirm(`Êtes-vous sûr de vouloir activer ${this.user?.prenom} ${this.user?.nom}?`)) {
      this.userService.activateUser(this.userId).subscribe({
        next: () => {
          alert('Utilisateur activé avec succès');
          this.loadUser();
        },
        error: (err) => {
          console.error('Erreur activation:', err);
          alert('Erreur lors de l\'activation');
        }
      });
    }
  }

  deleteUser() {
    if (confirm(` ATTENTION: Êtes-vous VRAIMENT sûr de vouloir supprimer définitivement ${this.user?.prenom} ${this.user?.nom}? Cette action est irréversible!`)) {
      this.userService.deleteUser(this.userId).subscribe({
        next: () => {
          alert('Utilisateur supprimé avec succès');
          this.router.navigate(['/backoffice/users']);
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          alert('Erreur lors de la suppression: ' + (err.error?.message || 'Erreur inconnue'));
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/backoffice/users']);
  }
}