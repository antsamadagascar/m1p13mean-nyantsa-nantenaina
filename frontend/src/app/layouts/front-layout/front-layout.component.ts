import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-front-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './front-layout.component.html',
  styleUrls: ['./front-layout.component.css']
})
export class FrontLayoutComponent {
  mobileMenuOpen = false;

  navItems = [
    { path: '/', label: 'Accueil', exact: true },
    { path: '/boutiques', label: 'Boutiques', exact: false },
    { path: '/produits', label: 'Produits', exact: false },
    { path: '/contact', label: 'Contact', exact: false }
  ];

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
