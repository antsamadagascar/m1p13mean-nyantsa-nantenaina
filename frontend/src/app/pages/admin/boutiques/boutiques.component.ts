import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-boutiques',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fa-solid fa-store mr-2 text-blue-600"></i>
          Gestion des Boutiques
        </h1>
        <p class="text-gray-600">
          Gérez toutes les boutiques de la plateforme
        </p>
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
  `
})
export class BoutiquesComponent implements OnInit {
  
  constructor(public authService: AuthService) {}

  ngOnInit() {
    console.log(' Page Boutiques chargée');
    console.log(' Utilisateur:', this.authService.getUserFullName());
    console.log(' Rôle:', this.authService.getUserRole());
  }
}