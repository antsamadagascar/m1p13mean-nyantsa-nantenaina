import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-boutiques',
  standalone: true,
  imports: [CommonModule,RouterModule,FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">
            <i class="fa-solid fa-store mr-2 text-blue-600"></i>
            Gestion des Boutiques
          </h1>
          <p class="text-gray-600">
            Gérez toutes les boutiques de la plateforme
          </p>
        </div>

        <button
          (click)="openModal()"
          class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
          <i class="fa-solid fa-plus"></i>
          Ajouter une boutique
        </button>

      </div>


      <!-- Alert de test -->
      <div class="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
        <div class="flex items-center">
          <i class="fa-solid fa-circle-check text-green-600 text-xl mr-3"></i>
          <div>
            <p class="font-medium text-green-800">
              Accès autorisé - Vous êtes connecté en tant qu'ADMIN
            </p>
            <p class="text-sm text-green-700 mt-1">
              Connecté en tant que : <strong>{{ authService.getUserFullName() }}</strong>
              ({{ authService.getUserRole() }})
            </p>
          </div>
        </div>
      </div>

      <!-- Card de test -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">
          Liste des boutiques
        </h2>

        <div class="space-y-3">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-store text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-medium text-gray-800">Boutique Test 1</h3>
                <p class="text-sm text-gray-500">ID: BOUT001</p>
              </div>
            </div>
            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Active
            </span>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-store text-purple-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-medium text-gray-800">Boutique Test 2</h3>
                <p class="text-sm text-gray-500">ID: BOUT002</p>
              </div>
            </div>
            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Active
            </span>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fa-solid fa-store text-orange-600 text-xl"></i>
              </div>
              <div>
                <h3 class="font-medium text-gray-800">Boutique Test 3</h3>
                <p class="text-sm text-gray-500">ID: BOUT003</p>
              </div>
            </div>
            <span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              Désactivée
            </span>
          </div>
        </div>
      </div>

      <!-- Info test -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800">
          <i class="fa-solid fa-info-circle mr-2"></i>
          <strong>Test de sécurité :</strong> Cette page est protégée par le roleGuard.
          Seuls les utilisateurs avec le rôle ADMIN peuvent y accéder.
        </p>
      </div>
    </div>


<!-- Overlay -->
<div
  *ngIf="isModalOpen"
  class="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center">

  <!-- Modal -->
  <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">

    <!-- Close -->
    <button
      (click)="closeModal()"
      class="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
      <i class="fa-solid fa-xmark text-xl"></i>
    </button>

    <h2 class="text-xl font-semibold mb-6 text-gray-800">
      Créer une boutique
    </h2>

    <!-- Catégorie -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Catégorie principale
      </label>

      <select
        [(ngModel)]="selectedCategorie"
        class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">

        <option value="">-- Sélectionner une catégorie --</option>

        <option
          *ngFor="let cat of categories"
          [value]="cat._id">
          {{ cat.nom }}
        </option>

      </select>
    </div>

    <!-- Bouton -->
    <div class="flex justify-end mt-6">
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
        Continuer
      </button>
    </div>

  </div>
</div>

  `
})
export class BoutiquesComponent implements OnInit {

  isModalOpen = false;
  categories: any[] = [];
  selectedCategorie: string = '';

  constructor(
    public authService: AuthService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    console.log(' Page Boutiques chargée');
    console.log(' Utilisateur:', this.authService.getUserFullName());
    console.log(' Rôle:', this.authService.getUserRole());
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res: any) => {
        console.log('Catégories chargées :', res);
        this.categories = res.data; // ← IMPORTANT : prendre le tableau à l'intérieur de data
      },
      error: (err) => console.error(err)
    });
  }

  openModal() {
    this.isModalOpen = true;
    this.loadCategories();
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
