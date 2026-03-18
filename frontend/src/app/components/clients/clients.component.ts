import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import { Client } from '../../models/client';
import { ClientPersistenceService } from '../../services/client-persistence.service';
import { ClientStoreService } from '../../services/client-store.service';

type NoticeType = 'info' | 'success' | 'error';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private currentQuery = '';

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly form = this.fb.group({
    id: ['' as string | null],
    nom: ['', Validators.required],
    tel: [''],
    adresse: [''],
    mf: [''],
    email: ['', Validators.email]
  });

  clients: Client[] = [];
  filteredClients: Client[] = [];
  isSaving = false;
  editingId: string | null = null;

  notice = {
    open: false,
    type: 'info' as NoticeType,
    message: ''
  };

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private clientStore: ClientStoreService,
    private clientPersistence: ClientPersistenceService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('[clients-page] load requested');
    await this.clientStore.load();

    this.clientStore.clients$
      .pipe(takeUntil(this.destroy$))
      .subscribe((clients) => {
        this.clients = clients;
        this.applyFilter(this.currentQuery);
        console.log('[clients-page] api response received');
        console.log(`[clients-page] rendered items count: ${this.filteredClients.length}`);
        console.log('[clients-page] empty state condition:', this.filteredClients.length === 0);
        this.cdr.markForCheck();
      });

    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.value),
        debounceTime(180),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((query) => {
        this.currentQuery = query;
        this.applyFilter(query);
        console.log(`[clients-page] rendered items count: ${this.filteredClients.length}`);
        console.log('[clients-page] empty state condition:', this.filteredClients.length === 0);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      id: null,
      nom: '',
      tel: '',
      adresse: '',
      mf: '',
      email: ''
    });
  }

  editClient(client: Client): void {
    this.editingId = client.id ?? null;
    this.form.patchValue({
      id: client.id ?? null,
      nom: client.nom ?? '',
      tel: client.tel || client.telephone || '',
      adresse: client.adresse ?? '',
      mf: client.mf ?? '',
      email: client.email ?? ''
    });
  }

  trackByClientId = (_: number, client: Client): string =>
    client.id ?? `${client.nom}|${client.email ?? ''}|${client.tel || client.telephone || ''}`;

  async saveClient(): Promise<void> {
    if (this.isSaving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.hideNotice();
    this.cdr.markForCheck();
    const wasEdit = !!this.editingId;

    try {
      const raw = this.form.getRawValue();
      const payload: Client = {
        id: this.normalizeText(raw.id) || null,
        nom: this.normalizeText(raw.nom),
        tel: this.normalizeText(raw.tel),
        telephone: this.normalizeText(raw.tel),
        adresse: this.normalizeText(raw.adresse),
        mf: this.normalizeText(raw.mf),
        email: this.normalizeText(raw.email).toLowerCase()
      };

      const saved = this.editingId
        ? await this.clientPersistence.upsert(payload)
        : await this.clientPersistence.findOrCreate(payload);

      await this.clientStore.refresh();

      if (saved) {
        this.editClient(saved);
      } else {
        this.startCreate();
      }

      this.showNotice('success', wasEdit ? 'Client mis a jour.' : 'Client enregistre.');
    } catch {
      this.showNotice('error', 'Impossible d enregistrer le client.');
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  async deleteClient(client: Client): Promise<void> {
    if (!client.id) return;
    const ok = confirm(`Supprimer le client "${client.nom}" ?`);
    if (!ok) return;

    const deleted = await this.clientPersistence.delete(client.id);
    if (!deleted) {
      this.showNotice('error', 'Suppression impossible.');
      this.cdr.markForCheck();
      return;
    }

    await this.clientStore.refresh();

    if (this.editingId === client.id) {
      this.startCreate();
    }

    this.showNotice('success', 'Client supprime.');
    this.cdr.markForCheck();
  }

  private applyFilter(query: string): void {
    const key = this.toKey(query);
    const phoneKey = this.normalizePhone(query);
    if (!key) {
      this.filteredClients = [...this.clients];
      return;
    }

    this.filteredClients = this.clients.filter((client) => {
      const nom = this.toKey(client.nom);
      const tel = this.normalizePhone(client.tel || client.telephone);
      const email = this.toKey(client.email);
      const mf = this.toKey(client.mf);
      return nom.includes(key) || email.includes(key) || mf.includes(key) || (phoneKey ? tel.includes(phoneKey) : false);
    });
  }

  private showNotice(type: NoticeType, message: string): void {
    this.notice = { open: true, type, message };
  }

  private hideNotice(): void {
    this.notice = { ...this.notice, open: false };
  }

  private normalizeText(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ');
  }

  private toKey(value: unknown): string {
    return this.normalizeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private normalizePhone(value: unknown): string {
    return this.normalizeText(value).replace(/[^\d+]/g, '').toLowerCase();
  }
}
