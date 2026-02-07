import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';
import { RegisterComponent } from './pages/front/register/register.component';
import { VerifyEmailComponent } from './pages/front/verify-email/verify-email.component';
export const routes: Routes = [
  // Route Admin
  {
    path: 'backoffice',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      }
    ]
  },

  // Route Front
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
  { path: '**', redirectTo: '' }
];
