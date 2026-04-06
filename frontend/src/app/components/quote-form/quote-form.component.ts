import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, startWith, takeUntil } from 'rxjs';
import { Client } from '../../models/client';
import { InvoiceLine } from '../../models/invoice-line';
import { Quote, QuoteRemiseType } from '../../models/quote';
import { ClientAutocompleteComponent } from '../client-autocomplete/client-autocomplete.component';
import { QuoteCalcService, QuoteTotals } from '../../services/quote-calc.service';
import { QuoteStoreService } from '../../services/quote-store.service';
import { PurchaseOrderNumberService } from '../../services/purchase-order-number.service';

const TVA_RATE = 19;

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ClientAutocompleteComponent],
  templateUrl: './quote-form.component.html',
  styleUrls: ['./quote-form.component.css']
})
export class QuoteFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private isApplyingClientSelection = false;
  private selectedClient: Client | null = null;
  private currentId: string | null = null;

  form = this.fb.group({
    numero: ['', Validators.required],
    date: ['', Validators.required],
    purchaseOrderNumber: [''],
    clientId: ['' as string | null],
    client: this.fb.group({
      nom: ['', Validators.required],
      adresse: ['', Validators.required],
      tel: [''],
      mf: [''],
      email: ['', Validators.email]
    }),
    lignes: this.fb.array([]),
    remiseType: ['montant' as QuoteRemiseType],
    remiseValue: [0],
    notes: [''],
    conditions: ['']
  });

  totals: QuoteTotals = {
    totalHT: 0,
    remise: 0,
    totalHTApresRemise: 0,
    fodec: 0,
    totalHorsTVA: 0,
    tva: 0,
    totalTTC: 0
  };

  isEdit = false;
  numeroConflict = false;

  constructor(
    private fb: FormBuilder,
    private store: QuoteStoreService,
    private purchaseOrders: PurchaseOrderNumberService,
    public calc: QuoteCalcService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get lignes(): FormArray {
    return this.form.get('lignes') as FormArray;
  }

  get clientFormGroup(): FormGroup {
    return this.form.get('client') as FormGroup;
  }

  async ngOnInit(): Promise<void> {
    await this.store.load();

    const id = this.route.snapshot.paramMap.get('id');
    const fromQuoteId = this.route.snapshot.queryParamMap.get('fromQuoteId');
    if (id) {
      this.isEdit = true;
      const quote = await this.store.getById(id);
      if (!quote) {
        this.router.navigate(['/quotes']);
        return;
      }

      this.currentId = quote.id;
      this.form.patchValue({
        numero: quote.numero,
        date: quote.date,
        purchaseOrderNumber: quote.purchaseOrderNumber ?? '',
        clientId: quote.clientId ?? quote.client?.id ?? null,
        client: {
          nom: quote.client?.nom ?? '',
          adresse: quote.client?.adresse ?? '',
          tel: quote.client?.tel || quote.client?.telephone || '',
          mf: quote.client?.mf ?? '',
          email: quote.client?.email ?? ''
        },
        remiseType: quote.remiseType ?? 'montant',
        remiseValue: quote.remiseValue ?? 0,
        notes: quote.notes ?? '',
        conditions: quote.conditions ?? ''
      });
      this.setLines(quote.lignes ?? []);
    } else {
      this.isEdit = false;
      this.currentId = this.ensureCurrentId();

      const date = new Date().toISOString().slice(0, 10);
      const [numero, purchaseOrderNumber] = await Promise.all([
        this.store.getNextQuoteNumber(),
        this.purchaseOrders.getNextForQuotes()
      ]);
      this.form.patchValue({
        numero,
        date,
        purchaseOrderNumber,
        clientId: null,
        remiseType: 'montant',
        remiseValue: 0
      });

      if (fromQuoteId) {
        const source = await this.store.getById(fromQuoteId);
        if (source) {
          this.prefillFromQuote(source);
        } else {
          this.addLine();
        }
      } else {
        this.addLine();
      }
    }

    this.initializeSelectedClientFromForm();

    this.form.get('client')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncClientLinkOnManualEdit());

    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntil(this.destroy$))
      .subscribe(() => this.updateTotals());

    this.updateTotals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClientSelected(client: Client | null): void {
    this.isApplyingClientSelection = true;
    this.selectedClient = client;
    this.form.patchValue({ clientId: client?.id ?? null }, { emitEvent: false });
    this.isApplyingClientSelection = false;
  }

  addLine(): void {
    this.lignes.push(this.createLine());
  }

  removeLine(index: number): void {
    if (this.lignes.length <= 1) return;
    this.lignes.removeAt(index);
  }

  lineHT(index: number): number {
    const line = this.normalizeLine(this.lignes.at(index).value as InvoiceLine);
    return this.calc.lineHT(line);
  }

  async save(goToPreview: boolean): Promise<void> {
    this.numeroConflict = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const quote = this.buildQuote();
    const unique = await this.store.isNumeroUnique(quote.numero, quote.id);
    if (!unique) {
      this.numeroConflict = true;
      return;
    }

    await this.store.save(quote);

    if (goToPreview) {
      this.router.navigate(['/quotes', quote.id, 'preview']);
      return;
    }

    this.router.navigate(['/quotes']);
  }

  cancel(): void {
    this.router.navigate(['/quotes']);
  }

  private updateTotals(): void {
    this.totals = this.calc.totals(this.buildQuote());
  }

  private setLines(lines: InvoiceLine[]): void {
    this.lignes.clear();
    lines.forEach((line) => this.lignes.push(this.createLine(line)));
    if (lines.length === 0) this.addLine();
  }

  private createLine(line?: InvoiceLine): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      id: [line?.id ?? this.createId()],
      designation: [line?.designation ?? '', Validators.required],
      unite: [line?.unite ?? '', Validators.required],
      quantite: [line?.quantite ?? 0, [Validators.required, Validators.min(0)]],
      prixUnitaire: [line?.prixUnitaire ?? 0, [Validators.required, Validators.min(0)]],
      tvaRate: [TVA_RATE]
    });
  }

  private prefillFromQuote(source: Quote): void {
    this.form.patchValue({
      clientId: source.clientId ?? source.client?.id ?? null,
      client: {
        nom: source.client?.nom ?? '',
        adresse: source.client?.adresse ?? '',
        tel: source.client?.tel || source.client?.telephone || '',
        mf: source.client?.mf ?? '',
        email: source.client?.email ?? ''
      },
      remiseType: source.remiseType ?? 'montant',
      remiseValue: source.remiseValue ?? 0,
      notes: source.notes ?? '',
      conditions: source.conditions ?? ''
    });
    this.setLines(this.cloneLines(source.lignes ?? []));
  }

  private cloneLines(lines: InvoiceLine[]): InvoiceLine[] {
    return lines.map((line) => ({
      ...line,
      id: this.createId()
    }));
  }

  private buildQuote(): Quote {
    const raw = this.form.getRawValue();
    const clientId = this.normalizeText(raw.clientId) || null;

    return {
      id: this.ensureCurrentId(),
      numero: this.normalizeText(raw.numero),
      date: this.normalizeText(raw.date || new Date().toISOString().slice(0, 10)),
      purchaseOrderNumber: this.normalizeText(raw.purchaseOrderNumber) || null,
      clientId,
      client: {
        id: clientId,
        nom: this.normalizeText(raw.client?.nom),
        adresse: this.normalizeText(raw.client?.adresse),
        tel: this.normalizeText(raw.client?.tel),
        telephone: this.normalizeText(raw.client?.tel),
        mf: this.normalizeText(raw.client?.mf),
        email: this.normalizeText(raw.client?.email).toLowerCase()
      },
      lignes: ((raw.lignes ?? []) as InvoiceLine[]).map((line) => this.normalizeLine(line)),
      remiseType: raw.remiseType ?? 'montant',
      remiseValue: Number(raw.remiseValue) || 0,
      notes: raw.notes ?? '',
      conditions: raw.conditions ?? ''
    };
  }

  private normalizeLine(line: InvoiceLine): InvoiceLine {
    return {
      ...line,
      quantite: Number(line.quantite) || 0,
      prixUnitaire: Number(line.prixUnitaire) || 0,
      tvaRate: TVA_RATE
    };
  }

  private ensureCurrentId(): string {
    if (!this.currentId) {
      this.currentId = this.createId();
    }
    return this.currentId;
  }

  private initializeSelectedClientFromForm(): void {
    const raw = this.form.getRawValue();
    const currentId = this.normalizeText(raw.clientId) || null;
    if (!currentId && !this.normalizeText(raw.client?.nom)) {
      this.selectedClient = null;
      return;
    }

    this.selectedClient = {
      id: currentId,
      nom: this.normalizeText(raw.client?.nom),
      adresse: this.normalizeText(raw.client?.adresse),
      tel: this.normalizeText(raw.client?.tel),
      telephone: this.normalizeText(raw.client?.tel),
      mf: this.normalizeText(raw.client?.mf),
      email: this.normalizeText(raw.client?.email).toLowerCase()
    };
  }

  private syncClientLinkOnManualEdit(): void {
    if (this.isApplyingClientSelection || !this.selectedClient) return;

    const rawClient = this.form.getRawValue().client;
    if (this.matchesSelectedClient(rawClient, this.selectedClient)) return;

    this.selectedClient = null;
    this.form.patchValue({ clientId: null }, { emitEvent: false });
  }

  private matchesSelectedClient(
    rawClient: { nom?: string | null; adresse?: string | null; tel?: string | null; mf?: string | null; email?: string | null } | null | undefined,
    selected: Client
  ): boolean {
    return (
      this.toKey(rawClient?.nom) === this.toKey(selected.nom) &&
      this.toKey(rawClient?.adresse) === this.toKey(selected.adresse) &&
      this.toKey(rawClient?.tel) === this.toKey(selected.tel || selected.telephone) &&
      this.toKey(rawClient?.mf) === this.toKey(selected.mf) &&
      this.toKey(rawClient?.email) === this.toKey(selected.email)
    );
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

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ??
      `quote_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
