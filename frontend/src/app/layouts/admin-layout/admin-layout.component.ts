import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';


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
export class AdminLayoutComponent {
  
  sidebarOpen = true;
  mobileMenuOpen = false;
  userMenuOpen = false;
  
  sections: SectionState = {
    main: true,
    management: true,
    config: true
  };
  
  constructor(public authService: AuthService) {
    if (window.innerWidth <= 768) {
      this.sections = {
        main: false,
        management: false,
        config: false
      };
    }
  }


  mainMenuItems: MenuItem[] = [
    { path: '/admin', label: 'Tableau de bord', icon: 'fa-solid fa-chart-line', exact: true },
    { path: '/admin/analytics', label: 'Analytiques', icon: 'fa-solid fa-chart-bar', exact: false }
  ];

  managementMenuItems: MenuItem[] = [
    { path: '/admin/users', label: 'Utilisateurs', icon: 'fa-solid fa-users', exact: false },
    { path: '/admin/boutiques', label: 'Boutiques', icon: 'fa-solid fa-store', exact: false },
    { path: '/admin/products', label: 'Produits', icon: 'fa-solid fa-box', exact: false },
    { path: '/admin/orders', label: 'Commandes', icon: 'fa-solid fa-cart-shopping', exact: false }
  ];

  configMenuItems: MenuItem[] = [
    { path: '/admin/reports', label: 'Rapports', icon: 'fa-solid fa-file-lines', exact: false },
    { path: '/admin/settings', label: 'Paramètres', icon: 'fa-solid fa-gear', exact: false }
  ];

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
    this.closeMobileMenu();
  }


  addMenuItem(section: 'main' | 'management' | 'config', item: MenuItem) {
    switch(section) {
      case 'main':
        this.mainMenuItems.push(item);
        break;
      case 'management':
        this.managementMenuItems.push(item);
        break;
      case 'config':
        this.configMenuItems.push(item);
        break;
    }
  }
  
  removeMenuItem(path: string) {
    this.mainMenuItems = this.mainMenuItems.filter(item => item.path !== path);
    this.managementMenuItems = this.managementMenuItems.filter(item => item.path !== path);
    this.configMenuItems = this.configMenuItems.filter(item => item.path !== path);
  }
}