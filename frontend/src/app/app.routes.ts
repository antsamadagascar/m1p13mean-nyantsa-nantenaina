import { Routes } from '@angular/router';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';

export const routes: Routes = [

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