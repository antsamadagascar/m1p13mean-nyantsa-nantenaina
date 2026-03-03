import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const alertService = inject(AlertService);

  const allowedRoles = route.data['roles'] as string[];
  const userRole = authService.getUserRole();

  // Vérifie si l'utilisateur a le bon rôle
  if (authService.hasRole(allowedRoles))
  {    return true; }

  alertService.error(`Accès refusé. Cette page est réservée aux : ${allowedRoles.join(', ')}`);

  // Redirection selon le rôle
  if (userRole === 'ADMIN' || userRole === 'BOUTIQUE') {
    router.navigate(['/backoffice']);
  } else {
    router.navigate(['/']);
  }

  return false;
};
