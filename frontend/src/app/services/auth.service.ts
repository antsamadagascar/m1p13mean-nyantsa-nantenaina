import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, AuthResponse, ConnexionData } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenCheckSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
    // Démarre la vérification automatique du token
    this.startTokenCheck();
  }

  connexion(data: ConnexionData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/connexion`, data)
      .pipe(
        tap(response => {
          if (response.success)
          {
            this.saveAuthData(response.user, response.token);
            // Redémarre la vérification après connexion
            this.startTokenCheck();
          }
        })
      );
  }

  logout(): void {
    this.stopTokenCheck();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/connexion']);
  }

  private saveAuthData(user: User, token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Vérifie si le token n'est pas expiré
    return !this.isTokenExpired(token);
  }

  getUserRole(): string | null {
    const user = this.getUserFromStorage();
    return user ? user.role : null;
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['ADMIN']);
  }

  isBoutique(): boolean {
    return this.hasRole(['BOUTIQUE']);
  }

  isAcheteur(): boolean {
    return this.hasRole(['ACHETEUR']);
  }

  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    const prenom = user.prenom ? user.prenom[0] : '';
    const nom = user.nom ? user.nom[0] : '';
    return (prenom + nom).toUpperCase();
  }

  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    return `${user.prenom} ${user.nom}`;
  }

  // Vérifie si le token est expiré
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Conversion  en millisecondes
      return Date.now() >= expirationTime;
    } catch (error)
    {   console.error('Erreur lors du décodage du token:', error);
      return true; // Si erreur, on considére comme expiré
    }
  }

  // Démarre la vérification automatique du token
  private startTokenCheck(): void {
    // Arrête l'ancien interval s'il existe
    this.stopTokenCheck();

    // Vérifie immédiatement
    this.checkToken();

    //  vérifie toutes les 10 secondes
    this.tokenCheckSubscription = interval(10000).subscribe(() =>
    {   this.checkToken();  });
  }

  // Arrête la vérification automatique
  private stopTokenCheck(): void {
    if (this.tokenCheckSubscription) {
      this.tokenCheckSubscription.unsubscribe();
      this.tokenCheckSubscription = undefined;
    }
  }

  // Vérifie le token et déconnecter si expiré
  private checkToken(): void {
    const token = this.getToken();

    if (token && this.isTokenExpired(token)) {
      console.log('Token expiré - déconnexion automatique');
      alert('Votre session a expiré. Veuillez vous reconnecter.');
      this.logout();
    }
  }


}
