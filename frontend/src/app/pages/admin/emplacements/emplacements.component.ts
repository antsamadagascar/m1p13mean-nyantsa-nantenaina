import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-emplacements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './emplacements.component.html',
})
export class EmplacementsComponent implements OnInit {
  emplacements: any[] = [];
  zones: any[] = [];
  loading = false;
  saving = false;
  showModal = false;
  editMode = false;
  editId = '';
  filtreZone = '';
  form: FormGroup;
    get nbActifs() { return this.emplacements.filter(e => e.actif).length; }
    get nbInactifs() { return this.emplacements.filter(e => !e.actif).length; }

  typeOptions = [
    { value: 'box', label: 'Box' },
    { value: 'batiment', label: 'Bâtiment' },
    { value: 'etage', label: 'Étage' },
    { value: 'bureau', label: 'Bureau' },
    { value: 'autre', label: 'Autre' }
  ];

  private api = `${environment.apiUrl}/api`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      zone: ['', Validators.required],
      numero_local: ['', Validators.required],
      type: ['box', Validators.required],
      surface: [null],
      latitude: [null],
      longitude: [null],
      description: [''],
      actif: [true]
    });
  }

  ngOnInit() {
    this.loadZones();
    this.load();
  }

  private h() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` }) };
  }

  load() {
    this.loading = true;
    let url = `${this.api}/emplacements`;
    if (this.filtreZone) url += `?zone=${this.filtreZone}`;
    this.http.get<any>(url, this.h()).subscribe({
      next: (res) => { this.emplacements = res.emplacements; this.loading = false; },
      error: (err) => { this.alertService.error(err.error?.message || 'Erreur'); this.loading = false; }
    });
  }

  loadZones() {
    this.http.get<any>(`${this.api}/zones`, this.h()).subscribe({
      next: (res) => { this.zones = res.data || []; },
      error: () => { this.alertService.error('Erreur chargement zones'); }
    });
  }

  openModal() {
    this.editMode = false;
    this.form.reset({ type: 'box', actif: true });
    this.showModal = true;
  }

  openEditModal(e: any) {
    this.editMode = true;
    this.editId = e._id;
    this.form.patchValue({
      zone: e.zone?._id || e.zone,
      numero_local: e.numero_local,
      type: e.type,
      surface: e.surface,
      latitude: e.latitude,
      longitude: e.longitude,
      description: e.description,
      actif: e.actif
    });
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const req = this.editMode
      ? this.http.put(`${this.api}/emplacements/${this.editId}`, this.form.value, this.h())
      : this.http.post(`${this.api}/emplacements`, this.form.value, this.h());

    req.subscribe({
      next: () => {
        this.alertService.success(this.editMode ? 'Emplacement modifié' : 'Emplacement créé');
        this.saving = false;
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.alertService.error(err.error?.message || 'Erreur');
        this.saving = false;
      }
    });
  }

  delete(id: string) {
    this.http.delete(`${this.api}/emplacements/${id}`, this.h()).subscribe({
      next: () => { this.alertService.success('Emplacement supprimé'); this.load(); },
      error: (err) => { this.alertService.error(err.error?.message || 'Erreur suppression'); }
    });
  }

  getZoneNom(zone: any) { return zone?.nom || zone || '—'; }
  getTypeLabel(type: string) { return this.typeOptions.find(t => t.value === type)?.label || type; }
}