import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, startWith, takeUntil } from 'rxjs';
import { StockItem } from '../../models/stock-item';
import { StockStoreService } from '../../services/stock-store.service';
import type { SpaInventoryResponse } from '../../types/electron';

type ProductType = 'fenetre' | 'porte' | 'box' | 'custom';

interface SerieFormValue {
  id: string;
  nom: string;
  sourceProductId: string;
  longueurBarre: number; // cm
  prixBarre: number;
}

interface PieceFormValue {
  productId: string;
  designation: string;
  serieId: string;
  longueur: number; // cm
  quantite: number;
}

interface AccessoryFormValue {
  productId?: string | null;
  designation?: string | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
}

interface CutPiece {
  designation: string;
  longueurCm: number;
}

interface BarPlan {
  index: number;
  pieces: CutPiece[];
  pertesCm: number;
  chuteCm: number;
  longueurUtiliseeCm: number;
  impossible: boolean;
}

interface SerieResult {
  id: string;
  nom: string;
  longueurBarreCm: number;
  prixBarre: number;
  longueurPiecesCm: number;
  pertesCm: number;
  consommationReelleCm: number;
  nbBarres: number;
  longueurAcheteeCm: number;
  chuteTotaleCm: number;
  coutAchete: number;
  prixParCm: number;
  coutConsomme: number;
  coutChute: number;
  bars: BarPlan[];
  hasImpossible: boolean;
}

interface EstimationResult {
  consommationTotaleCm: number;
  longueurAcheteeTotaleCm: number;
  chuteTotaleCm: number;
  coutBarresAchete: number;
  coutBarresConsomme: number;
  coutBarresChute: number;

  surfaceVerreM2: number;
  coutVerre: number;

  coutAccessoires: number;
  coutTotal: number;

  series: SerieResult[];
}

type PriceStatus = 'ok' | 'missing';

interface StockCatalogProduct {
  id: string;
  label: string;
  reference: string;
  category: string;
  serie: string;
  serieKey: string;
  unit: string;
  unitPrice: number;
  priceStatus: PriceStatus;
}

@Component({
  selector: 'app-estimation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './estimation.component.html',
  styleUrls: ['./estimation.component.css']
})
export class EstimationComponent implements OnInit, OnDestroy {
  private static readonly STANDARD_BAR_LENGTH_CM = 650;
  private readonly destroy$ = new Subject<void>();
  private readonly productById = new Map<string, StockCatalogProduct>();
  private stockCatalogInitialized = false;
  readonly standardBarLengthCm = EstimationComponent.STANDARD_BAR_LENGTH_CM;

  form = this.fb.group({
    series: this.fb.array([]),
    produit: this.fb.group({
      type: ['fenetre' as ProductType],
      largeur: [120, [Validators.min(0)]],
      hauteur: [100, [Validators.min(0)]],
      profondeur: [40, [Validators.min(0)]],
      cadreRenfort: [false]
    }),
    pieces: this.fb.array([]),
    options: this.fb.group({
      margeChute: [0],
      pertesCoupeCm: [0.2]
    }),
    verre: this.fb.group({
      activerVerre: [false],
      prixVerreM2: [0],
      surfaceVerreM2Manuelle: [0, [Validators.min(0)]]
    }),
    accessoires: this.fb.array([])
  });

  result: EstimationResult = {
    consommationTotaleCm: 0,
    longueurAcheteeTotaleCm: 0,
    chuteTotaleCm: 0,
    coutBarresAchete: 0,
    coutBarresConsomme: 0,
    coutBarresChute: 0,
    surfaceVerreM2: 0,
    coutVerre: 0,
    coutAccessoires: 0,
    coutTotal: 0,
    series: []
  };

  stockIntegrationReady = false;
  stockIntegrationMessage = '';
  availableSeries: string[] = [];
  profileProducts: StockCatalogProduct[] = [];
  accessoryProducts: StockCatalogProduct[] = [];

  constructor(
    private fb: FormBuilder,
    private stockStore: StockStoreService
  ) {
    this.addSerie('40', EstimationComponent.STANDARD_BAR_LENGTH_CM, 0);
    this.addSerie('76', EstimationComponent.STANDARD_BAR_LENGTH_CM, 0);
  }

