import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
}

interface SectionState {
  main: boolean;
  management: boolean;
  config: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  sidebarOpen = true;
  mobileMenuOpen = false;
  userMenuOpen = false;
  
  sections: SectionState = {
    main: true,
    management: true,
    config: true
  };

  mainMenuItems: MenuItem[] = [];
  managementMenuItems: MenuItem[] = [];
  configMenuItems: MenuItem[] = [];

  constructor(public authService: AuthService,private alertService: AlertService) {
    if (window.innerWidth <= 768) {
      this.sections = {
        main: false,
        management: false,
        config: false
      };
    }
  }

  ngOnInit() {
    this.loadMenuByRole();
  }

  loadMenuByRole() {
    const userRole = this.authService.getUserRole();

    if (userRole === 'ADMIN') {
      //  MENU  pour ADMIN
      this.mainMenuItems = [
        { path: '/backoffice', label: 'Tableau de bord', icon: 'fa-solid fa-chart-line', exact: true },
        { path: '/backoffice/analytics', label: 'Analytiques', icon: 'fa-solid fa-chart-bar', exact: false }
      ];

      this.managementMenuItems = [
        { path: '/backoffice/users', label: 'Utilisateurs', icon: 'fa-solid fa-users', exact: false },
        { path: '/backoffice/boutiques', label: 'Boutiques', icon: 'fa-solid fa-store', exact: false },
        { path: '/backoffice/products', label: 'Produits', icon: 'fa-solid fa-box', exact: false },
        { path: '/backoffice/orders', label: 'Commandes', icon: 'fa-solid fa-cart-shopping', exact: false }
      ];

      this.configMenuItems = [
        { path: '/backoffice/reports', label: 'Rapports', icon: 'fa-solid fa-file-lines', exact: false },
        { path: '/backoffice/settings', label: 'Paramètres', icon: 'fa-solid fa-gear', exact: false }
      ];

    } else if (userRole === 'BOUTIQUE') {
      //  MENU LIMITÉ pour BOUTIQUE (test fotsiny)
      this.mainMenuItems = [
        { path: '/backoffice', label: 'Tableau de bord', icon: 'fa-solid fa-chart-line', exact: true }
      ];

      this.managementMenuItems = [
        { path: '/backoffice/products', label: 'Mes Produits', icon: 'fa-solid fa-box', exact: false },
        { path: '/backoffice/orders', label: 'Mes Commandes', icon: 'fa-solid fa-cart-shopping', exact: false },
        { path: '/backoffice/boutiques', label: 'Ma Boutique', icon: 'fa-solid fa-store', exact: false }
      ];

      this.configMenuItems = [
        { path: '/backoffice/settings', label: 'Paramètres', icon: 'fa-solid fa-gear', exact: false }
      ];
    }
  }

  get allMenuItems(): MenuItem[] {
    return [
      ...this.mainMenuItems,
      ...this.managementMenuItems,
      ...this.configMenuItems
    ];
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  toggleSection(section: keyof SectionState) {
    this.sections[section] = !this.sections[section];
  }

  logout() {
    this.userMenuOpen = false;
    this.authService.logout();
    this.alertService.success('Vous êtes déconnecté ');
    this.closeMobileMenu();
  }
}
