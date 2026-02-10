import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, startWith, takeUntil } from 'rxjs';
import { Invoice, RemiseType } from '../../models/invoice';
import { InvoiceLine } from '../../models/invoice-line';
import { InvoiceCalcService, InvoiceTotals } from '../../services/invoice-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';

const TVA_RATE = 19;

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  form = this.fb.group({
    numero: ['', Validators.required],
    date: ['', Validators.required],
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
    conditions: ['']
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

  // ✅ IMPORTANT: id stable pendant toute la création/édition
  private currentId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private store: InvoiceStoreService,
    public calc: InvoiceCalcService,
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
      // EDIT
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
        client: invoice.client,
        remiseType: invoice.remiseType ?? 'montant',
        remiseValue: invoice.remiseValue ?? 0,
        remiseAvantTVA: invoice.remiseAvantTVA ?? true,
        notes: invoice.notes ?? '',
        conditions: invoice.conditions ?? ''
      });

      this.setLines(invoice.lignes ?? []);
    } else {
      // NEW
      this.isEdit = false;

      // ✅ FIX: on crée l'id UNE SEULE FOIS
      this.currentId = this.ensureCurrentId();

      const numero = await this.store.getNextInvoiceNumber();
      this.form.patchValue({
        numero,
        date: new Date().toISOString().slice(0, 10),
        remiseType: 'montant',
        remiseValue: 0,
        remiseAvantTVA: true
      });

      this.addLine();
    }

    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntil(this.destroy$))
      .subscribe(() => this.updateTotals());

    // premier calcul
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
      this.router.navigate(['/invoices', invoice.id, 'preview'], {
  queryParams: { id: invoice.id }
});

    } else {
      this.router.navigate(['/invoices']);
    }
  }

  cancel(): void {
    this.router.navigate(['/invoices']);
  }

  private updateTotals(): void {
    const invoice = this.buildInvoice();
    this.totals = this.calc.totals(invoice);
  }

  private setLines(lines: InvoiceLine[]): void {
    this.lignes.clear();
    lines.forEach((line) => this.lignes.push(this.createLine(line)));
    if (lines.length === 0) this.addLine();
  }

  private createLine(line?: InvoiceLine): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      // ✅ id stable pour chaque ligne
      id: [line?.id ?? this.createId()],
      designation: [line?.designation ?? '', Validators.required],
      unite: [line?.unite ?? '', Validators.required],
      quantite: [line?.quantite ?? 0, [Validators.required, Validators.min(0)]],
      prixUnitaire: [line?.prixUnitaire ?? 0, [Validators.required, Validators.min(0)]],

      // TVA fixée à 19 (même si ton HTML affiche un input, on force côté TS aussi)
      tvaRate: [TVA_RATE]
    });
  }

  private buildInvoice(): Invoice {
    const raw = this.form.getRawValue();

    return {
      // ✅ utilise TOUJOURS currentId, ne jamais regénérer ici
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
      remiseAvantTVA: raw.remiseAvantTVA ?? true,
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
      `inv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