  ngOnInit(): void {
    console.log('[estimation-page] load requested');
    // par défaut : générer une fenêtre
    this.generatePieces();
    void this.initializeStockIntegration();

    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntil(this.destroy$))
      .subscribe(() => {
        this.compute();
        console.log('[estimation-page] api response received');
        console.log(`[estimation-page] rendered items count: ${this.result.series.length}`);
        console.log('[estimation-page] empty state condition:', this.result.series.length === 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- getters ----------
  get series(): FormArray {
    return this.form.get('series') as FormArray;
  }

  get pieces(): FormArray {
    return this.form.get('pieces') as FormArray;
  }

  get accessoires(): FormArray {
    return this.form.get('accessoires') as FormArray;
  }

  get productType(): ProductType {
    return (this.form.get('produit.type')?.value as ProductType) ?? 'fenetre';
  }

  get seriesOptions(): { id: string; nom: string }[] {
    const values = (this.series.getRawValue() as SerieFormValue[]) ?? [];
    return values.map(v => ({ id: v.id, nom: (v.nom || v.id).trim() }));
  }

  get hasStockCatalog(): boolean {
    return this.profileProducts.length > 0 || this.accessoryProducts.length > 0;
  }

  get seriesDatalistId(): string {
    return 'estimation-series-datalist';
  }

  async initializeStockIntegration(): Promise<void> {
    try {
      await this.stockStore.load();
      this.stockStore.items$
        .pipe(takeUntil(this.destroy$))
        .subscribe((items) => {
          void this.refreshCatalogFromStock(items);
        });
    } catch (error) {
      this.stockIntegrationReady = false;
      this.stockIntegrationMessage = 'Stock/inventaire indisponible. Estimation en mode manuel.';
      console.warn('[estimation] stock integration failed', error);
    }
  }

  private async refreshCatalogFromStock(items: StockItem[]): Promise<void> {
    try {
      const inventory = await this.stockStore.getInventory();
      this.buildCatalogProducts(items, inventory);

      if (!this.stockCatalogInitialized) {
        this.reseedSeriesFromCatalog();
        this.stockCatalogInitialized = true;
      } else if (this.series.length === 0) {
        this.reseedSeriesFromCatalog();
      }

      this.syncAllSeriePrices();
      this.sanitizeAllPieceProductsBySerie();
      this.stockIntegrationReady = true;
      this.stockIntegrationMessage = '';
      this.compute();
    } catch (error) {
      this.stockIntegrationReady = false;
      this.stockIntegrationMessage = 'Stock/inventaire indisponible. Estimation en mode manuel.';
      console.warn('[estimation] stock catalog refresh failed', error);
    }
  }

  getProfileProductsForSerie(index: number): StockCatalogProduct[] {
    if (!this.profileProducts.length) {
      return [];
    }
    const serieRaw = this.series.at(index)?.get('nom')?.value;
    const serieKey = this.normalizeSerieKey(serieRaw);
    if (!serieKey) {
      return this.profileProducts;
    }
    const matched = this.profileProducts.filter((product) => product.serieKey === serieKey);
    return matched.length ? matched : this.profileProducts;
  }

  onSerieNameChanged(index: number): void {
    this.applySerieAutoPrice(index, false);
    this.compute();
  }

  onSerieProductChanged(index: number): void {
    this.applySerieAutoPrice(index, true);
    this.compute();
  }

  getSerieAutoPriceMessage(index: number): string | null {
    const serie = this.series.at(index)?.getRawValue() as SerieFormValue | undefined;
    if (!serie) return null;

    const product = this.resolveSerieProduct(serie);
    if (!product) {
      return 'Aucun profil stock trouvé pour cette série.';
    }
    if (product.unitPrice <= 0 && this.toNumber(serie.prixBarre) <= 0) {
      return `Prix non defini dans l'inventaire pour ${product.label}.`;
    }
    if (product.unitPrice > 0) {
      return `Prix auto: ${product.unitPrice.toFixed(2)} DT via ${product.label}.`;
    }
    return null;
  }

  onPieceProductChanged(index: number): void {
    const pieceGroup = this.pieces.at(index);
    if (!pieceGroup) return;

    const productId = String(pieceGroup.get('productId')?.value ?? '').trim();
    if (!productId) return;
    const product = this.productById.get(productId);
    if (!product) return;

    const serieId = this.ensureSerieFromProduct(product);
    pieceGroup.patchValue({
      designation: product.label,
      serieId
    }, { emitEvent: false });
    this.compute();
  }

  onPieceSerieChanged(index: number): void {
    this.sanitizePieceProductForSerie(index);
    this.compute();
  }

  getProfileProductsForPiece(index: number): StockCatalogProduct[] {
    if (!this.profileProducts.length) {
      return [];
    }

    const pieceGroup = this.pieces.at(index);
    if (!pieceGroup) {
      return this.profileProducts;
    }

    const serieId = String(pieceGroup.get('serieId')?.value ?? '').trim();
    if (!serieId) {
      return this.profileProducts;
    }

    const serieGroup = this.series.controls.find((control) => String(control.get('id')?.value ?? '') === serieId);
    const serieKey = this.normalizeSerieKey(serieGroup?.get('nom')?.value);
    if (!serieKey) {
      return this.profileProducts;
    }

    const matched = this.profileProducts.filter((product) => product.serieKey === serieKey);
    return matched.length ? matched : [];
  }

  onAccessoryProductChanged(index: number): void {
    const accessoryGroup = this.accessoires.at(index);
    if (!accessoryGroup) return;

    const productId = String(accessoryGroup.get('productId')?.value ?? '').trim();
    if (!productId) return;
    const product = this.productById.get(productId);
    if (!product) return;

    const patch = {
      designation: product.label,
      prixUnitaire: product.unitPrice > 0 ? product.unitPrice : this.toNumber(accessoryGroup.get('prixUnitaire')?.value)
    };
    accessoryGroup.patchValue(patch, { emitEvent: false });
    this.compute();
  }

  getAccessoryPriceMessage(index: number): string | null {
    const accessoryGroup = this.accessoires.at(index);
    if (!accessoryGroup) return null;
    const productId = String(accessoryGroup.get('productId')?.value ?? '').trim();
    if (!productId) return null;
    const product = this.productById.get(productId);
    if (!product) {
      return 'Produit accessoire introuvable.';
    }
    const unitPrice = this.toNumber(accessoryGroup.get('prixUnitaire')?.value);
    if (unitPrice <= 0) {
      return `Prix non defini dans l'inventaire pour ${product.label}.`;
    }
    return null;
  }

  isSeriePriceManual(index: number): boolean {
    const serie = this.series.at(index)?.getRawValue() as SerieFormValue | undefined;
    if (!serie) return true;
    const product = this.resolveSerieProduct(serie);
    return !product || product.unitPrice <= 0;
  }

  // ---------- UI helpers ----------
  pieceTotalCm(index: number): number {
    const p = this.pieces.at(index).value as PieceFormValue;
    return this.round1(this.toNumber(p.longueur) * Math.max(1, Math.floor(this.toNumber(p.quantite))));
  }

  // ---------- Séries ----------
  addSerie(nom: string = 'Serie', _longueurBarre: number = EstimationComponent.STANDARD_BAR_LENGTH_CM, prixBarre: number = 0): void {
    this.series.push(this.createSerie({ nom, longueurBarre: EstimationComponent.STANDARD_BAR_LENGTH_CM, prixBarre }));
    const nextIndex = this.series.length - 1;
    this.applySerieAutoPrice(nextIndex, false);
    // si aucune pièce n'a de série, on peut assigner la première
    if (this.pieces.length > 0) this.ensurePiecesSerie();
  }

  removeSerie(index: number): void {
    if (this.series.length <= 1) return;
    const removed = (this.series.at(index).value as SerieFormValue)?.id;
    this.series.removeAt(index);

    // re-assigner les pièces qui pointaient vers la série supprimée
    const firstId = (this.series.at(0).value as SerieFormValue)?.id;
    this.pieces.controls.forEach(ctrl => {
      if ((ctrl.get('serieId')?.value as string) === removed) {
        ctrl.get('serieId')?.setValue(firstId);
      }
    });
    this.syncAllSeriePrices();
  }

  private createSerie(initial?: Partial<SerieFormValue>): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      id: [initial?.id ?? this.createId('serie')],
      nom: [initial?.nom ?? 'Serie', Validators.required],
      sourceProductId: [initial?.sourceProductId ?? ''],
      longueurBarre: [EstimationComponent.STANDARD_BAR_LENGTH_CM, [Validators.required, Validators.min(1)]],
      prixBarre: [initial?.prixBarre ?? 0, [Validators.min(0)]]
    });
  }

