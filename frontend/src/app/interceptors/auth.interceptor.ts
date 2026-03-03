import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    // Vérifie si le token est expiré AVANT d'envoyer la requête
    if (authService.isTokenExpired(token)) 
    {  authService.logout();  return throwError(() => new Error('Session expirée')); }

    const clonedReq = req.clone({  headers: req.headers.set('Authorization', `Bearer ${token}`) });

    // Gére les erreurs 401 du serveur
    return next(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {   authService.logout();  }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};