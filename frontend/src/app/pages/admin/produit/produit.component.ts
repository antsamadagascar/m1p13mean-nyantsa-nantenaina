import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProduitService } from '../../../services/produit.service';
import { CategoryService } from '../../../services/category.service';
import { SousCategorieService } from '../../../services/sous-categorie.service';
import { AlertService } from '../../../services/alert.service';
@Component({
  selector: 'app-produit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.css']
})
export class ProduitComponent implements OnInit {

  produits: any[] = [];
  produitsFiltered: any[] = [];
  categories: any[] = [];
  sousCategories: any[] = [];

  selectedCategorie: string = '';
  selectedSousCategorie: string = '';

  showCreateModal = false;
  newProduit: any = {
    nom: '',
    reference: '',
    description: '',
    prix: 0,
    prix_promo: null,
    quantite: 0,
    categorie: '',
    sous_categorie: '',
    actif: true,
    images: []
  };


  stats = {
    total: 0,
    actifs: 0,
    stockFaible: 0,
    rupture: 0
  };

  filters = {
    search: '',
    categorie: '',
    sousCategorie: ''
  };

  showStockModal = false;
  selectedProduit: any = null;
  stockQuantite = 0;
  showUpdateModal = false;

  // NOUVEAU : Propriétés pour la gestion d'image
  selectedFile: File | null = null;
  selectedFileName: string = '';
  imagePreview: string | null = null;

  constructor(
    private produitService: ProduitService,
    private categoryService: CategoryService,
    private sousCategorieService: SousCategorieService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadProduits();
    this.loadCategories();
  }

  loadProduits() {
    this.produitService.getMesProduits().subscribe(data => {
      this.produits = data;
      this.produitsFiltered = data;
      this.calculateStats();
    });
  }

  calculateStats() {
    this.stats.total = this.produits.length;
    this.stats.actifs = this.produits.filter(p => p.actif).length;
    this.stats.stockFaible = this.produits.filter(p => p.quantite > 0 && p.quantite <= 5).length;
    this.stats.rupture = this.produits.filter(p => p.quantite === 0).length;
  }

  applyFilters() {
    this.produitsFiltered = this.produits.filter(p => {
      const matchSearch =
        p.nom.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        p.reference.toLowerCase().includes(this.filters.search.toLowerCase());
      const matchCategorie =
        !this.filters.categorie || p.categorie?._id === this.filters.categorie;
      return matchSearch && matchCategorie;
    });
  }

  resetFilters() {
    this.filters = { search: '', categorie: '' ,  sousCategorie: ''};
    this.produitsFiltered = this.produits;
  }

  deleteProduit(id: string) {
    if (confirm('Supprimer ce produit ?')) {
      this.produitService.delete(id).subscribe(() => this.loadProduits());
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newProduit = {};
    this.selectedCategorie = '';
    this.selectedSousCategorie = '';
    this.sousCategories = [];
  }

  // ================================
  // Gestion catégories / sous-catégories
  // ================================
  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data || [];
      },
      error: (err) => console.error('Erreur chargement catégories :', err)
    });
  }

  onCategorieChange() {
    if (!this.selectedCategorie) {
      this.sousCategories = [];
      this.selectedSousCategorie = '';
      return;
    }

    this.sousCategorieService.getByCategorie(this.selectedCategorie).subscribe({
      next: (res: any) => {
        this.sousCategories = res.data || [];
        this.selectedSousCategorie = '';
      },
      error: (err) => console.error('Erreur chargement sous-catégories :', err)
    });
  }

  onCategorieChangeUpdate() {

    if (!this.selectedProduit?.categorie) {
      this.sousCategories = [];
      this.selectedProduit.sous_categorie = '';
      return;
    }

    this.sousCategorieService
      .getByCategorie(this.selectedProduit.categorie)
      .subscribe({
        next: (res: any) => {
          this.sousCategories = res.data || [];
          this.selectedProduit.sous_categorie = '';
        },
        error: (err) => {
          console.error('Erreur chargement sous-catégories :', err);
          this.sousCategories = [];
        }
      });
  }

    // NOUVEAU : Gestion de la sélection d'image
    onImageSelect(event: any) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.selectedFileName = file.name;

        // Créer une prévisualisation
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }

    // NOUVEAU : Supprimer l'image sélectionnée
    removeImage() {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.imagePreview = null;
    }

    createProduit() {
      if (!this.selectedCategorie) {
        this.alertService.error('Veuillez sélectionner une catégorie');
        return;
      }

      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('nom', this.newProduit.nom);
      formData.append('reference', this.newProduit.reference);
      formData.append('description', this.newProduit.description || '');
      formData.append('prix', this.newProduit.prix.toString());
      formData.append('quantite', this.newProduit.quantite.toString());
      formData.append('categorie', this.selectedCategorie);
      formData.append('actif', 'true');

      if (this.selectedSousCategorie) {
        formData.append('sous_categorie', this.selectedSousCategorie);
      }

      if (this.newProduit.prix_promo) {
        formData.append('prix_promo', this.newProduit.prix_promo.toString());
      }

      // Ajouter l'image si elle est sélectionnée
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      this.produitService.create(formData).subscribe({
        next: () => {
          this.alertService.success('Produit créé avec succès !');
          this.loadProduits();
          this.resetForm();
          this.closeCreateModal();
        },
        error: (error) => {
          this.alertService.error(
            'Erreur: ' + (error.error?.message || 'Erreur inconnue')
          );
        }
      });
    }

  resetForm() {
    this.newProduit = {
      nom: '',
      reference: '',
      description: '',
      prix: 0,
      quantite: 0,
      actif: true
    };

    this.selectedCategorie = '';
    this.selectedSousCategorie = '';
  }


openStockModal(produit: any) {
  this.selectedProduit = produit;
  this.showStockModal = true;
}

closeStockModal() {
  this.showStockModal = false;
  this.stockQuantite = 0;
}

addStock() {
  if (this.stockQuantite <= 0) return;

  this.produitService.addStock(this.selectedProduit._id, this.stockQuantite)
  .subscribe({
    next: () => {
      this.loadProduits();
      this.closeStockModal();
      this.alertService.success("Stock ajouté avec succès !");
    },
    error: (error) => this.alertService.error('Erreur: ' + (error.error?.message || 'Erreur inconnue'))
  });

}

openUpdateModal(produit: any) {

  this.selectedProduit = { ...produit };

  // Convertir objet → string ID
  const categorieId = produit.categorie?._id || produit.categorie;
  const sousCategorieId = produit.sous_categorie?._id || produit.sous_categorie;

  this.selectedProduit.categorie = categorieId;

  this.showUpdateModal = true;

  // Charger les sous-catégories puis appliquer la valeur
  this.sousCategorieService.getByCategorie(categorieId).subscribe({
    next: (res: any) => {
      this.sousCategories = res.data || [];

      // ⚠️ IMPORTANT : assigner après chargement
      this.selectedProduit.sous_categorie = sousCategorieId;
    },
    error: () => {
      this.sousCategories = [];
    }
  });
}



closeUpdateModal() {
  this.showUpdateModal = false;
  this.selectedProduit = null;
}

updateProduit() {
  console.log(this.selectedProduit);
  if (!this.selectedProduit) return;

  this.produitService.update(this.selectedProduit._id, this.selectedProduit).subscribe({
    next: (res) => {
      this.loadProduits();
      this.showUpdateModal = false;
      this.alertService.success("Produit mis à jour avec succès !");
    },
    error: (error) => {
      console.error(error);
      this.alertService.error('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
    }
  });
}
}
