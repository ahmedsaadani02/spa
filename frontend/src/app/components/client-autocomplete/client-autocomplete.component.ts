import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import { Client } from '../../models/client';
import { ClientPersistenceService } from '../../services/client-persistence.service';
import { ClientStoreService } from '../../services/client-store.service';

@Component({
  selector: 'app-client-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-autocomplete.component.html',
  styleUrls: ['./client-autocomplete.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAutocompleteComponent implements OnInit, OnDestroy {
  @Input({ required: true }) formGroup!: FormGroup;
  @Input({ required: true }) clientControlName!: string;
  @Output() clientSelected = new EventEmitter<Client | null>();

  private readonly destroy$ = new Subject<void>();
  private blurTimer?: number;
  private isPatching = false;

  clients: Client[] = [];
  suggestions: Client[] = [];
  dropdownOpen = false;
  activeIndex = -1;
  query = '';
  selectedClient: Client | null = null;

  showCreateModal = false;
  isCreating = false;
  createError = '';

  readonly createForm = this.fb.group({
    nom: ['', Validators.required],
    tel: [''],
    email: ['', Validators.email],
    adresse: [''],
    mf: ['']
  });

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private clientStore: ClientStoreService,
    private clientPersistence: ClientPersistenceService
  ) {}

  get nameControl(): FormControl<string> {
    const control = this.formGroup?.get(this.clientControlName);
    if (!(control instanceof FormControl)) {
      throw new Error(`[ClientAutocomplete] Control "${this.clientControlName}" is missing or invalid`);
    }
    return control as FormControl<string>;
  }

  get canCreateFromQuery(): boolean {
    return this.toKey(this.query).length > 0;
  }

  get createOptionIndex(): number {
    return this.suggestions.length;
  }

  async ngOnInit(): Promise<void> {
    await this.clientStore.load();

    this.clientStore.clients$
      .pipe(takeUntil(this.destroy$))
      .subscribe((clients) => {
        this.clients = clients;
        this.updateSuggestions(this.query);
        this.cdr.markForCheck();
      });

    this.query = this.normalizeText(this.nameControl.value);

    this.nameControl.valueChanges
      .pipe(
        startWith(this.nameControl.value),
        debounceTime(120),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        if (this.isPatching) return;

        this.query = this.normalizeText(value);
        if (this.selectedClient && this.toKey(this.query) !== this.toKey(this.selectedClient.nom)) {
          this.selectedClient = null;
          this.clientSelected.emit(null);
        }

        this.updateSuggestions(this.query);
        if (this.query || this.dropdownOpen) {
          this.dropdownOpen = true;
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.blurTimer) {
      window.clearTimeout(this.blurTimer);
      this.blurTimer = undefined;
    }
  }

  onFocus(): void {
    if (this.blurTimer) {
      window.clearTimeout(this.blurTimer);
      this.blurTimer = undefined;
    }
    this.dropdownOpen = true;
    this.updateSuggestions(this.query);
  }

  onBlur(): void {
    this.blurTimer = window.setTimeout(() => {
      this.closeDropdown();
      this.cdr.markForCheck();
    }, 120);
  }

  toggleDropdown(event: MouseEvent): void {
    event.preventDefault();
    if (this.dropdownOpen) {
      this.closeDropdown();
      return;
    }

    this.dropdownOpen = true;
    this.updateSuggestions(this.query);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.dropdownOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      this.dropdownOpen = true;
      this.updateSuggestions(this.query);
    }

    const count = this.totalOptionsCount();
    if (!count) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = this.activeIndex < 0 ? 0 : (this.activeIndex + 1) % count;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = this.activeIndex < 0 ? count - 1 : (this.activeIndex - 1 + count) % count;
      return;
    }

    if (event.key === 'Enter') {
      if (this.activeIndex < 0) return;
      event.preventDefault();
      if (this.canCreateFromQuery && this.activeIndex === this.createOptionIndex) {
        this.openCreateModalFromQuery();
        return;
      }

      const client = this.suggestions[this.activeIndex];
      if (client) this.selectClient(client);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
    }
  }

  selectClient(client: Client): void {
    this.applyClient(client);
    this.closeDropdown();
  }

  isSuggestionActive(index: number): boolean {
    return this.activeIndex === index;
  }

  isCreateOptionActive(): boolean {
    return this.canCreateFromQuery && this.activeIndex === this.createOptionIndex;
  }

  trackByClient = (_: number, client: Client): string =>
    client.id ?? `${client.nom}|${client.email ?? ''}|${client.tel || client.telephone || ''}`;

  openCreateModalFromQuery(): void {
    const name = this.query || this.normalizeText(this.nameControl.value);
    this.createForm.reset({
      nom: name,
      tel: '',
      email: '',
      adresse: '',
      mf: ''
    });
    this.createError = '';
    this.showCreateModal = true;
    this.closeDropdown();
    this.cdr.markForCheck();
  }

  closeCreateModal(): void {
    if (this.isCreating) return;
    this.showCreateModal = false;
    this.createError = '';
    this.cdr.markForCheck();
  }

  async createClient(): Promise<void> {
    if (this.isCreating) return;
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const raw = this.createForm.getRawValue();
    this.isCreating = true;
    this.createError = '';
    this.cdr.markForCheck();

    try {
      const resolved = await this.clientPersistence.findOrCreate({
        nom: this.normalizeText(raw.nom),
        tel: this.normalizeText(raw.tel),
        telephone: this.normalizeText(raw.tel),
        email: this.normalizeText(raw.email).toLowerCase(),
        adresse: this.normalizeText(raw.adresse),
        mf: this.normalizeText(raw.mf)
      });

      if (!resolved) {
        this.createError = 'Impossible de creer ce client.';
        return;
      }

      await this.clientStore.refresh();
      this.applyClient(resolved);
      this.showCreateModal = false;
      this.createForm.reset({
        nom: '',
        tel: '',
        email: '',
        adresse: '',
        mf: ''
      });
    } catch {
      this.createError = 'Impossible de creer ce client.';
    } finally {
      this.isCreating = false;
      this.cdr.markForCheck();
    }
  }

  private applyClient(client: Client): void {
    const tel = this.normalizeText(client.tel || client.telephone);
    this.isPatching = true;
    this.selectedClient = client;
    this.query = this.normalizeText(client.nom);

    this.formGroup.patchValue({
      nom: this.normalizeText(client.nom),
      tel,
      email: this.normalizeText(client.email).toLowerCase(),
      adresse: this.normalizeText(client.adresse),
      mf: this.normalizeText(client.mf)
    }, { emitEvent: false });

    this.isPatching = false;
    this.clientSelected.emit(client);
    this.cdr.markForCheck();
  }

  private updateSuggestions(query: string): void {
    const key = this.toKey(query);
    const phoneKey = this.normalizePhone(query);

    const results = this.clients.filter((client) => {
      if (!client.nom) return false;
      if (!key) return true;

      const nom = this.toKey(client.nom);
      const tel = this.normalizePhone(client.tel || client.telephone);
      const email = this.toKey(client.email);
      const mf = this.toKey(client.mf);

      return nom.includes(key) || email.includes(key) || mf.includes(key) || (phoneKey ? tel.includes(phoneKey) : false);
    });

    this.suggestions = results.slice(0, 8);
    const maxIndex = this.totalOptionsCount() - 1;
    if (maxIndex < 0) {
      this.activeIndex = -1;
      return;
    }

    if (this.activeIndex < 0 || this.activeIndex > maxIndex) {
      this.activeIndex = 0;
    }
  }

  private closeDropdown(): void {
    this.dropdownOpen = false;
    this.activeIndex = -1;
  }

  private totalOptionsCount(): number {
    return this.suggestions.length + (this.canCreateFromQuery ? 1 : 0);
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
