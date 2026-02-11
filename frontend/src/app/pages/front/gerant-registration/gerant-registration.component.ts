import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../services/auth.service';
import { BoutiqueService } from '../../../services/boutique.service';

@Component({
  standalone: true,
  selector: 'app-gerant-registration',
  templateUrl: './gerant-registration.component.html',
  styleUrls: ['./gerant-registration.component.css'],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class GerantRegistrationComponent implements OnInit {

  boutiqueId: string = '';
  boutique: any = null;
  loading: boolean = false;
  loadingBoutique: boolean = true;

  showPassword: boolean = false;
  showConfirmation: boolean = false;

  motDePasse: string = '';
  confirmation: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private boutiqueService: BoutiqueService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.boutiqueId = params['id'];
      if (this.boutiqueId) {
        this.loadBoutique();
      } else {
        alert('ID de boutique manquant');
        this.router.navigate(['/']);
      }
    });
  }

  loadBoutique() {
    this.loadingBoutique = true;
    this.boutiqueService.getBoutiqueById(this.boutiqueId).subscribe({
      next: (response) => {
        this.boutique = response.data;
        this.loadingBoutique = false;
      },
      error: () => {
        alert('Boutique non trouvée');
        this.router.navigate(['/']);
        this.loadingBoutique = false;
      }
    });
  }

  onSubmit() {
    if (!this.motDePasse || !this.confirmation) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (this.motDePasse !== this.confirmation) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (!this.boutique || !this.boutique.gerant) {
      alert('Informations du gérant introuvables');
      return;
    }

    const payload = {
      boutiqueId: this.boutiqueId,
      nom: this.boutique.gerant.nom,
      prenom: this.boutique.gerant.prenom,
      email: this.boutique.gerant.email,
      password: this.motDePasse
    };

    this.loading = true;

    this.authService.registerGerant(payload).subscribe({
      next: () => {
        this.loading = false;
        alert('Compte gérant créé avec succès');
        this.router.navigate(['/connexion']);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert(err.error?.message || 'Erreur lors de la création du compte');
      }
    });
  }


}
