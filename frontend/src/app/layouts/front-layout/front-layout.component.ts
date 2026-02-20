import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { FavoriService } from '../../services/favori.service';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './front-layout.component.html',
  styleUrls: ['./front-layout.component.css']
})

export class FrontLayoutComponent implements OnInit{
  mobileMenuOpen = false;
  userMenuOpen = false;  
  currentUser: any = null;
  
  navItems = [
    { path: '/', label: 'Accueil', exact: true },
    { path: '/produits', label: 'Produits', exact: false },
  ];

  nombreFavoris = 0;
  private destroy$ = new Subject<void>();

  constructor(public authService: AuthService , private router: Router,
  private alertService: AlertService,private favoriService: FavoriService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  
    this.favoriService.favorisIds.subscribe(ids => {
      this.nombreFavoris = ids.size;
    });
  
    this.checkUserAccess();
  }
  

  private checkUserAccess() {
    const userRole = this.authService.getUserRole();

    //  Si ADMIN ou BOUTIQUE, on redirige immédiatement
    if (userRole === 'ADMIN' || userRole === 'BOUTIQUE') {
      console.log(`${userRole} redirigé de / vers /backoffice`);
      this.router.navigate(['/backoffice'], { replaceUrl: true });
    }
  }


  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  toggleUserMenu() {  
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout() {
    this.userMenuOpen = false;
    this.authService.logout();

    this.alertService.success('Vous êtes déconnecté ');
    this.router.navigate(['/connexion']);

    this.closeMobileMenu();
  }


  getUserInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenom[0]}${this.currentUser.nom[0]}`.toUpperCase();
  }
}