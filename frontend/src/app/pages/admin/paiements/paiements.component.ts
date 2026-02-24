import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';

const MOIS = ['Jan','Fev','Mar','Avr','Mai','Jui','Jul','Aou','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './paiements.component.html',
})
export class PaiementsComponent implements OnInit {
  paiements: any[] = [];
  locations: any[] = [];
  stats: any = { total_du: 0, total_percu: 0, nb_payes: 0, nb_impayes: 0, nb_retard: 0, nb_partiel: 0 };
  loading = false;
  saving = false;
  showModal = false;
  showGenererModal = false;
  editMode = false;
  editId = '';
  isAdmin = false;
  moisOptions = MOIS;
  anneeOptions: number[] = [];
  filtreMois = '';
  filtreAnnee: number = new Date().getFullYear();
  filtreStatut = '';
  genMois = new Date().getMonth() + 1;
  genAnnee = new Date().getFullYear();
  form: FormGroup;
  filtreStatuts = [
    { label: 'Tous', value: '' },
    { label: 'Payes', value: 'paye' },
    { label: 'Impayes', value: 'impaye' },
    { label: 'Retard', value: 'en_retard' },
    { label: 'Partiel', value: 'partiel' }
  ];
  private api = `${environment.apiUrl}/api`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      location_id: [''],
      mois: [new Date().getMonth() + 1, Validators.required],
      annee: [new Date().getFullYear(), Validators.required],
      montant_paye: [null, [Validators.required, Validators.min(0)]],
      date_paiement: [''],
      note: ['']
    });
    const year = new Date().getFullYear();
    this.anneeOptions = Array.from({ length: 5 }, (_, i) => year - 2 + i);
  }

  ngOnInit() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.isAdmin = user.role === 'ADMIN';
    } catch {}
    this.load();
    if (this.isAdmin) this.loadLocations();
  }

  private h() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` }) };
  }

  load() {
    this.loading = true;
    let url = `${this.api}/paiements?annee=${this.filtreAnnee}`;
    if (this.filtreMois) url += `&mois=${this.filtreMois}`;
    if (this.filtreStatut) url += `&statut=${this.filtreStatut}`;
    this.http.get<any>(url, this.h()).subscribe({
      next: (res) => { this.paiements = res.paiements; this.stats = res.stats; this.loading = false; },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Erreur lors du chargement des paiements');
        this.loading = false;
      }
    });
  }

  loadLocations() {
    this.http.get<any>(`${this.api}/locations`, this.h()).subscribe({
      next: (res) => { this.locations = res.locations || []; },
      error: () => { this.alertService.error('Erreur lors du chargement des locations'); }
    });
  }

  setStatut(v: string) { this.filtreStatut = v; this.load(); }

  openModal() {
    this.editMode = false;
    this.form.reset({ mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });
    this.showModal = true;
  }

  openEditModal(p: any) {
    this.editMode = true;
    this.editId = p._id;
    this.form.patchValue({
      montant_paye: p.montant_paye,
      date_paiement: p.date_paiement?.substring(0, 10) || '',
      note: p.note || '',
      mois: p.mois,
      annee: p.annee
    });
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }
  openGenererModal() { this.showGenererModal = true; }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const data = this.form.value;
    const req = this.editMode
      ? this.http.put(`${this.api}/paiements/${this.editId}`, data, this.h())
      : this.http.post(`${this.api}/paiements`, data, this.h());

    req.subscribe({
      next: () => {
        this.alertService.success(this.editMode ? 'Paiement modifie avec succes' : 'Paiement enregistre avec succes');
        this.saving = false;
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Erreur lors de l\'enregistrement');
        this.saving = false;
      }
    });
  }

  genererMois() {
    this.http.post(`${this.api}/paiements/generer-mois`, { mois: this.genMois, annee: this.genAnnee }, this.h())
      .subscribe({
        next: (res: any) => {
          this.alertService.success(res.message || 'Paiements generes avec succes');
          this.showGenererModal = false;
          this.load();
        },
        error: (err) => {
          this.alertService.error(err.error?.message || 'Erreur lors de la generation');
        }
      });
  }

  formatAr(n: number) { return n ? new Intl.NumberFormat('fr-MG').format(n) + ' Ar' : '0 Ar'; }
  getMoisLabel(m: number) { return MOIS[m - 1] || ''; }
  getStatutLabel(s: string) { return ({ paye: 'Paye', impaye: 'Impaye', en_retard: 'Retard', partiel: 'Partiel' } as any)[s] || s; }
  getStatutClass(s: string) {
    return ({
      paye:     'bg-emerald-50 text-emerald-700',
      impaye:   'bg-orange-50 text-orange-600',
      en_retard:'bg-red-50 text-red-600',
      partiel:  'bg-blue-50 text-blue-600'
    } as any)[s] || 'bg-gray-100 text-gray-600';
  }
}