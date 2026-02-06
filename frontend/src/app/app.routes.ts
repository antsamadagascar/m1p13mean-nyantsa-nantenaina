import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';
import { ConnexionComponent } from './components/auth/connexion/connexion.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // ========== ROUTE DE CONNEXION (publique) ==========
  { 
    path: 'connexion', 
    component: ConnexionComponent 
  },

  // ========== ROUTES BACKOFFICE (protégées ADMIN + BOUTIQUE) ==========
  {
    path: 'backoffice',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],  // PROTECTION 
    data: { roles: ['ADMIN', 'BOUTIQUE'] }, //  Les 2 rôles peuvent accéder
    children: [
      { 
        path: '', 
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
 
    ]
  },

  // ========== ROUTES FRONT (publiques + protégées ACHETEUR) ==========
  {
    path: '',
    component: FrontLayoutComponent,
    children: [
      // Routes publiques
      { 
        path: '', 
        loadComponent: () => import('./pages/front/home/home.component')
          .then(m => m.HomeComponent)
      },
    
    ]
  },

  // ========== REDIRECTION 404 ==========
  { 
    path: '**', 
    redirectTo: '' 
  }
];