import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';
import { RegisterComponent } from './pages/front/register/register.component';
import { VerifyEmailComponent } from './pages/front/verify-email/verify-email.component';
import { ConnexionComponent } from './pages/front/auth/connexion.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
// import { BoutiqueCreateComponent } from './pages/admin/boutiques/';
export const routes: Routes = [
  {
    path: 'connexion',
    component: ConnexionComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent
  },

  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/front/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/front/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
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
      {
        path: 'boutiques',
        loadComponent: () => import('./pages/admin/boutiques/boutiques.component')
          .then(m => m.BoutiquesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
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

  // Redirection 404
  { path: '**', redirectTo: 'connexion' }
];
