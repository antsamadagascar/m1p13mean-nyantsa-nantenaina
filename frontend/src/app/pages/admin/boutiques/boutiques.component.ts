import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { FormsModule } from '@angular/forms';
import { SousCategorieService } from '../../../services/sous-categorie.service';
import { BoutiqueService } from '../../../services/boutique.service';
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
  class="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center overflow-y-auto p-4">
  <!-- Modal -->
  <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 relative my-8 max-h-[90vh] overflow-y-auto">
    <!-- Close -->
    <button
      (click)="closeModal()"
      class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10">
      <i class="fa-solid fa-xmark text-xl"></i>
    </button>

    <h2 class="text-2xl font-bold mb-6 text-gray-800 sticky top-0 bg-white pb-3 border-b">
      Créer une boutique
    </h2>

    <form #boutiqueForm="ngForm" class="space-y-6">

      <!-- ============================================ -->
      <!-- INFORMATIONS DE BASE -->
      <!-- ============================================ -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <i class="fa-solid fa-store mr-2 text-blue-600"></i>
          Informations de base
        </h3>

        <!-- Nom -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Nom de la boutique <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            [(ngModel)]="boutique.nom"
            name="nom"
            maxlength="255"
            required
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ex: Boutique Mode & Style">
        </div>

        <!-- Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description <span class="text-red-500">*</span>
            <span class="text-xs text-gray-500">(min. 50 caractères)</span>
          </label>
          <textarea
            [(ngModel)]="boutique.description"
            name="description"
            rows="4"
            minlength="50"
            maxlength="2000"
            required
            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder="Décrivez votre boutique (minimum 50 caractères)..."></textarea>
          <div class="text-xs text-gray-500 mt-1 text-right">
            {{ boutique.description?.length || 0 }} / 2000 caractères
          </div>
        </div>

      </div>

      <!-- ============================================ -->
      <!-- GÉRANT -->
      <!-- ============================================ -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <i class="fa-solid fa-user-tie mr-2 text-blue-600"></i>
          Informations du gérant
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nom <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="boutique.gerant.nom"
              name="gerantNom"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nom du gérant">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Prénom <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="boutique.gerant.prenom"
              name="gerantPrenom"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Prénom du gérant">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              [(ngModel)]="boutique.gerant.email"
              name="gerantEmail"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="email@exemple.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Téléphone <span class="text-red-500">*</span>
            </label>
            <input
              type="tel"
              [(ngModel)]="boutique.gerant.telephone"
              name="gerantTelephone"
              pattern="^\+261\s?[0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{3}$"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="+261 XX XXX XX XXX">
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- LOCALISATION -->
      <!-- ============================================ -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <i class="fa-solid fa-location-dot mr-2 text-blue-600"></i>
          Localisation
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Zone <span class="text-red-500">*</span>
            </label>
            <select
              [(ngModel)]="boutique.localisation.zone"
              name="zone"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Sélectionner --</option>
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
              <option value="Zone D">Zone D</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Étage <span class="text-red-500">*</span>
            </label>
            <select
              [(ngModel)]="boutique.localisation.etage"
              name="etage"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Sélectionner --</option>
              <option value="Rez-de-chaussée">Rez-de-chaussée</option>
              <option value="1er étage">1er étage</option>
              <option value="2ème étage">2ème étage</option>
              <option value="3ème étage">3ème étage</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Numéro <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="boutique.localisation.numero"
              name="numero"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ex: B-123">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fa-solid fa-ruler-combined mr-1"></i> Surface (m²)
            </label>
            <input
              type="number"
              [(ngModel)]="boutique.localisation.surface"
              name="surface"
              min="0"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ex: 50">
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- CATÉGORIE & SOUS-CATÉGORIES -->
      <!-- ============================================ -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <i class="fa-solid fa-tags mr-2 text-blue-600"></i>
          Catégorie
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Catégorie principale <span class="text-red-500">*</span>
            </label>
            <select
              [(ngModel)]="selectedCategorie"
              (change)="onCategorieChange()"
              name="categorie"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Sélectionner une catégorie --</option>
              <option *ngFor="let cat of categories" [value]="cat._id">
                {{ cat.nom }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Sous-catégorie
            </label>
            <select
              [(ngModel)]="selectedSousCategorie"
              name="sousCategorie"
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              [disabled]="!sousCategories.length">
              <option value="">-- Sélectionner un sous-produit --</option>
              <option *ngFor="let sub of sousCategories" [value]="sub._id">
                {{ sub.nom }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- CONTACT -->
      <!-- ============================================ -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <i class="fa-solid fa-address-book mr-2 text-blue-600"></i>
          Contact
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fa-solid fa-phone mr-1"></i> Téléphone <span class="text-red-500">*</span>
            </label>
            <input
              type="tel"
              [(ngModel)]="boutique.contact.telephone"
              name="contactTelephone"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="+261 XX XXX XX XXX">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <i class="fa-solid fa-envelope mr-1"></i> Email <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              [(ngModel)]="boutique.contact.email"
              name="contactEmail"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="contact@boutique.com">
          </div>
        </div>
      </div>


      <!-- Boutons -->
      <div class="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t">
        <button
          type="button"
          (click)="closeModal()"
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-lg font-medium transition-colors">
          <i class="fa-solid fa-xmark mr-2"></i> Annuler
        </button>
        <button
          type="button"
          (click)="submitBoutique()"
          [disabled]="!boutiqueForm.valid"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
          <i class="fa-solid fa-check mr-2"></i> Créer la boutique
        </button>
      </div>
    </form>
  </div>
</div>

  `
})
export class BoutiquesComponent implements OnInit {
  isModalOpen = false;
  categories: any[] = [];
  sousCategories: any[] = [];
  selectedCategorie: string = '';
  selectedSousCategorie: string = '';

  boutique = {
    nom: '',
    description: '',
    gerant: {
      nom: '',
      prenom: '',
      email: '',
      telephone: ''
    },
    localisation: {
      zone: '',
      etage: '',
      numero: '',
      surface: null
    },
    contact: {
      telephone: '',
      email: ''
    }
  };

  constructor(
    public authService: AuthService,
    private categoryService: CategoryService,
    private sousCategorieService: SousCategorieService,
    private boutiqueService: BoutiqueService
  ) {}

  ngOnInit() {
    console.log('📍 Page Boutiques chargée');
    console.log('👤 Utilisateur:', this.authService.getUserFullName());
    console.log('🔑 Rôle:', this.authService.getUserRole());
  }


  onCategorieChange() {
    if (!this.selectedCategorie) {
      this.sousCategories = [];
      return;
    }
    this.sousCategorieService.getByCategorie(this.selectedCategorie).subscribe({
      next: (res: any) => {
        console.log('Sous-catégories chargées :', res);
        this.sousCategories = res.data || [];
      },
      error: (err) => console.error(err)
    });
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res: any) => {
        console.log('Catégories chargées :', res);
        this.categories = res.data;
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
    this.resetForm();
  }

  resetForm() {
    this.categories = [];
    this.sousCategories = [];
    this.selectedCategorie = '';
    this.selectedSousCategorie = '';
    this.boutique = {
      nom: '',
      description: '',
      gerant: {
        nom: '',
        prenom: '',
        email: '',
        telephone: ''
      },
      localisation: {
        zone: '',
        etage: '',
        numero: '',
        surface: null
      },
      contact: {
        telephone: '',
        email: ''
      }
    };
  }

  submitBoutique() {
    const data = {
      ...this.boutique,
      categorie: this.selectedCategorie,
      sous_categories: this.selectedSousCategorie ? [this.selectedSousCategorie] : []
    };

    console.log('📤 Envoi:', data);

    this.boutiqueService.createBoutique(data).subscribe({
      next: (response) => {
        console.log('✅ Succès:', response);
        alert('Boutique créée avec succès!');
        this.closeModal();
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        alert('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
      }
    });
  }
}
