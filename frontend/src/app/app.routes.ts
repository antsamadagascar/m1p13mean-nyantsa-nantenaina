import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { FrontLayoutComponent } from './layouts/front-layout/front-layout.component';
import { RegisterComponent } from './pages/front/register/register.component';
import { VerifyEmailComponent } from './pages/front/verify-email/verify-email.component';
import { ConnexionComponent } from './pages/front/auth/connexion.component';
import { BoutiqueDetailComponent } from './pages/admin/boutiques/boutique-detail.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { GerantRegistrationComponent } from './pages/front/gerant-registration/gerant-registration.component';

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
    path: 'users/verify-email',
    component: VerifyEmailComponent
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/front/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'gerant/boutique/:id',
    component: GerantRegistrationComponent
  },
  {
    path: 'users/reset-password',
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

      // route pour la gestions boutiques
      {
        path: 'boutiques',
        loadComponent: () => import('./pages/admin/boutiques/boutiques.component')
          .then(m => m.BoutiquesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'boutiques/details/:id',
        component: BoutiqueDetailComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN','BOUTIQUE'] }
      },

      {
        path: 'boutiques/config',
        loadComponent: () => import('./pages/admin/boutique-horaires-config/boutique-horaires-config.component')
          .then(m => m.BoutiqueHorairesConfigComponent),
        canActivate: [roleGuard],
        data: { roles: ['BOUTIQUE'] }
      },

      //routes pour la gestion products
      {
        path: 'products',
        loadComponent: () => import('./pages/admin/products-admin/products-list-admin.component')
          .then(m => m.ProductsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'products/boutique',
        loadComponent: () => import('./pages/admin/products-boutique/products-list-boutique.component')
          .then(m => m.ProduitComponent),
        canActivate: [roleGuard],
        data: { roles: ['BOUTIQUE'] }
      },
      {
        path: 'zones',
        loadComponent: () => import('./pages/admin/zones/zones.component')
          .then(m => m.ZonesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      
      // Gestion des utilisateurs
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users/users.component')
          .then(m => m.UsersComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/admin/users/user-detail.component')
          .then(m => m.UserDetailComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },

       {
        path: 'orders',
        loadComponent: () => import('./pages/admin/orders-stores/orders-stores.component')
          .then(m => m.OrdersComponent),
        canActivate: [roleGuard],
        data: { roles: ['BOUTIQUE'] }
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
      },
      
      // Gestion des produits (achat + panier ) 
      {
        path: 'produits',
        loadComponent: () => import('./pages/front/product-list/product-list.component')
          .then(m => m.ProductListComponent)
      },
      {
        path: 'produits/:slug',
        loadComponent: () => import('./pages/front/product-detail/product-detail.component')
          .then(m => m.ProductDetailComponent)
      },

      // gestions panier utilisateurs (connecter without guest)
       {
        path: 'panier',
        loadComponent: () => import('./pages/front/panier/panier.component')
          .then(m => m.PanierComponent)
      },
        
      // DÉTAIL BOUTIQUE PUBLIC(client)
      {
        path: 'boutiques/:id',
        loadComponent: () => import('./pages/front/boutique-detail/boutique-detail.component')
          .then(m => m.BoutiqueDetailComponent)
      },

      {
        path: 'commande',
        loadComponent: () => import('./pages/front/customer-orders/customer-orders-registation.component')
          .then(m => m.CommandeComponent),
        canActivate: [authGuard]
      },
      {
        path: 'commande/confirmation/:id',
        loadComponent: () => import('./pages/front/customer-orders/customer-orders-confirmation.component')
          .then(m => m.CommandeConfirmationComponent),
        canActivate: [authGuard]
      },
      
      {
      path: 'mes-commandes',
        loadComponent: () => import('./pages/front/mes-commandes/mes-commandes.component')
          .then(m => m.MesCommandesComponent),
        canActivate: [authGuard]
      },
    ]
  },
  // Redirection 404
  { path: '**', redirectTo: 'connexion' }
];