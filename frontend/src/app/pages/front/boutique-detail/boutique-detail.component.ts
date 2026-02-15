import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BoutiqueService } from '../../../services/boutique.service';
import { ProductService } from '../../../services/produit.service';
import { Boutique } from '../../../models/boutique.model';
import { Produit } from '../../../models/produit.model';

@Component({
  selector: 'app-boutique-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './boutique-detail.component.html',
  styleUrls: ['./boutique-detail.component.css']
})

export class BoutiqueDetailComponent implements OnInit, OnDestroy {
  boutique: Boutique | null = null;
  produits: Produit[] = [];
  
  loading = true;
  loadingProduits = true;
  error: string | null = null;
  
  // Pagination produits
  page = 1;
  limite = 12;
  totalProduits = 0;
  totalPages = 0;
  
  // Filtres produits de la boutique
  triProduits = 'nouveaute';
  
  // Gestion des onglets
  ongletActif: 'produits' | 'apropos' | 'horaires' = 'produits';
  
  // Ordre des jours pour l'affichage
  joursOrdre = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private boutiqueService: BoutiqueService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.chargerBoutique(id);
        this.chargerProduitsBoutique(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Change l'onglet actif
   */
  changerOnglet(onglet: 'produits' | 'apropos' | 'horaires'): void {
    this.ongletActif = onglet;
  }

  /**
   * Vérifie si c'est aujourd'hui
   */
  estAujourdhui(jour: string): boolean {
    const maintenant = new Date();
    const jourActuel = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][maintenant.getDay()];
    return jour === jourActuel;
  }

  /**
   * Charge les détails de la boutique
   */
  chargerBoutique(id: string): void {
    this.loading = true;
    this.error = null;

    this.boutiqueService.getBoutiqueById(id).subscribe({
      next: (boutique) => {
        this.boutique = boutique;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement boutique:', err);
        this.error = 'Boutique introuvable';
        this.loading = false;
      }
    });
  }

  /**
   * Charge les produits de la boutique
   */
  chargerProduitsBoutique(boutiqueId: string): void {
    this.loadingProduits = true;

    this.productService.getProduits({
      boutique: boutiqueId,
      tri: this.triProduits,
      page: this.page,
      limite: this.limite
    }).subscribe({
      next: (resultats) => {
        this.produits = resultats.produits;
        this.totalProduits = resultats.total;
        this.totalPages = resultats.pages;
        this.loadingProduits = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.loadingProduits = false;
      }
    });
  }

  /**
   * Change le tri des produits
   */
  changerTri(tri: string): void {
    this.triProduits = tri;
    this.page = 1;
    if (this.boutique) {
      this.chargerProduitsBoutique(this.boutique._id);
    }
  }

  /**
   * Gère le changement de tri depuis le select
   */
  onTriChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.changerTri(target.value);
  }

  /**
   * Change de page
   */
  changerPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.page = page;
    if (this.boutique) {
      this.chargerProduitsBoutique(this.boutique._id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Vérifie si la boutique est ouverte
   */
  estOuverte(): boolean {
    if (!this.boutique || !this.boutique.horaires) {
      return false;
    }
    
    const maintenant = new Date();
    const jour = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][maintenant.getDay()];
    const horaire = this.boutique.horaires[jour];
    
    if (!horaire || !horaire.ouvert) {
      return false;
    }
    
    const heureActuelle = maintenant.getHours() * 60 + maintenant.getMinutes();
    const [heureDebut, minDebut] = horaire.debut.split(':').map(Number);
    const [heureFin, minFin] = horaire.fin.split(':').map(Number);
    
    const debut = heureDebut * 60 + minDebut;
    const fin = heureFin * 60 + minFin;
    
    return heureActuelle >= debut && heureActuelle <= fin;
  }

  /**
   * Obtient le message de statut de la boutique
   */
  getStatutMessage(): string {
    if (!this.boutique || !this.boutique.horaires) {
      return 'Chargement...';
    }
    
    if (this.estOuverte()) {
      return 'Ouverte maintenant';
    }
    
    const maintenant = new Date();
    const jourActuel = maintenant.getDay();
    
    for (let i = 0; i < 7; i++) {
      const jour = (jourActuel + i) % 7;
      const nomJour = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][jour];
      const horaire = this.boutique.horaires[nomJour];
      
      if (horaire && horaire.ouvert) {
        if (i === 0) {
          return `Ouvre aujourd'hui à ${horaire.debut}`;
        } else if (i === 1) {
          return `Ouvre demain à ${horaire.debut}`;
        } else {
          return `Ouvre ${nomJour} à ${horaire.debut}`;
        }
      }
    }
    
    return 'Fermée';
  }

  /**
   * Vérifie si un produit peut être acheté
   */
  peutAcheter(produit: Produit): boolean {
    return this.estOuverte() && !produit.en_rupture;
  }

  /**
   * Obtient le message pour le bouton d'achat
   */
  getMessageAchat(produit: Produit): string {
    if (!this.estOuverte()) {
      return 'Boutique fermée';
    }
    if (produit.en_rupture) {
      return 'Rupture de stock';
    }
    return 'Ajouter au panier';
  }

  /**
   * Obtient l'image principale d'un produit
   */
  getImagePrincipale(produit: Produit): string {
    const imagePrincipale = produit.images.find(img => img.principale);
    return imagePrincipale?.url || produit.images[0]?.url || 'assets/images/placeholder-product.png';
  }

  /**
   * Formate le prix
   */
  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix);
  }

  /**
   * Obtient le nom de la catégorie
   */
  getCategorieNom(): string {
    if (!this.boutique?.categorie) return '';
    return typeof this.boutique.categorie === 'string' 
      ? this.boutique.categorie 
      : this.boutique.categorie.nom;
  }

  /**
   * Obtient le nom de la zone de manière sûre
   */
  getZoneNom(): string {
    if (!this.boutique?.localisation?.zone) {
      return 'Non renseignée';
    }
    
    // Si c'est un objet Zone avec un nom
    if (typeof this.boutique.localisation.zone === 'object' && this.boutique.localisation.zone.nom) {
      return this.boutique.localisation.zone.nom;
    }
    
    // Si c'est une string (ID non-populé)
    if (typeof this.boutique.localisation.zone === 'string') {
      return 'Zone ID: ' + this.boutique.localisation.zone;
    }
    
    return 'Non définie';
  }

  /**
   * Obtient les horaires du jour
   */
  getHorairesAujourdhui(): string {
    if (!this.boutique || !this.boutique.horaires) {
      return 'Chargement...';
    }
    
    const maintenant = new Date();
    const jour = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][maintenant.getDay()];
    const horaire = this.boutique.horaires[jour];
    
    if (!horaire || !horaire.ouvert) {
      return 'Fermé aujourd\'hui';
    }
    
    return `${horaire.debut} - ${horaire.fin}`;
  }

  /**
   * Navigation vers détail produit
   */
  voirProduit(slug: string): void {
    this.router.navigate(['/produits', slug]);
  }

  /**
   * Génère tableau des pages
   */
  getPagesArray(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.page - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}