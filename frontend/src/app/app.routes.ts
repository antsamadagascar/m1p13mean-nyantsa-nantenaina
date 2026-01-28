import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';

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

  // Redirection 404
  { path: '**', redirectTo: '' }
];