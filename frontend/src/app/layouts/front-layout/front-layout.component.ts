import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './front-layout.component.html',
  styleUrls: ['./front-layout.component.css']
})
export class FrontLayoutComponent implements OnInit {
  mobileMenuOpen = false;
  userMenuOpen = false;  
  currentUser: any = null;
  
  navItems = [
    { path: '/', label: 'Accueil', exact: true },
    { path: '/boutiques', label: 'Boutiques', exact: false },
    { path: '/produits', label: 'Produits', exact: false },
    { path: '/contact', label: 'Contact', exact: false }
  ];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
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
  this.closeMobileMenu();
}

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenom[0]}${this.currentUser.nom[0]}`.toUpperCase();
  }
}