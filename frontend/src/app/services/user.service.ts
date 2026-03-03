import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: 'ADMIN' | 'BOUTIQUE' | 'ACHETEUR';
  actif: boolean;
  emailVerifie: boolean;
  dateInscription: Date;
  derniereConnexion?: Date;
  avatar?: string;
  boutiqueId?: any;
  dateSuspension?: Date;
  raisonSuspension?: string;
  suspenduPar?: any;
  dateReactivation?: Date;
  reactivePar?: any;
}

export interface UserFilters {
  role?: string;
  actif?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserResponse {
  success: boolean;
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  stats: {
    totalUsers: number;
    totalActifs: number;
    totalSuspendus: number;
    totalAcheteurs: number;
    totalBoutiques: number;
    totalAdmins: number;
  };
}

export interface UserDetailResponse {
  success: boolean;
  data: User;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: User;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(filters: UserFilters = {}): Observable<UserResponse> {
    let params = new HttpParams();
    
    if (filters.role) params = params.set('role', filters.role);
    if (filters.actif !== undefined) params = params.set('actif', filters.actif);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    
    return this.http.get<UserResponse>(this.apiUrl, { params });
  }

  getUserById(id: string): Observable<UserDetailResponse> {
    return this.http.get<UserDetailResponse>(`${this.apiUrl}/${id}`);
  }

  suspendUser(id: string, raison: string): Observable<ActionResponse> {
    return this.http.patch<ActionResponse>(`${this.apiUrl}/${id}/suspend`, { raison });
  }

  activateUser(id: string): Observable<ActionResponse> {
    return this.http.patch<ActionResponse>(`${this.apiUrl}/${id}/activate`, {});
  }

  deleteUser(id: string): Observable<ActionResponse> {
    return this.http.delete<ActionResponse>(`${this.apiUrl}/${id}`);
  }


  getUserStatusLabel(user: User): { label: string; class: string } {
    if (!user.actif) {
      return { label: 'Suspendu', class: 'badge-danger' };
    }
    if (!user.emailVerifie) {
      return { label: 'Email non vérifié', class: 'badge-warning' };
    }
    return { label: 'Actif', class: 'badge-success' };
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'BOUTIQUE': 'Boutique',
      'ACHETEUR': 'Acheteur'
    };
    return labels[role] || role;
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'ADMIN': 'danger',
      'BOUTIQUE': 'primary',
      'ACHETEUR': 'success'
    };
    return colors[role] || 'secondary';
  }

  registerGerant(data: {
      boutiqueId: string;
      nom: string;
      prenom: string;
      email: string;
      password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-gerant`, data);
  }
  
}