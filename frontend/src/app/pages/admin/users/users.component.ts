import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, User, UserFilters } from '../../../services/user.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  
  // Filtres
  filters: UserFilters = {
    role: 'ALL',
    actif: 'ALL',
    search: '',
    page: 1,
    limit: 10
  };
  
  // Pagination
  totalUsers = 0;
  totalPages = 0;
  
  // Statistiques
  stats = {
    totalUsers: 0,
    totalActifs: 0,
    totalSuspendus: 0,
    totalAcheteurs: 0,
    totalBoutiques: 0,
    totalAdmins: 0
  };
  
  // Modal de suspension
  showSuspendModal = false;
  selectedUser: User | null = null;
  suspensionRaison = '';
  
  // Modal de confirmation
  showDeleteModal = false;
  userToDelete: User | null = null;

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    
    this.userService.getAllUsers(this.filters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalUsers = response.pagination.total;
        this.totalPages = response.pagination.pages;
        this.stats = response.stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.alertService.error('Erreur lors du chargement des utilisateurs');
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadUsers();
  }

  onSearchChange() {
    if (this.filters.search === '' || (this.filters.search && this.filters.search.length >= 2)) {
      this.filters.page = 1;
      this.loadUsers();
    }
  }

  clearSearch() {
    this.filters.search = '';
    this.onFilterChange();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.filters.page = page;
      this.loadUsers();
    }
  }

  openSuspendModal(user: User) {
    this.selectedUser = user;
    this.suspensionRaison = '';
    this.showSuspendModal = true;
  }

  closeSuspendModal() {
    this.showSuspendModal = false;
    this.selectedUser = null;
    this.suspensionRaison = '';
  }

  confirmSuspend() {
    if (!this.selectedUser || !this.suspensionRaison.trim()) {
      this.alertService.error('Veuillez indiquer une raison de suspension');
      return;
    }
    
    this.userService.suspendUser(this.selectedUser._id, this.suspensionRaison).subscribe({
      next: (response) => {
        this.alertService.success(response.message);
        this.closeSuspendModal();
        this.loadUsers();
      },
      error: (error) => {
        this.alertService.error(error.error?.message || 'Erreur lors de la suspension');
      }
    });
  }

  activateUser(user: User) {
    if (!confirm(`Êtes-vous sûr de vouloir réactiver ${user.prenom} ${user.nom} ?`)) {
      return;
    }
    
    this.userService.activateUser(user._id).subscribe({
      next: (response) => {
        this.alertService.success(response.message);
        this.loadUsers();
      },
      error: (error) => {
        this.alertService.error(error.error?.message || 'Erreur lors de l\'activation');
      }
    });
  }

  openDeleteModal(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    
    this.userService.deleteUser(this.userToDelete._id).subscribe({
      next: (response) => {
        this.alertService.success(response.message);
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (error) => {
        this.alertService.error(error.error?.message || 'Erreur lors de la suppression');
      }
    });
  }

  viewUserDetail(user: User) {
    this.router.navigate(['/backoffice/users', user._id]);
  }

  getStatusLabel(user: User) {
    return this.userService.getUserStatusLabel(user);
  }

  getRoleLabel(role: string) {
    return this.userService.getRoleLabel(role);
  }

  getRoleColor(role: string) {
    return this.userService.getRoleColor(role);
  }

  get paginationArray(): number[] {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];
    let l: number | undefined;

    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= (this.filters.page || 1) - delta && i <= (this.filters.page || 1) + delta)) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push(-1);
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }
}