import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  connexion(data: ConnexionData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/connexion`, data)
      .pipe(
        tap(response => {
          if (response.success) {
            this.saveAuthData(response.user, response.token);
          }
        })
      );
  }

  logout(): void {
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
    return !!this.getToken();
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
}