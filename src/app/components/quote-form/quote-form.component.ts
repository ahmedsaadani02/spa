import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, startWith, takeUntil } from 'rxjs';
import { Quote, QuoteRemiseType } from '../../models/quote';
import { InvoiceLine } from '../../models/invoice-line';
import { QuoteCalcService, QuoteTotals } from '../../services/quote-calc.service';
import { QuoteStoreService } from '../../services/quote-store.service';

const TVA_RATE = 19;

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './quote-form.component.html',
  styleUrls: ['./quote-form.component.css']
})
export class QuoteFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  form = this.fb.group({
    numero: ['', Validators.required],
    date: ['', Validators.required],
    client: this.fb.group({
      nom: ['', Validators.required],
      adresse: ['', Validators.required],
      tel: [''],
      mf: [''],
      email: ['']
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

  private currentId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private store: QuoteStoreService,
    public calc: QuoteCalcService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get lignes(): FormArray {
    return this.form.get('lignes') as FormArray;
  }

  async ngOnInit(): Promise<void> {
    await this.store.load();

    const id = this.route.snapshot.paramMap.get('id');

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
        client: quote.client,
        remiseType: quote.remiseType ?? 'montant',
        remiseValue: quote.remiseValue ?? 0,
        notes: quote.notes ?? '',
        conditions: quote.conditions ?? ''
      });

      this.setLines(quote.lignes ?? []);
    } else {
      this.isEdit = false;
      this.currentId = this.ensureCurrentId();

      const numero = await this.store.getNextQuoteNumber();
      this.form.patchValue({
        numero,
        date: new Date().toISOString().slice(0, 10),
        remiseType: 'montant',
        remiseValue: 0
      });

      this.addLine();
    }

    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntil(this.destroy$))
      .subscribe(() => this.updateTotals());

    this.updateTotals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    } else {
      this.router.navigate(['/quotes']);
    }
  }

  cancel(): void {
    this.router.navigate(['/quotes']);
  }

  private updateTotals(): void {
    const quote = this.buildQuote();
    this.totals = this.calc.totals(quote);
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

  private buildQuote(): Quote {
    const raw = this.form.getRawValue();

    return {
      id: this.ensureCurrentId(),
      numero: (raw.numero ?? '').trim(),
      date: (raw.date ?? new Date().toISOString().slice(0, 10)).trim(),
      client: {
        nom: raw.client?.nom ?? '',
        adresse: raw.client?.adresse ?? '',
        tel: raw.client?.tel ?? '',
        mf: raw.client?.mf ?? '',
        email: raw.client?.email ?? ''
      },
      lignes: ((raw.lignes ?? []) as InvoiceLine[]).map((l) => this.normalizeLine(l)),
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

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ??
      `quote_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
