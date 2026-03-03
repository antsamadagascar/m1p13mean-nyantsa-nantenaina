import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PanierService, Panier } from '../../../services/panier.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-commande',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './customer-orders-registration.component.html',
  styleUrls: ['./customer-orders-registration.component.css']
})
export class CommandeComponent implements OnInit {
  panier: Panier | null = null;
  loading = true;
  submitting = false;
  error: string | null = null;
  utilisateur: any = null;

  adresseForm: FormGroup;
    telephoneMalgacheValidator = (control: any) => {
    if (!control.value) return null;
    const clean = control.value.replace(/[\s\-]/g, '');
    const regex = /^(032|033|034|037|038)\d{7}$/;
    return regex.test(clean) ? null : { telephoneInvalide: true };
  }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private panierService: PanierService
  ) {
    
    this.adresseForm = this.fb.group({
      nom:       ['', [Validators.required, Validators.minLength(3)]],
      telephone: ['', [Validators.required, this.telephoneMalgacheValidator]],
      adresse:   ['', [Validators.required, Validators.minLength(5)]],  
      ville: [{ value: 'Antananarivo', disabled: true }, Validators.required],
    });
  }

  ngOnInit(): void {
    // Charger l'utilisateur connecté ET le panier en parallèle
    this.chargerUtilisateur();
    this.chargerPanier();
  }

  // ============================================
  // CHARGEMENT UTILISATEUR
  // ============================================

  chargerUtilisateur(): void {
    this.http.get<any>(`${environment.apiUrl}/api/auth/me`).subscribe({
      next: (res) => {
        const user = res.user || res;
        this.utilisateur = user;

        const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ');

        this.adresseForm.patchValue({
          nom:       nomComplet      || '',
          telephone: user.telephone  || '',  
          adresse:   user.adresse    || '',  
        });
        this.adresseForm.get('ville')?.setValue('Antananarivo');
      },
      error: (err) => {
        console.error('Erreur chargement utilisateur:', err);
      }
    });
  }

  // ============================================
  // CHARGEMENT PANIER
  // ============================================

  chargerPanier(): void {
    this.loading = true;
    this.panierService.getPanier().subscribe({
      next: (panier) => {
        this.panier = panier;
        this.loading = false;
        if (!panier || panier.articles.length === 0) {
          this.router.navigate(['/panier']);
        }
      },
      error: () => {
        this.error = 'Impossible de charger le panier';
        this.loading = false;
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  getPrixUnitaire(article: any): number {
    return article.prix_promo_unitaire || article.prix_unitaire;
  }

  getSousTotal(article: any): number {
    return this.getPrixUnitaire(article) * article.quantite;
  }

  getImageProduit(article: any): string {
    if (article.produit?.images && article.produit.images.length > 0) {
      return article.produit.images[0].url;
    }
    return 'assets/images/placeholder.png';
  }

  formatPrix(prix: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(prix || 0);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.adresseForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  // ============================================
  // VALIDATION COMMANDE
  // ============================================

  validerCommande(): void {
    if (this.adresseForm.invalid) {
      this.adresseForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    this.http.post(`${environment.apiUrl}/api/commandes`, {
      // adresse_livraison: this.adresseForm.value
       adresse_livraison: this.adresseForm.getRawValue()
    }).subscribe({
      next: (commande: any) => {
        this.submitting = false;
        this.panierService.clearStorage();
        this.router.navigate(['/commande/confirmation', commande._id]);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.message || 'Erreur lors de la validation de la commande';
      }
    });
  }
}