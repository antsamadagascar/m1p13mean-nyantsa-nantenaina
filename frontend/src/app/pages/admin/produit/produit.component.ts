import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../services/produit.service';
import { CategoryService } from '../../../services/category.service';
import { SousCategorieService } from '../../../services/sous-categorie.service';
import { AlertService } from '../../../services/alert.service';
// import { environment } from '../../../environments/environment';

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
    description_courte: '',
    marque: '',
    prix: 0,
    prix_promo: null,
    quantite: 0,
    stock_minimum: 0,
    categorie: '',
    sous_categorie: '',
    condition: 'NEUF',
    tags: [],
    caracteristiques: []
  };

  // Options pour les selects
  statutOptions = ['BROUILLON', 'ACTIF', 'RUPTURE', 'ARCHIVE'];
  conditionOptions = ['NEUF', 'OCCASION', 'RECONDITIONNE'];

  stats = {
    total: 0,
    actifs: 0,
    stockFaible: 0,
    rupture: 0
  };

  filters = {
    search: '',
    categorie: '',
    sousCategorie: '',
    statut: '',
    condition: ''
  };

  showStockModal = false;
  selectedProduit: any = null;
  stockQuantite = 0;
  showUpdateModal = false;

  // Gestion d'image
  selectedFile: File | null = null;
  selectedFileName: string = '';
  imagePreview: string | null = null;

  // Gestion des tags
  tagsInput: string = '';

  showDeleteModal = false;
  produitToDelete: any = null;
  deleteMotif: string = '';

  private apiBaseUrl = 'http://localhost:5000';

  constructor(
    private produitService: ProductService,
    private categoryService: CategoryService,
    private sousCategorieService: SousCategorieService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadProduits();
    this.loadCategories();
  }

  loadProduits() {
    this.produitService.getMesProduits().subscribe({
      next: (data) => {
        this.produits = data;
        this.produitsFiltered = data;
        this.calculateStats();
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.alertService.error('Erreur lors du chargement des produits');
      }
    });
  }

  openDeleteModal(produit: any) {
    this.produitToDelete = { ...produit };
    this.deleteMotif = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.produitToDelete = null;
    this.deleteMotif = '';
  }


  confirmDelete() {
    if (!this.produitToDelete) return;

    this.produitService.softDelete(this.produitToDelete._id, this.deleteMotif).subscribe({
      next: () => {
        this.alertService.success('Produit supprimé avec succès');
        this.loadProduits();
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Erreur suppression:', error);
        this.alertService.error('Erreur lors de la suppression: ' + (error.error?.message || 'Erreur inconnue'));
      }
    });
  }

  calculateStats() {
    this.stats.total = this.produits.length;
    this.stats.actifs = this.produits.filter(p => p.statut === 'ACTIF').length;
    this.stats.stockFaible = this.produits.filter(p =>
      p.quantite > 0 && p.quantite <= (p.stock_minimum || 5)
    ).length;
    this.stats.rupture = this.produits.filter(p => p.quantite === 0).length;
  }

  applyFilters() {
    this.produitsFiltered = this.produits.filter(p => {
      const matchSearch = !this.filters.search ||
        p.nom.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        p.reference.toLowerCase().includes(this.filters.search.toLowerCase());

      const matchCategorie = !this.filters.categorie ||
        p.categorie?._id === this.filters.categorie;

      const matchStatut = !this.filters.statut ||
        p.statut === this.filters.statut;

      const matchCondition = !this.filters.condition ||
        p.condition === this.filters.condition;

      return matchSearch && matchCategorie && matchStatut && matchCondition;
    });
  }

  resetFilters() {
    this.filters = {
      search: '',
      categorie: '',
      sousCategorie: '',
      statut: '',
      condition: ''
    };
    this.produitsFiltered = this.produits;
  }

  deleteProduit(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.produitService.softDelete(id).subscribe({
        next: () => {
          this.alertService.success('Produit supprimé avec succès');
          this.loadProduits();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.alertService.error('Erreur lors de la suppression du produit');
        }
      });
    }
  }

  // ================================
  // GESTION MODALES
  // ================================
  openCreateModal() {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetForm();
  }

  // ================================
  // CATÉGORIES / SOUS-CATÉGORIES
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
      error: (err) => {
        console.error('Erreur chargement sous-catégories :', err);
        this.sousCategories = [];
      }
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
        },
        error: (err) => {
          console.error('Erreur chargement sous-catégories :', err);
          this.sousCategories = [];
        }
      });
  }

  // ================================
  // GESTION IMAGES
  // ================================
  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.alertService.error('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error('L\'image ne doit pas dépasser 5MB');
        return;
      }

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

  removeImage() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.imagePreview = null;
  }

  getImageUrl(image: any): string {
    if (!image) return '';

    const url = typeof image === 'string' ? image : image.url;

    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${this.apiBaseUrl}/${cleanPath}`;
  }

  getMainImage(produit: any): string {
    if (!produit.images || produit.images.length === 0) {
      return '';
    }

    // Chercher l'image principale
    const mainImage = produit.images.find((img: any) => img.principale);
    return mainImage ? this.getImageUrl(mainImage) : this.getImageUrl(produit.images[0]);
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
    const placeholder = event.target.parentElement?.querySelector('.no-image-placeholder');
    if (placeholder) {
      placeholder.classList.remove('hidden');
    }
  }

  // ================================
  // GESTION TAGS
  // ================================
  onTagsChange() {
    if (this.tagsInput) {
      this.newProduit.tags = this.tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    } else {
      this.newProduit.tags = [];
    }
  }

  removeTag(tag: string) {
    this.newProduit.tags = this.newProduit.tags.filter((t: string) => t !== tag);
    this.tagsInput = this.newProduit.tags.join(', ');
  }

  // ================================
  // CRÉATION PRODUIT
  // ================================
  createProduit() {
    // Validation catégorie
    if (!this.selectedCategorie) {
      this.alertService.error('Veuillez sélectionner une catégorie');
      return;
    }

    // Validation des champs obligatoires
    if (!this.newProduit.nom || !this.newProduit.reference || !this.newProduit.prix) {
      this.alertService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation variantes si mode VARIANTES activé
    if (this.newProduit.gestion_stock === 'VARIANTES') {
      if (!this.newProduit.variantes || this.newProduit.variantes.length === 0) {
        this.alertService.error('Veuillez ajouter au moins une variante');
        return;
      }
      // Vérifier que chaque variante a un stock
      const variantesInvalides = this.newProduit.variantes.filter(
        (v: any) => v.quantite === null || v.quantite === undefined || v.quantite < 0
      );
      if (variantesInvalides.length > 0) {
        this.alertService.error('Veuillez renseigner le stock de chaque variante');
        return;
      }
    }

    // Validation caractéristiques (nom et valeur obligatoires)
    const caracsInvalides = (this.newProduit.caracteristiques || []).filter(
      (c: any) => (c.nom && !c.valeur) || (!c.nom && c.valeur)
    );
    if (caracsInvalides.length > 0) {
      this.alertService.error('Chaque caractéristique doit avoir un nom et une valeur');
      return;
    }

    const formData = new FormData();

    // ── Informations de base ──────────────────────────
    formData.append('nom',               this.newProduit.nom);
    formData.append('reference',         this.newProduit.reference);
    formData.append('description',       this.newProduit.description       || '');
    formData.append('description_courte',this.newProduit.description_courte || '');
    formData.append('marque',            this.newProduit.marque             || '');

    // ── Prix & Stock ─────────────────────────────────
    formData.append('prix',          this.newProduit.prix.toString());
    formData.append('quantite',      this.newProduit.quantite.toString());
    formData.append('stock_minimum', this.newProduit.stock_minimum?.toString() || '0');
    formData.append('gestion_stock', this.newProduit.gestion_stock || 'SIMPLE');

    if (this.newProduit.prix_promo) {
      formData.append('prix_promo', this.newProduit.prix_promo.toString());
    }

    // ── Catégorisation ───────────────────────────────
    formData.append('categorie', this.selectedCategorie);
    formData.append('condition', this.newProduit.condition || 'NEUF');

    if (this.selectedSousCategorie) {
      formData.append('sous_categorie', this.selectedSousCategorie);
    }

    // ── Tags ─────────────────────────────────────────
    if (this.newProduit.tags && this.newProduit.tags.length > 0) {
      formData.append('tags', JSON.stringify(this.newProduit.tags));
    }

    // ── Caractéristiques ─────────────────────────────
    const caracsFiltrees = (this.newProduit.caracteristiques || [])
      .filter((c: any) => c.nom?.trim() && c.valeur?.trim())
      .map((c: any, index: number) => ({
        nom:    c.nom.trim(),
        valeur: c.valeur.trim(),
        unite:  c.unite?.trim() || '',
        ordre:  index
      }));

    if (caracsFiltrees.length > 0) {
      formData.append('caracteristiques', JSON.stringify(caracsFiltrees));
    }

    // ── Variantes ────────────────────────────────────
    if (this.newProduit.gestion_stock === 'VARIANTES' && this.newProduit.variantes?.length > 0) {
      const variantesFiltrees = this.newProduit.variantes.map((v: any) => ({
        nom:             v.nom?.trim()  || '',
        sku:             v.sku?.trim()  || '',
        prix_supplement: Number(v.prix_supplement) || 0,
        quantite:        Number(v.quantite)         || 0,
        attributs: (v.attributs || [])
          .filter((a: any) => a.nom?.trim() && a.valeur?.trim())
          .map((a: any) => ({
            nom:    a.nom.trim(),
            valeur: a.valeur.trim()
          }))
      }));

      formData.append('variantes', JSON.stringify(variantesFiltrees));
    }

    // ── Image ────────────────────────────────────────
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    // ── Envoi ────────────────────────────────────────
    this.produitService.create(formData).subscribe({
      next: () => {
        this.alertService.success('Produit créé avec succès !');
        this.loadProduits();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Erreur création:', error);
        this.alertService.error(
          'Erreur: ' + (error.error?.message || 'Erreur inconnue')
        );
      }
    });
  }
  // ================================
  // MISE À JOUR PRODUIT
  // ================================
  openUpdateModal(produit: any) {
    this.selectedProduit = { ...produit };

    const categorieId = produit.categorie?._id || produit.categorie;
    const sousCategorieId = produit.sous_categorie?._id || produit.sous_categorie;

    this.selectedProduit.categorie = categorieId;
    this.showUpdateModal = true;

    // Charger les tags dans l'input
    if (this.selectedProduit.tags && this.selectedProduit.tags.length > 0) {
      this.tagsInput = this.selectedProduit.tags.join(', ');
    }

    this.sousCategorieService.getByCategorie(categorieId).subscribe({
      next: (res: any) => {
        this.sousCategories = res.data || [];
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
    this.tagsInput = '';
    this.removeImage();
  }

  updateProduit() {
    if (!this.selectedProduit) {
      console.log('❌ Aucun produit sélectionné');
      return;
    }

    console.log('📝 Produit à mettre à jour:', this.selectedProduit);

    // Validation
    if (!this.selectedProduit.nom || !this.selectedProduit.reference || !this.selectedProduit.prix) {
      this.alertService.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.selectedProduit.nom);
    formData.append('reference', this.selectedProduit.reference);
    formData.append('description', this.selectedProduit.description || '');
    formData.append('description_courte', this.selectedProduit.description_courte || '');
    formData.append('marque', this.selectedProduit.marque || '');
    formData.append('prix', this.selectedProduit.prix.toString());
    formData.append('stock_minimum', this.selectedProduit.stock_minimum?.toString() || '0');
    formData.append('categorie', this.selectedProduit.categorie);
    // formData.append('statut', this.selectedProduit.statut || 'ACTIF');
    formData.append('condition', this.selectedProduit.condition || 'NEUF');

    if (this.selectedProduit.sous_categorie) {
      formData.append('sous_categorie', this.selectedProduit.sous_categorie);
    }

    if (this.selectedProduit.prix_promo) {
      formData.append('prix_promo', this.selectedProduit.prix_promo.toString());
    }

    if (this.selectedProduit.tags && this.selectedProduit.tags.length > 0) {
      formData.append('tags', JSON.stringify(this.selectedProduit.tags));
    }

    if (this.selectedFile) {
      console.log('📎 Ajout fichier:', this.selectedFile.name);
      formData.append('image', this.selectedFile);
    }

    // Log du FormData (pour debug)
    console.log('📦 FormData préparé:');
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value);
    });

    console.log('🚀 Envoi de la requête PUT...');

    this.produitService.update(this.selectedProduit._id, formData).subscribe({
      next: (response) => {
        console.log('✅ Réponse serveur:', response);
        this.alertService.success('Produit mis à jour avec succès !');
        this.loadProduits();
        this.closeUpdateModal();
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error object:', error.error);

        // Afficher le message d'erreur du serveur si disponible
        const errorMessage = error.error?.message || error.message || 'Erreur inconnue';
        this.alertService.error('Erreur: ' + errorMessage);
      }
    });
  }

  // ================================
  // GESTION STOCK
  // ================================
  openStockModal(produit: any) {
    this.selectedProduit = produit;
    this.stockQuantite = 0;
    this.showStockModal = true;
  }

  closeStockModal() {
    this.showStockModal = false;
    this.selectedProduit = null;
    this.stockQuantite = 0;
  }


  addStock() {
    if (!this.stockQuantite || this.stockQuantite <= 0) {
      this.alertService.error('La quantité doit être supérieure à 0');
      return;
    }

    this.produitService.addStock(this.selectedProduit._id, this.stockQuantite)
      .subscribe({
        next: () => {
          this.loadProduits();
          this.closeStockModal();
          this.alertService.success('Stock ajouté avec succès !');
        },
        error: (error) => {
          console.error('Erreur ajout stock:', error);
          this.alertService.error('Erreur: ' + (error.error?.message || 'Erreur inconnue'));
        }
      });
  }

  // ================================
  // RESET FORM
  // ================================
  resetForm() {
    this.newProduit = {
      nom: '',
      reference: '',
      description: '',
      description_courte: '',
      marque: '',
      prix: 0,
      prix_promo: null,
      quantite: 0,
      stock_minimum: 0,
      statut: 'ACTIF',
      condition: 'NEUF',
      tags: [],
      caracteristiques: []
    };

    this.selectedCategorie = '';
    this.selectedSousCategorie = '';
    this.sousCategories = [];
    this.tagsInput = '';
    this.removeImage();
  }

  addCaracteristique() {
    const target = this.showUpdateModal ? this.selectedProduit : this.newProduit;
    if (!target.caracteristiques) target.caracteristiques = [];
    target.caracteristiques.push({
      nom: '',
      valeur: '',
      unite: '',
      ordre: target.caracteristiques.length
    });
  }

  removeCaracteristique(index: number) {
    const target = this.showUpdateModal ? this.selectedProduit : this.newProduit;
    target.caracteristiques.splice(index, 1);
    // Réordonner
    target.caracteristiques.forEach((c: any, i: number) => c.ordre = i);
  }

  // ================================
  // GESTION VARIANTES
  // ================================

  toggleGestionStock() {
    const target = this.showUpdateModal ? this.selectedProduit : this.newProduit;
    target.gestion_stock = target.gestion_stock === 'VARIANTES' ? 'SIMPLE' : 'VARIANTES';
    if (target.gestion_stock === 'VARIANTES' && (!target.variantes || target.variantes.length === 0)) {
      target.variantes = [];
      this.addVariante(); // Ajouter une première variante automatiquement
    }
  }

  addVariante() {
    const target = this.showUpdateModal ? this.selectedProduit : this.newProduit;
    if (!target.variantes) target.variantes = [];
    target.variantes.push({
      nom: '',
      sku: '',
      attributs: [],
      prix_supplement: 0,
      quantite: 0,
      image: ''
    });
  }

  removeVariante(index: number) {
    const target = this.showUpdateModal ? this.selectedProduit : this.newProduit;
    target.variantes.splice(index, 1);
  }

  addAttribut(varianteIndex: number) {
    const target = this.showUpdateModal ? this.selectedProduit : this.newProduit;
    if (!target.variantes[varianteIndex].attributs) {
      target.variantes[varianteIndex].attributs = [];
    }
    target.variantes[varianteIndex].attributs.push({ nom: '', valeur: '' });
  }

  removeAttribut(varianteIndex: number, attributIndex: number) {
    const target = this.showUpdateModal ? this.selectedProduit : this.newProduit;
    target.variantes[varianteIndex].attributs.splice(attributIndex, 1);
  }

}
