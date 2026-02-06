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
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'BOUTIQUE'] },
    children: [
      { 
        path: '', 
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },

    ]
  },

  // ========== ROUTES FRONT (espace ACHETEUR) ==========
  {
    path: '',
    component: FrontLayoutComponent,
    children: [
      //  PAGE D'ACCUEIL - Accessible à tous MAIS redirige si ADMIN/BOUTIQUE
      { 
        path: '', 
        loadComponent: () => import('./pages/front/home/home.component')
          .then(m => m.HomeComponent),
        canActivate: [roleGuard],
        data: { roles: ['ACHETEUR', 'GUEST'] } //  ACHETEUR ou non connecté
      },
      
  
    ]
  },

  // ========== REDIRECTION 404 ==========
  { 
    path: '**', 
    redirectTo: 'connexion'
  }
];