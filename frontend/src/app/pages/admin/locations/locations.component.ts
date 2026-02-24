import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './locations.component.html'
})
export class LocationsComponent implements OnInit {
  locations: any[] = [];
  filtered: any[] = [];
  boutiques: any[] = [];
  zones: any[] = [];
  ca_total = 0;
  loading = false;
  saving = false;
  showModal = false;
  editMode = false;
  editId = '';
  search = '';
  activeFilter = 'tous';
  form: FormGroup;
  filterOpts = [
    { label: 'Tous', value: 'tous' },
    { label: 'Actifs', value: 'actif' },
    { label: 'Expires', value: 'expire' },
    { label: 'Resilies', value: 'resilie' }
  ];

  private api = `${environment.apiUrl}/api`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      boutique: ['', Validators.required],
      zone: ['', Validators.required],
      numero_local: ['', Validators.required],
      surface: [null],
      loyer_mensuel: [null, Validators.required],
      date_debut: ['', Validators.required],
      date_fin: [''],
      statut: ['actif'],
      notes: ['']
    });
  }

  ngOnInit() { this.load(); this.loadBoutiques(); this.loadZones(); }

  private h() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` }) };
  }

  load() {
    this.loading = true;
    this.http.get<any>(`${this.api}/locations`, this.h()).subscribe({
      next: (res) => {
        this.locations = res.locations || [];
        this.ca_total = res.ca_total || 0;
        this.filter();
        this.loading = false;
      },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Erreur lors du chargement des contrats');
        this.loading = false;
      }
    });
  }

  loadBoutiques() {
    this.http.get<any>(`${this.api}/boutiques`, this.h()).subscribe({
      next: (res) => { this.boutiques = res.boutiques || res.data || res || []; },
      error: () => { this.alertService.error('Erreur lors du chargement des boutiques'); }
    });
  }

  loadZones() {
    this.http.get<any>(`${this.api}/zones`, this.h()).subscribe({
      next: (res) => { this.zones = res.zones || res.data || res || []; },
      error: () => { this.alertService.error('Erreur lors du chargement des zones'); }
    });
  }

  filter() {
    let r = [...this.locations];
    if (this.activeFilter !== 'tous') r = r.filter(l => l.statut === this.activeFilter);
    if (this.search.trim()) {
      const t = this.search.toLowerCase();
      r = r.filter(l =>
        l.boutique?.nom?.toLowerCase().includes(t) ||
        l.numero_local?.toLowerCase().includes(t) ||
        l.zone?.nom?.toLowerCase().includes(t)
      );
    }
    this.filtered = r;
  }

  setFilter(v: string) { this.activeFilter = v; this.filter(); }
  count(s: string) { return this.locations.filter(l => l.statut === s).length; }
  formatAr(n: number) { return n ? new Intl.NumberFormat('fr-MG').format(n) + ' Ar' : '0 Ar'; }
  statutLabel(s: string) { return ({ actif: 'Actif', expire: 'Expire', resilie: 'Resilie' } as any)[s] || s; }
  statutClass(s: string) {
    return ({ actif: 'bg-emerald-50 text-emerald-700', expire: 'bg-orange-50 text-orange-600', resilie: 'bg-red-50 text-red-600' } as any)[s] || 'bg-gray-100 text-gray-600';
  }

  openModal() { this.editMode = false; this.editId = ''; this.form.reset({ statut: 'actif' }); this.showModal = true; }

  openEdit(loc: any) {
    this.editMode = true;
    this.editId = loc._id;
    this.form.patchValue({
      boutique: loc.boutique?._id,
      zone: loc.zone?._id,
      numero_local: loc.numero_local,
      surface: loc.surface,
      loyer_mensuel: loc.loyer_mensuel,
      date_debut: loc.date_debut?.substring(0, 10),
      date_fin: loc.date_fin?.substring(0, 10) || '',
      statut: loc.statut,
      notes: loc.notes || ''
    });
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const data = { ...this.form.value };
    if (!data.date_fin) delete data.date_fin;

    const req = this.editMode
      ? this.http.put(`${this.api}/locations/${this.editId}`, data, this.h())
      : this.http.post(`${this.api}/locations`, data, this.h());

    req.subscribe({
      next: () => {
        this.alertService.success(this.editMode ? 'Contrat modifie avec succes' : 'Contrat cree avec succes');
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

  del(loc: any) {
    if (!confirm('Supprimer ce contrat ?')) return;
    this.http.delete(`${this.api}/locations/${loc._id}`, this.h()).subscribe({
      next: () => {
        this.alertService.success('Contrat supprime avec succes');
        this.load();
      },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Erreur lors de la suppression');
      }
    });
  }

  onBoutiqueChange(boutiqueId: string) {
    if (!boutiqueId) return;
    const boutique = this.boutiques.find(b => b._id === boutiqueId);
    if (boutique?.localisation?.zone) {
        const zoneId = boutique.localisation.zone._id || boutique.localisation.zone;
        this.form.patchValue({ zone: zoneId });
    }
}
}