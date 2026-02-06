import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const allowedRoles = route.data['roles'] as string[];
  
  if (authService.hasRole(allowedRoles)) {
    return true;
  }

  const userRole = authService.getUserRole();
  if (userRole === 'ADMIN') router.navigate(['/admin']);
  else if (userRole === 'BOUTIQUE') router.navigate(['/boutique']);
  else router.navigate(['/']);
  
  return false;
};