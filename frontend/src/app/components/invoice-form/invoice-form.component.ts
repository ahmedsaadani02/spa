import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, startWith, takeUntil } from 'rxjs';
import { Client } from '../../models/client';
import { Invoice, RemiseType } from '../../models/invoice';
import { InvoiceLine } from '../../models/invoice-line';
import { Quote } from '../../models/quote';
import { ClientAutocompleteComponent } from '../client-autocomplete/client-autocomplete.component';
import { InvoiceCalcService, InvoiceTotals } from '../../services/invoice-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';
import { QuoteStoreService } from '../../services/quote-store.service';
import { normalizeInvoice, normalizeInvoicePaymentStatus } from '../../utils/invoice-payload';
import { PurchaseOrderNumberService } from '../../services/purchase-order-number.service';

const TVA_RATE = 19;

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ClientAutocompleteComponent],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private isApplyingClientSelection = false;
  private selectedClient: Client | null = null;
  private currentId: string | null = null;

  form = this.fb.group({
    numero: ['', Validators.required],
    date: ['', Validators.required],
    clientId: ['' as string | null],
    client: this.fb.group({
      nom: ['', Validators.required],
      adresse: ['', Validators.required],
      tel: ['', Validators.required],
      mf: [''],
      email: ['', Validators.email]
    }),
    lignes: this.fb.array([]),
    remiseType: ['montant' as RemiseType],
    remiseValue: [0],
    remiseAvantTVA: [true],
    notes: [''],
    conditions: [''],
    paymentStatus: ['unpaid'],
    paidAt: [''],
    paymentMethod: [''],
    purchaseOrderNumber: [''],
    customInvoiceNumber: ['']
  });

  totals: InvoiceTotals = {
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    remise: 0,
    totalHTApresRemise: 0,
    totalTVAApresRemise: 0
  };

  isEdit = false;
  numeroConflict = false;

  constructor(
    private fb: FormBuilder,
    private store: InvoiceStoreService,
    private quoteStore: QuoteStoreService,
    private purchaseOrders: PurchaseOrderNumberService,
    public calc: InvoiceCalcService,
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
    const fromInvoiceId = this.route.snapshot.queryParamMap.get('fromInvoiceId');
    const fromQuoteId = this.route.snapshot.queryParamMap.get('fromQuoteId');
    if (id) {
      this.isEdit = true;
      const invoice = await this.store.getById(id);
      if (!invoice) {
        this.router.navigate(['/invoices']);
        return;
      }

      this.currentId = invoice.id;
      this.form.patchValue({
        numero: invoice.numero,
        date: invoice.date,
        clientId: invoice.clientId ?? invoice.client?.id ?? null,
        client: {
          nom: invoice.client?.nom ?? '',
          adresse: invoice.client?.adresse ?? '',
          tel: invoice.client?.tel || invoice.client?.telephone || '',
          mf: invoice.client?.mf ?? '',
          email: invoice.client?.email ?? ''
        },
        remiseType: invoice.remiseType ?? 'montant',
        remiseValue: invoice.remiseValue ?? 0,
        remiseAvantTVA: invoice.remiseAvantTVA ?? true,
        notes: invoice.notes ?? '',
        conditions: invoice.conditions ?? '',
        paymentStatus: normalizeInvoicePaymentStatus(invoice.paymentStatus),
        paidAt: invoice.paidAt ?? '',
        paymentMethod: invoice.paymentMethod ?? '',
        purchaseOrderNumber: invoice.purchaseOrderNumber ?? '',
        customInvoiceNumber: invoice.customInvoiceNumber ?? ''
      });
      this.setLines(invoice.lignes ?? []);
    } else {
      this.isEdit = false;
      this.currentId = this.ensureCurrentId();

      const date = new Date().toISOString().slice(0, 10);
      const [numero, purchaseOrderNumber] = await Promise.all([
        this.store.getNextInvoiceNumber(),
        this.purchaseOrders.getNextForInvoices()
      ]);
      this.form.patchValue({
        numero,
        date,
        clientId: null,
        remiseType: 'montant',
        remiseValue: 0,
        remiseAvantTVA: true,
        paymentStatus: 'unpaid',
        purchaseOrderNumber
      });

      if (fromInvoiceId) {
        const sourceInvoice = await this.store.getById(fromInvoiceId);
        if (sourceInvoice) {
          this.prefillFromInvoice(sourceInvoice);
        } else {
          this.addLine();
        }
      } else if (fromQuoteId) {
        await this.quoteStore.load();
        const sourceQuote = await this.quoteStore.getById(fromQuoteId);
        if (sourceQuote) {
          this.prefillFromQuote(sourceQuote);
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

  lineTTC(index: number): number {
    const line = this.normalizeLine(this.lignes.at(index).value as InvoiceLine);
    return this.calc.lineTTC(line);
  }

  async save(goToPreview: boolean): Promise<void> {
    this.numeroConflict = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const invoice = this.buildInvoice();
    const unique = await this.store.isNumeroUnique(invoice.numero, invoice.id);
    if (!unique) {
      this.numeroConflict = true;
      return;
    }

    await this.store.save(invoice);

    if (goToPreview) {
      this.router.navigate(['/invoices', invoice.id, 'preview'], { queryParams: { id: invoice.id } });
      return;
    }

    this.router.navigate(['/invoices']);
  }

  cancel(): void {
    this.router.navigate(['/invoices']);
  }

  private updateTotals(): void {
    this.totals = this.calc.totals(this.buildInvoice());
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

  private prefillFromInvoice(source: Invoice): void {
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
      remiseAvantTVA: source.remiseAvantTVA ?? true,
      notes: source.notes ?? '',
      conditions: source.conditions ?? '',
      paymentStatus: 'unpaid',
      paidAt: '',
      paymentMethod: '',
      customInvoiceNumber: ''
    });
    this.setLines(this.cloneLines(source.lignes ?? []));
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
      remiseAvantTVA: true,
      notes: source.notes ?? '',
      conditions: source.conditions ?? '',
      paymentStatus: 'unpaid',
      paidAt: '',
      paymentMethod: '',
      customInvoiceNumber: ''
    });
    this.setLines(this.cloneLines(source.lignes ?? []));
  }

  private cloneLines(lines: InvoiceLine[]): InvoiceLine[] {
    return lines.map((line) => ({
      ...line,
      id: this.createId()
    }));
  }

  private buildInvoice(): Invoice {
    const raw = this.form.getRawValue();
    const clientId = this.normalizeText(raw.clientId) || null;

    return normalizeInvoice({
      id: this.ensureCurrentId(),
      numero: this.normalizeText(raw.numero),
      date: this.normalizeText(raw.date || new Date().toISOString().slice(0, 10)),
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
      remiseAvantTVA: raw.remiseAvantTVA ?? true,
      notes: raw.notes ?? '',
      conditions: raw.conditions ?? '',
      paymentStatus: normalizeInvoicePaymentStatus(raw.paymentStatus),
      paidAt: this.normalizeText(raw.paidAt) || null,
      paymentMethod: this.normalizeText(raw.paymentMethod) || null,
      purchaseOrderNumber: this.normalizeText(raw.purchaseOrderNumber) || null,
      customInvoiceNumber: this.normalizeText(raw.customInvoiceNumber) || null
    });
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
      `inv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
