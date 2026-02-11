import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { Subscription } from 'rxjs';

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
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit, OnDestroy {
  user: User | null = null;
  loading = true;
  error: string | null = null;
  userId: string = '';
  currentUserId: string = '';
  isCurrentUserAdmin: boolean = false;
  private authSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private alertService: AlertService // <-- injection
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.params['id'];
    this.getCurrentUserInfo();
    this.loadUser();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  getCurrentUserInfo() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser._id) {
      this.currentUserId = currentUser._id;
      this.isCurrentUserAdmin = currentUser.role === 'ADMIN';
    }
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
        this.alertService.error(this.error); 
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
        next: (res: any) => {
          this.alertService.success(res.message || 'Utilisateur suspendu avec succès');
          this.loadUser();
        },
        error: (err) => {
          console.error('Erreur suspension:', err);
          this.alertService.error(err.error?.message || 'Erreur lors de la suspension');
        }
      });
    }
  }

  activateUser() {
    if (confirm(`Êtes-vous sûr de vouloir activer ${this.user?.prenom} ${this.user?.nom}?`)) {
      this.userService.activateUser(this.userId).subscribe({
        next: (res: any) => {
          this.alertService.success(res.message || 'Utilisateur activé avec succès');
          this.loadUser();
        },
        error: (err) => {
          console.error('Erreur activation:', err);
          this.alertService.error(err.error?.message || 'Erreur lors de l\'activation');
        }
      });
    }
  }

  deleteUser() {
    if (confirm(`ATTENTION: Êtes-vous VRAIMENT sûr de vouloir supprimer définitivement ${this.user?.prenom} ${this.user?.nom}? Cette action est irréversible!`)) {
      this.userService.deleteUser(this.userId).subscribe({
        next: (res: any) => {
          this.alertService.success(res.message || 'Utilisateur supprimé avec succès');
          this.router.navigate(['/backoffice/users']);
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.alertService.error(err.error?.message || 'Erreur lors de la suppression');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/backoffice/users']);
  }
}
