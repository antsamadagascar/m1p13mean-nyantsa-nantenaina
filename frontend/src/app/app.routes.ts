import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';
import { RegisterComponent } from './pages/front/register/register.component';
import { VerifyEmailComponent } from './pages/front/verify-email/verify-email.component';
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
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'BOUTIQUE'] }
      },
      // Route de test - Accessible uniquement par ADMIN
      { 
        path: 'boutiques', 
        loadComponent: () => import('./pages/admin/boutiques/boutiques.component')
          .then(m => m.BoutiquesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] } //  Seulement ADMIN
      },
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
  // Route register
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  // Redirection 404
  { path: '**', redirectTo: 'connexion' }
];