  // ---------- Pièces / branches ----------
  addPiece(): void {
    const firstSerieId = (this.series.at(0).value as SerieFormValue)?.id ?? '';
    this.pieces.push(this.createPiece({ serieId: firstSerieId, productId: '' }));
  }

  removePiece(index: number): void {
    this.pieces.removeAt(index);
  }

  private createPiece(initial?: Partial<PieceFormValue>): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      productId: [initial?.productId ?? ''],
      designation: [initial?.designation ?? '', Validators.required],
      serieId: [initial?.serieId ?? '', Validators.required],
      longueur: [initial?.longueur ?? 0, [Validators.required, Validators.min(0)]],
      quantite: [initial?.quantite ?? 1, [Validators.required, Validators.min(1)]]
    });
  }

  private ensurePiecesSerie(): void {
    const firstSerieId = (this.series.at(0).value as SerieFormValue)?.id ?? '';
    this.pieces.controls.forEach(ctrl => {
      const val = (ctrl.get('serieId')?.value as string) ?? '';
      if (!val) ctrl.get('serieId')?.setValue(firstSerieId);
    });
  }

  // Génère automatiquement les branches selon dimensions
  generatePieces(): void {
    const raw = this.form.getRawValue();
    const type = (raw.produit?.type as ProductType) ?? 'fenetre';
    const largeur = this.toNumber(raw.produit?.largeur);
    const hauteur = this.toNumber(raw.produit?.hauteur);
    const profondeur = this.toNumber(raw.produit?.profondeur);
    const renfort = !!raw.produit?.cadreRenfort;

    const firstSerieId = (this.series.at(0).value as SerieFormValue)?.id ?? '';

    this.pieces.clear();

    if (type === 'custom') {
      // rien, l'utilisateur ajoute à la main
      return;
    }

    if (type === 'fenetre') {
      // 2 montants + 2 traverses
      this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
      return;
    }

    if (type === 'porte') {
      this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
      if (renfort) {
        this.pieces.push(this.createPiece({ designation: 'Renfort (traverse)', serieId: firstSerieId, longueur: largeur, quantite: 1 }));
      }
      return;
    }

    if (type === 'box') {
      // cadre (fenêtre) + 2 profondeurs
      this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Profondeur', serieId: firstSerieId, longueur: profondeur, quantite: 2 }));
      return;
    }
  }

  // ---------- Accessoires ----------
  addAccessory(): void {
    this.accessoires.push(this.createAccessory());
  }

  removeAccessory(index: number): void {
    this.accessoires.removeAt(index);
  }

  private createAccessory(): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      productId: [''],
      designation: [''],
      quantite: [1, [Validators.min(0)]],
      prixUnitaire: [0, [Validators.min(0)]]
    });
  }

  private buildCatalogProducts(items: StockItem[], inventory: SpaInventoryResponse | null): void {
    const inventoryMap = new Map((inventory?.items ?? []).map((entry) => [entry.product.id, entry]));

    const products: StockCatalogProduct[] = items.map((item) => {
      const inventoryEntry = inventoryMap.get(item.id);
      const unitPrice = Number(inventoryEntry?.unitPrice ?? 0) || 0;
      const priceStatus: PriceStatus = unitPrice > 0 ? 'ok' : 'missing';
      const serie = String(item.serie ?? '').trim();
      return {
        id: item.id,
        label: String(item.label ?? '').trim(),
        reference: String(item.reference ?? '').trim(),
        category: String(item.category ?? '').trim(),
        serie,
        serieKey: this.normalizeSerieKey(serie),
        unit: String(item.unit ?? '').trim(),
        unitPrice,
        priceStatus
      };
    });

    this.productById.clear();
    products.forEach((product) => this.productById.set(product.id, product));

    this.profileProducts = products
      .filter((product) => this.isProfileCategory(product.category, product.label, product.unit))
      .sort((a, b) => a.label.localeCompare(b.label));

    const accessoryPool = products.filter((product) => !this.isProfileCategory(product.category, product.label, product.unit));
    this.accessoryProducts = (accessoryPool.length ? accessoryPool : products)
      .sort((a, b) => a.label.localeCompare(b.label));

    const seriesMap = new Map<string, string>();
    products.forEach((product) => {
      if (!product.serieKey) return;
      if (!seriesMap.has(product.serieKey)) {
        seriesMap.set(product.serieKey, product.serie || product.serieKey.toUpperCase());
      }
    });

    this.availableSeries = Array.from(seriesMap.values()).sort((a, b) => this.compareSeries(a, b));
  }

  private reseedSeriesFromCatalog(): void {
    if (!this.availableSeries.length) {
      return;
    }

    this.series.clear();
    const seed = this.availableSeries.slice(0, 2);
    if (!seed.length) {
      seed.push('40');
    }
    seed.forEach((serieName) => this.addSerie(serieName, EstimationComponent.STANDARD_BAR_LENGTH_CM, 0));
    this.ensurePiecesSerie();
  }

  private syncAllSeriePrices(): void {
    for (let index = 0; index < this.series.length; index += 1) {
      this.applySerieAutoPrice(index, false);
    }
  }

  private applySerieAutoPrice(index: number, fromProductSelection: boolean): void {
    const serieGroup = this.series.at(index);
    if (!serieGroup) return;

    serieGroup.get('longueurBarre')?.setValue(EstimationComponent.STANDARD_BAR_LENGTH_CM, { emitEvent: false });

    const serie = serieGroup.getRawValue() as SerieFormValue;
    const selectedProductId = String(serie.sourceProductId ?? '').trim();
    let selectedProduct = selectedProductId ? this.productById.get(selectedProductId) ?? null : null;
    const serieKey = this.normalizeSerieKey(serie.nom);

    if (!selectedProduct || (serieKey && selectedProduct.serieKey !== serieKey)) {
      const best = this.findBestProfileProductForSerie(serieKey);
      selectedProduct = best;
      if (best) {
        serieGroup.get('sourceProductId')?.setValue(best.id, { emitEvent: false });
      } else if (fromProductSelection && selectedProductId) {
        serieGroup.get('sourceProductId')?.setValue('', { emitEvent: false });
      }
    }

    if (!selectedProduct) return;
    if (!serieKey && selectedProduct.serie) {
      serieGroup.get('nom')?.setValue(selectedProduct.serie, { emitEvent: false });
    }

    if (selectedProduct.unitPrice > 0) {
      serieGroup.get('prixBarre')?.setValue(selectedProduct.unitPrice, { emitEvent: false });
    }
  }

  private resolveSerieProduct(serie: SerieFormValue): StockCatalogProduct | null {
    const selectedProductId = String(serie.sourceProductId ?? '').trim();
    if (selectedProductId) {
      const selected = this.productById.get(selectedProductId);
      if (selected) return selected;
    }
    const serieKey = this.normalizeSerieKey(serie.nom);
    return this.findBestProfileProductForSerie(serieKey);
  }

  private findBestProfileProductForSerie(serieKey: string): StockCatalogProduct | null {
    const scoped = serieKey
      ? this.profileProducts.filter((product) => product.serieKey === serieKey)
      : this.profileProducts;
    const pool = scoped.length ? scoped : this.profileProducts;
    if (!pool.length) return null;

    const withPrice = pool.filter((product) => product.unitPrice > 0);
    const effectivePool = withPrice.length ? withPrice : pool;
    return [...effectivePool].sort((a, b) => {
      if (b.unitPrice !== a.unitPrice) return b.unitPrice - a.unitPrice;
      return a.label.localeCompare(b.label);
    })[0] ?? null;
  }

  private ensureSerieFromProduct(product: StockCatalogProduct): string {
    const productSerieKey = this.normalizeSerieKey(product.serie);
    const currentSeries = (this.series.getRawValue() as SerieFormValue[]) ?? [];
    const existingIndex = currentSeries.findIndex((serie) => this.normalizeSerieKey(serie.nom) === productSerieKey);
    if (existingIndex >= 0) {
      const existingId = String(currentSeries[existingIndex]?.id ?? '');
      if (existingId) {
        return existingId;
      }
    }

    const displaySerie = product.serie || this.availableSeries[0] || '40';
    this.addSerie(displaySerie, 650, product.unitPrice > 0 ? product.unitPrice : 0);
    const lastIndex = this.series.length - 1;
    const lastSeries = this.series.at(lastIndex)?.getRawValue() as SerieFormValue | undefined;
    if (lastSeries) {
      this.series.at(lastIndex)?.get('sourceProductId')?.setValue(product.id, { emitEvent: false });
      this.applySerieAutoPrice(lastIndex, true);
      return String(lastSeries.id ?? '');
    }
    return '';
  }

  // ---------- Reset ----------
  reset(): void {
    // garde les séries par défaut, mais reset valeurs
    const serieValues = (this.series.getRawValue() as SerieFormValue[]) ?? [];
    this.form.reset({
      produit: { type: 'fenetre', largeur: 120, hauteur: 100, profondeur: 40, cadreRenfort: false },
      options: { margeChute: 0, pertesCoupeCm: 0.2 },
      verre: { activerVerre: false, prixVerreM2: 0, surfaceVerreM2Manuelle: 0 },
      accessoires: []
    });

    // reset séries
    this.series.clear();
    if (serieValues.length > 0) {
      serieValues.forEach(s => this.addSerie(
        s.nom || 'Serie',
        EstimationComponent.STANDARD_BAR_LENGTH_CM,
        this.toNumber(s.prixBarre) || 0
      ));
    } else {
      this.addSerie('40', EstimationComponent.STANDARD_BAR_LENGTH_CM, 0);
      this.addSerie('76', EstimationComponent.STANDARD_BAR_LENGTH_CM, 0);
    }

    this.accessoires.clear();
    this.generatePieces();
    this.compute();
  }

  // ---------- Print ----------
  print(): void {
    window.print();
  }

  // ---------- Compute ----------
  compute(): void {
    const raw = this.form.getRawValue();

    const series = ((raw.series ?? []) as SerieFormValue[]).map(s => ({
      id: s.id,
      nom: (s.nom ?? '').trim() || s.id,
      longueurBarre: EstimationComponent.STANDARD_BAR_LENGTH_CM,
      prixBarre: Math.max(0, this.toNumber(s.prixBarre))
    }));

    const pieces = (raw.pieces ?? []) as PieceFormValue[];
    const pertesCoupeCm = Math.max(0, this.toNumber(raw.options?.pertesCoupeCm));

    const serieResults: SerieResult[] = series.map(serie => {
      const piecesSerie = pieces.filter(p => p.serieId === serie.id);

      const plan = this.buildCuttingPlan(piecesSerie, serie.longueurBarre, pertesCoupeCm);
      const prixParCm = serie.longueurBarre > 0 ? serie.prixBarre / serie.longueurBarre : 0;
      const coutAchete = plan.nbBarres * serie.prixBarre;
      const coutConsomme = plan.consommationReelleCm * prixParCm;
      const coutChute = Math.max(0, coutAchete - coutConsomme);

      return {
        id: serie.id,
        nom: serie.nom,
        longueurBarreCm: this.round1(serie.longueurBarre),
        prixBarre: this.round2(serie.prixBarre),
        longueurPiecesCm: this.round1(plan.longueurPiecesCm),
        pertesCm: this.round1(plan.pertesCm),
        consommationReelleCm: this.round1(plan.consommationReelleCm),
        nbBarres: plan.nbBarres,
        longueurAcheteeCm: this.round1(plan.longueurAcheteeCm),
        chuteTotaleCm: this.round1(plan.chuteTotaleCm),
        coutAchete: this.round2(coutAchete),
        prixParCm: this.round4(prixParCm),
        coutConsomme: this.round2(coutConsomme),
        coutChute: this.round2(coutChute),
        bars: plan.bars.map(bar => ({
          ...bar,
          pertesCm: this.round1(bar.pertesCm),
          chuteCm: this.round1(bar.chuteCm),
          longueurUtiliseeCm: this.round1(bar.longueurUtiliseeCm),
          pieces: bar.pieces.map(piece => ({
            ...piece,
            longueurCm: this.round1(piece.longueurCm)
          }))
        })),
        hasImpossible: plan.hasImpossible
      };
    });

    const consommationTotaleCm = this.round1(serieResults.reduce((s, r) => s + r.consommationReelleCm, 0));
    const longueurAcheteeTotaleCm = this.round1(serieResults.reduce((s, r) => s + r.longueurAcheteeCm, 0));
    const chuteTotaleCm = this.round1(serieResults.reduce((s, r) => s + r.chuteTotaleCm, 0));
    const coutBarresAchete = this.round2(serieResults.reduce((s, r) => s + r.coutAchete, 0));
    const coutBarresConsomme = this.round2(serieResults.reduce((s, r) => s + r.coutConsomme, 0));
    const coutBarresChute = this.round2(serieResults.reduce((s, r) => s + r.coutChute, 0));

    // verre (surface estimée par dimensions)
    const type = (raw.produit?.type as ProductType) ?? 'fenetre';
    const largeurCm = Math.max(0, this.toNumber(raw.produit?.largeur));
    const hauteurCm = Math.max(0, this.toNumber(raw.produit?.hauteur));

    let surfaceVerreM2 = 0;
    if (type === 'custom') {
      surfaceVerreM2 = Math.max(0, this.toNumberWithComma(raw.verre?.surfaceVerreM2Manuelle));
    } else if (type === 'fenetre' || type === 'porte' || type === 'box') {
      surfaceVerreM2 = (largeurCm / 100) * (hauteurCm / 100);
    }

    const activerVerre = !!raw.verre?.activerVerre;
    const prixVerreM2 = Math.max(0, this.toNumberWithComma(raw.verre?.prixVerreM2));
    const coutVerre = activerVerre ? surfaceVerreM2 * prixVerreM2 : 0;

    // accessoires
    const accessoires = (raw.accessoires ?? []) as AccessoryFormValue[];
    const coutAccessoires = accessoires.reduce((sum, a) => {
      const q = Math.max(0, this.toNumber(a.quantite));
      const pu = Math.max(0, this.toNumber(a.prixUnitaire));
      return sum + q * pu;
    }, 0);

    const coutTotal = coutBarresAchete + coutVerre + coutAccessoires;

    this.result = {
      consommationTotaleCm,
      longueurAcheteeTotaleCm,
      chuteTotaleCm,
      coutBarresAchete,
      coutBarresConsomme,
      coutBarresChute,
      surfaceVerreM2: this.round2(surfaceVerreM2),
      coutVerre: this.round2(coutVerre),
      coutAccessoires: this.round2(coutAccessoires),
      coutTotal: this.round2(coutTotal),
      series: serieResults
    };

    // console.log('DEBUG verre', raw.verre, { surfaceVerreM2, prixVerreM2, activerVerre, coutVerre });
  }

  private buildCuttingPlan(
    pieces: PieceFormValue[],
    longueurBarreCm: number,
    pertesCoupeCm: number
  ): {
    bars: BarPlan[];
    longueurPiecesCm: number;
    pertesCm: number;
    consommationReelleCm: number;
    nbBarres: number;
    longueurAcheteeCm: number;
    chuteTotaleCm: number;
    hasImpossible: boolean;
  } {
    const expanded: CutPiece[] = [];
    pieces.forEach(p => {
      const lengthCm = Math.max(0, this.toNumber(p.longueur));
      const qty = Math.max(1, Math.floor(this.toNumber(p.quantite)));
      for (let i = 0; i < qty; i += 1) {
        expanded.push({ designation: (p.designation ?? '').trim() || 'Pièce', longueurCm: lengthCm });
      }
    });

    const bars: BarPlan[] = [];
    const feasibleBars: BarPlan[] = [];
    const feasiblePieces: CutPiece[] = [];
    let hasImpossible = false;

    const sortedPieces = [...expanded].sort((a, b) => b.longueurCm - a.longueurCm);

    sortedPieces.forEach(piece => {
      if (longueurBarreCm <= 0 || piece.longueurCm <= 0 || piece.longueurCm > longueurBarreCm) {
        hasImpossible = true;
        bars.push({
          index: bars.length + 1,
          pieces: [piece],
          pertesCm: 0,
          chuteCm: 0,
          longueurUtiliseeCm: piece.longueurCm,
          impossible: true
        });
        return;
      }

      feasiblePieces.push(piece);

      let placed = false;
      for (const bar of feasibleBars) {
        const usedPieces = bar.pieces.reduce((sum, p) => sum + p.longueurCm, 0);
        const nextPerte = (bar.pieces.length + 1) * pertesCoupeCm;
        const nextUsed = usedPieces + piece.longueurCm + nextPerte;
        if (nextUsed <= longueurBarreCm + 1e-6) {
          bar.pieces.push(piece);
          placed = true;
          break;
        }
      }

      if (!placed) {
        const newBar: BarPlan = {
          index: bars.length + 1,
          pieces: [piece],
          pertesCm: 0,
          chuteCm: 0,
          longueurUtiliseeCm: 0,
          impossible: false
        };
        feasibleBars.push(newBar);
        bars.push(newBar);
      }
    });

    feasibleBars.forEach(bar => {
      const sumPieces = bar.pieces.reduce((sum, p) => sum + p.longueurCm, 0);
      bar.pertesCm = bar.pieces.length * pertesCoupeCm;
      bar.longueurUtiliseeCm = sumPieces + bar.pertesCm;
      bar.chuteCm = Math.max(0, longueurBarreCm - bar.longueurUtiliseeCm);
    });

    const longueurPiecesCm = feasiblePieces.reduce((sum, p) => sum + p.longueurCm, 0);
    const pertesCm = feasibleBars.reduce((sum, bar) => sum + bar.pertesCm, 0);
    const consommationReelleCm = longueurPiecesCm + pertesCm;
    const nbBarres = feasibleBars.length;
    const longueurAcheteeCm = nbBarres * longueurBarreCm;
    const chuteTotaleCm = feasibleBars.reduce((sum, bar) => sum + bar.chuteCm, 0);

    // Exemple: barre 650 cm, 2 x 400 cm => 2 barres, chute = 650-400-pertes sur chaque barre.
    return {
      bars,
      longueurPiecesCm,
      pertesCm,
      consommationReelleCm,
      nbBarres,
      longueurAcheteeCm,
      chuteTotaleCm,
      hasImpossible
    };
  }

  private isProfileCategory(category: string, label: string, unit: string): boolean {
    const normalized = `${category} ${label} ${unit}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return /(profil|profile|barre|montant|traverse|cadre)/.test(normalized);
  }

  private normalizeSerieKey(value: unknown): string {
    const normalized = String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/^serie\s*/i, '')
      .replace(/\s+/g, ' ');
    return normalized;
  }

  private compareSeries(a: string, b: string): number {
    const aNum = Number(this.normalizeSerieKey(a).replace(/[^0-9.]/g, ''));
    const bNum = Number(this.normalizeSerieKey(b).replace(/[^0-9.]/g, ''));
    if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  }

  private toNumber(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private toNumberWithComma(v: unknown): number {
    if (typeof v === 'string') {
      return this.toNumber(v.replace(',', '.'));
    }
    return this.toNumber(v);
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  private round1(n: number): number {
    return Math.round((n + Number.EPSILON) * 10) / 10;
  }

  private round4(n: number): number {
    return Math.round((n + Number.EPSILON) * 10000) / 10000;
  }

  private sanitizeAllPieceProductsBySerie(): void {
    for (let index = 0; index < this.pieces.length; index += 1) {
      this.sanitizePieceProductForSerie(index);
    }
  }

  private sanitizePieceProductForSerie(index: number): void {
    const pieceGroup = this.pieces.at(index);
    if (!pieceGroup) return;

    const productId = String(pieceGroup.get('productId')?.value ?? '').trim();
    if (!productId) return;

    const allowedProducts = this.getProfileProductsForPiece(index);
    const allowedIds = new Set(allowedProducts.map((product) => product.id));
    if (allowedIds.has(productId)) return;

    const selectedProduct = this.productById.get(productId);
    const currentDesignation = String(pieceGroup.get('designation')?.value ?? '').trim();
    pieceGroup.patchValue({
      productId: '',
      designation: selectedProduct && currentDesignation === selectedProduct.label ? '' : currentDesignation
    }, { emitEvent: false });
  }

  private createId(prefix: string): string {
    return globalThis.crypto?.randomUUID?.() ?? `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}


