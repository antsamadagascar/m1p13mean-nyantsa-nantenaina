// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';
import { ConnexionComponent } from './components/auth/connexion/connexion.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { 
    path: 'connexion', 
    component: ConnexionComponent 
  },

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
      }
    ]
  },

  {
    path: '',
    component: FrontLayoutComponent,
    children: [
      { 
        path: '', 
        loadComponent: () => import('./pages/front/home/home.component')
          .then(m => m.HomeComponent)
      }
    ]
  },

  { 
    path: '**', 
    redirectTo: 'connexion'
  }
];