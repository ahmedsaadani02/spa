import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { StockStoreService } from '../../services/stock-store.service';
import { StockCategory, StockColor, StockItem, StockSerie } from '../../models/stock-item';
import { StockMovementType } from '../../models/stock-movement';
import { Lang, STOCK_I18N } from './stock-i18n';
import type { SpaProductMetadata } from '../../types/electron';

interface StockGroup {
  category: StockCategory;
  serie: StockSerie;
  items: StockItem[];
}

interface MovementModalState {
  open: boolean;
  item: StockItem | null;
  type: StockMovementType;
  availableColors: StockColor[];
}

interface ArchiveModalState {
  open: boolean;
  item: StockItem | null;
}

type ProductModalMode = 'create' | 'edit';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  open: boolean;
  type: ToastType;
  title: string;
  message: string;
  icon: string;
  progress: number;
}

interface StockFilterState {
  search: string;
  serie: string;
  category: string;
  color: string;
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private toastTimer?: number;
  private toastProgressTimer?: number;
  private readonly imageFallbackIndex = new Map<string, number>();
  private readonly missingImages = new Set<string>();
  private readonly imageExtensions = ['png', 'webp', 'jpg', 'jpeg'];
  private readonly knownCategoryOrder = ['profil', 'accessoire', 'joint'];
  private readonly knownSeriesOrder = ['40', '67', 'porte-securite'];
  private readonly knownColorOrder = ['blanc', 'gris', 'noir'];
  private readonly placeholderImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="%23f1f5f9"/><path d="M24 60l14-14 10 10 14-18 10 22H24z" fill="%2394a3b8"/><circle cx="34" cy="34" r="6" fill="%2394a3b8"/></svg>';
  private readonly imageKeyOverrides = new Map<string, string>([
    ['busette antivient', 'busette antivent'],
    ['busette anti-vent', 'busette antivent'],
    ['busette antivent', 'busette antivent'],
    ['joint de vitrage 3mm', 'Joint vitrage 3mm'],
    ['joint de bourrage 2mm', 'joint de bourrage 2mm'],
    ['joint brosse (fin seal) 6 mm', 'joint brosse(fin seal) 6 mm'],
    ['joint u de vitarge 6 mm', 'joint U de vitarge 6 mm']
  ]);

  lang: Lang = 'fr';
  get t() {
    return STOCK_I18N[this.lang];
  }
  get isAr() {
    return this.lang === 'ar';
  }

  filters = this.fb.group({
    search: [''],
    serie: ['all'],
    category: ['all'],
    color: ['all']
  });

  movementForm = this.fb.group({
    color: ['blanc' as StockColor],
    delta: [1, [Validators.required, Validators.min(1)]],
    adjustSign: ['+' as '+' | '-'],
    reason: ['']
  });

  productForm = this.fb.group({
    reference: [''],
    label: ['', Validators.required],
    category: ['accessoire', Validators.required],
    serie: ['40', Validators.required],
    unit: ['piece', Validators.required],
    description: [''],
    lowStockThreshold: [0, [Validators.min(0)]]
  });

  groupedItems: StockGroup[] = [];
  totalItems = 0;
  alertItems = 0;
  filterCategoryOptions: string[] = ['profil', 'accessoire', 'joint'];
  filterSeriesOptions: string[] = ['40', '67', 'porte-securite'];
  filterColorOptions: string[] = ['blanc', 'gris', 'noir'];
  categoryOptions: string[] = ['profil', 'accessoire', 'joint'];
  seriesOptions: string[] = ['40', '67', 'porte-securite'];
  colorOptions: string[] = ['blanc', 'gris', 'noir'];

  modal: MovementModalState = {
    open: false,
    item: null,
    type: 'IN',
    availableColors: ['blanc', 'gris', 'noir']
  };
  submittingMovement = false;
  movementError = '';

  productModalOpen = false;
  productModalMode: ProductModalMode = 'create';
  editingProductId: string | null = null;
  selectedImageRef: string | null = null;
  selectedImagePreview = this.placeholderImage;
  selectedImageName = '';
  selectedProductColors: string[] = ['blanc', 'gris', 'noir'];
  customCategoryInput = '';
  customSeriesInput = '';
  customColorInput = '';
  creatingProduct = false;
  archivingProduct = false;
  archiveModal: ArchiveModalState = {
    open: false,
    item: null
  };
  private productMetadata: SpaProductMetadata = {
    categories: ['profil', 'accessoire', 'joint'],
    series: ['40', '67', 'porte-securite'],
    colors: ['blanc', 'gris', 'noir']
  };

  toast: ToastState = {
    open: false,
    type: 'info',
    title: '',
    message: '',
    icon: '',
    progress: 100
  };

  private readonly TOAST_DURATION = 3500;
  private readonly TOAST_ICONS: Record<ToastType, string> = {
    success: 'OK',
    error: 'ERR',
    info: 'INFO'
  };

  constructor(
    private fb: FormBuilder,
    private store: StockStoreService,
    private auth: AuthService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  get canManageStock(): boolean {
    return this.auth.hasPermission('manageStock');
  }

  get canAddStock(): boolean {
    return this.auth.hasPermission('addStock');
  }

  get canRemoveStock(): boolean {
    return this.auth.hasPermission('removeStock');
  }

  get canAdjustStock(): boolean {
    return this.auth.hasPermission('adjustStock');
  }

  get canCreateProduct(): boolean {
    return this.canManageStock;
  }

  get canEditProduct(): boolean {
    return this.auth.hasPermission('editStockProduct');
  }

  get canArchiveProduct(): boolean {
    return this.auth.hasPermission('archiveStockProduct');
  }

  get productModalTitle(): string {
    return this.productModalMode === 'edit' ? 'Modifier le produit' : this.t.modalNouveauProduit;
  }

  switchLang(lang: Lang): void {
    this.lang = lang;
  }

  async ngOnInit(): Promise<void> {
    console.log('[stock-page] load requested');
    await this.auth.ensureInitialized();

    this.store.items$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.recomputeProductFormOptions(items);
      });

    combineLatest([
      this.store.items$,
      this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()))
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([items]) => {
        try {
          this.zone.run(() => {
            console.log('[stock-list] reload requested');
            const previousFilters = this.getFilterSnapshot();
            const activeFilters = this.syncFilterOptions(items, previousFilters);
            const search = this.toSafeLower(activeFilters.search);
            const serie = activeFilters.serie;
            const category = activeFilters.category;
            const color = activeFilters.color;
            console.log(`[stock-list] response count: ${Array.isArray(items) ? items.length : 0}`);

            const filtered = (Array.isArray(items) ? items : []).filter((item) => {
              if (!item) return false;
              const reference = this.toSafeLower(item.reference);
              const label = this.toSafeLower(item.label);
              const matchesSearch = !search || reference.includes(search) || label.includes(search);
              const matchesSerie = serie === 'all' || item.serie === serie;
              const matchesCategory = category === 'all' || item.category === category;
              const matchesColor = color === 'all' || this.hasColor(item, color as StockColor);
              return matchesSearch && matchesSerie && matchesCategory && matchesColor;
            });

            this.totalItems = filtered.length;
            this.alertItems = filtered.filter((item) => this.isLowStock(item)).length;
            this.groupedItems = this.groupByCategory(filtered);
            this.cdr.detectChanges();
            console.log(`[stock-list] rendered count: ${this.totalItems}`);
            console.log(`[stock-page] rendered items count: ${this.totalItems}`);
            console.log('[stock-page] empty state condition:', this.totalItems === 0);
          });
        } catch (error) {
          console.error('[stock] render guard caught error in filters pipeline', error);
          this.zone.run(() => {
            this.totalItems = 0;
            this.alertItems = 0;
            this.groupedItems = [];
            this.cdr.detectChanges();
            console.log('[stock-page] rendered items count: 0');
            console.log('[stock-page] empty state condition:', true);
          });
        }
      });

    this.store.productMetadata$
      .pipe(takeUntil(this.destroy$))
      .subscribe((metadata) => {
        this.productMetadata = metadata;
        this.mergeMetadataIntoOptions();
      });

    void this.store.warmStockCatalog();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearToastTimers();
  }

  trackById(_: number, item: StockItem): string {
    return item.id;
  }

  openMove(item: StockItem, type: StockMovementType): void {
    const action = this.getMovementActionKey(type);
    console.log(`[stock:${action}] click received`, { itemId: item?.id ?? null });
    console.log('[archives-ui] click received', { action: `stock:${action}`, itemId: item?.id ?? null });
    if (!this.canOpenMovement(type)) {
      return;
    }

    const colors = this.getAvailableColors(item);
    console.log(`[stock:${action}] handler entered`, { itemId: item.id });
    this.runStockUiUpdate(`stock:${action}`, () => {
      this.modal = { open: true, item, type, availableColors: colors };
      this.submittingMovement = false;
      this.movementError = '';
      this.movementForm.reset({
        color: colors[0] ?? 'noir',
        delta: 1,
        adjustSign: '+',
        reason: ''
      });
    });
  }

  closeModal(): void {
    if (this.submittingMovement) {
      return;
    }
    this.movementError = '';
    this.submittingMovement = false;
    this.modal = { open: false, item: null, type: 'IN', availableColors: ['blanc', 'gris', 'noir'] };
  }

  async submitMovement(): Promise<void> {
    if (!this.modal.item) return;
    const action = this.getMovementActionKey(this.modal.type);
    if (!this.canOpenMovement(this.modal.type)) {
      return;
    }
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    const raw = this.movementForm.getRawValue();
    const delta = Math.abs(Number(raw.delta) || 0);
    if (delta === 0) return;

    const signedDelta = this.modal.type === 'ADJUST'
      ? (raw.adjustSign === '-' ? -delta : delta)
      : delta;

    this.runStockUiUpdate(`stock:${action}`, () => {
      this.submittingMovement = true;
      this.movementError = '';
    });

    try {
      console.log(`[stock:${action}] request sent`, {
        itemId: this.modal.item.id,
        color: raw.color,
        delta: signedDelta
      });
      await this.store.moveStock({
        itemId: this.modal.item.id,
        color: raw.color as StockColor,
        type: this.modal.type,
        delta: signedDelta,
        reason: raw.reason ?? ''
      });
      console.log(`[stock:${action}] response received`, { ok: true, itemId: this.modal.item.id });
    } catch (error) {
      const message = this.resolveMovementError(error);
      console.log(`[stock:${action}] response received`, { ok: false, message });
      this.runStockUiUpdate(`stock:${action}`, () => {
        this.submittingMovement = false;
        this.movementError = message;
        this.showToast('error', message);
      });
      return;
    }

    const toastType: ToastType = this.modal.type === 'IN' ? 'success' : 'info';
    const toastMessage = this.modal.type === 'IN'
      ? this.t.produitAjoute
      : this.modal.type === 'OUT'
        ? this.t.produitRetire
        : this.t.stockAjuste;

    this.runStockUiUpdate(`stock:${action}`, () => {
      this.submittingMovement = false;
      this.closeModal();
      this.showToast(toastType, toastMessage);
    });
  }

  openCreateProductModal(): void {
    if (!this.canCreateProduct) {
      this.showToast('error', this.t.droitsCreationManquants);
      return;
    }

    this.productModalMode = 'create';
    this.editingProductId = null;
    this.productForm.reset({
      reference: '',
      label: '',
      category: this.categoryOptions[0] ?? 'accessoire',
      serie: this.seriesOptions[0] ?? '40',
      unit: 'piece',
      description: '',
      lowStockThreshold: 0
    });
    this.selectedProductColors = this.getDefaultSelectedColors();
    this.selectedImageRef = null;
    this.selectedImagePreview = this.placeholderImage;
    this.selectedImageName = '';
    this.customCategoryInput = '';
    this.customSeriesInput = '';
    this.customColorInput = '';
    this.productModalOpen = true;
  }

  openEditProductModal(item: StockItem): void {
    console.log('[stock:edit] click received', { itemId: item?.id ?? null });
    console.log('[archives-ui] click received', { action: 'stock:edit', itemId: item?.id ?? null });
    if (!this.canEditProduct) {
      this.runStockUiUpdate('stock:edit', () => {
        this.showToast('error', this.t.droitsCreationManquants);
      });
      return;
    }

    console.log('[stock:edit] handler entered');
    console.log('[stock:edit] response received', { ok: true, mode: 'local-open-modal' });
    this.runStockUiUpdate('stock:edit', () => {
      this.productModalMode = 'edit';
      this.editingProductId = item.id;
      this.productForm.reset({
        reference: item.reference,
        label: item.label,
        category: item.category,
        serie: item.serie,
        unit: item.unit,
        description: item.description ?? '',
        lowStockThreshold: item.lowStockThreshold ?? 0
      });
      this.selectedProductColors = this.getAvailableColors(item);
      this.selectedImageRef = null;
      this.selectedImagePreview = this.getImageSrc(item);
      this.selectedImageName = '';
      this.customCategoryInput = '';
      this.customSeriesInput = '';
      this.customColorInput = '';
      this.ensureOptionsInclude(item.category, item.serie, this.selectedProductColors);
      this.productModalOpen = true;
    });
  }

  closeCreateProductModal(): void {
    this.productModalOpen = false;
    this.creatingProduct = false;
    this.editingProductId = null;
    this.productModalMode = 'create';
  }

  async pickProductImage(): Promise<void> {
    if (!this.canCreateProduct) {
      return;
    }

    const selection = await this.store.selectProductImage();
    if (selection?.error) {
      this.showToast('error', this.resolveImageSelectionError(selection.error, selection.message));
      return;
    }
    if (!selection || selection.canceled) {
      return;
    }

    this.selectedImageRef = selection.imageRef ?? null;
    this.selectedImagePreview = selection.imageUrl || this.placeholderImage;
    this.selectedImageName = selection.fileName ?? '';
  }

  onProductPreviewError(): void {
    if (this.selectedImagePreview === this.placeholderImage) {
      return;
    }
    this.selectedImagePreview = this.placeholderImage;
    if (this.selectedImageName) {
      this.showToast('error', "Impossible d'afficher l'image selectionnee.");
    }
  }

  isColorSelected(color: string): boolean {
    return this.selectedProductColors.includes(color);
  }

  onColorSelectionChange(color: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const checked = !!target?.checked;
    if (checked) {
      if (!this.selectedProductColors.includes(color)) {
        this.selectedProductColors = [...this.selectedProductColors, color];
      }
      return;
    }

    this.selectedProductColors = this.selectedProductColors.filter((entry) => entry !== color);
  }

  async addCustomCategory(): Promise<void> {
    if (!this.canCreateProduct) {
      this.showToast('error', this.t.droitsCreationManquants);
      return;
    }
    const value = this.normalizeTagValue(this.customCategoryInput);
    if (!value) return;
    const result = await this.store.addProductMetadata('category', value);
    if (!result.ok) {
      this.showToast('error', this.resolveMetadataAddError(result.message, 'categorie'));
      return;
    }
    const persisted = result.value || value;
    if (!this.categoryOptions.includes(persisted)) {
      this.categoryOptions = this.sortTags([...this.categoryOptions, persisted], this.knownCategoryOrder);
    }
    this.productForm.controls.category.setValue(persisted);
    this.customCategoryInput = '';
    this.showToast('success', result.alreadyExists ? 'Categorie deja disponible.' : 'Categorie ajoutee.');
  }

  async addCustomSeries(): Promise<void> {
    if (!this.canCreateProduct) {
      this.showToast('error', this.t.droitsCreationManquants);
      return;
    }
    const value = this.normalizeTagValue(this.customSeriesInput);
    if (!value) return;
    const result = await this.store.addProductMetadata('serie', value);
    if (!result.ok) {
      this.showToast('error', this.resolveMetadataAddError(result.message, 'serie'));
      return;
    }
    const persisted = result.value || value;
    if (!this.seriesOptions.includes(persisted)) {
      this.seriesOptions = this.sortTags([...this.seriesOptions, persisted], this.knownSeriesOrder);
    }
    this.productForm.controls.serie.setValue(persisted);
    this.customSeriesInput = '';
    this.showToast('success', result.alreadyExists ? 'Serie deja disponible.' : 'Serie ajoutee.');
  }

  async addCustomColor(): Promise<void> {
    if (!this.canCreateProduct) {
      this.showToast('error', this.t.droitsCreationManquants);
      return;
    }
    const value = this.normalizeTagValue(this.customColorInput);
    if (!value) return;
    const result = await this.store.addProductMetadata('color', value);
    if (!result.ok) {
      this.showToast('error', this.resolveMetadataAddError(result.message, 'couleur'));
      return;
    }
    const persisted = result.value || value;
    if (!this.colorOptions.includes(persisted)) {
      this.colorOptions = this.sortTags([...this.colorOptions, persisted], this.knownColorOrder);
    }
    if (!this.selectedProductColors.includes(persisted)) {
      this.selectedProductColors = [...this.selectedProductColors, persisted];
    }
    this.customColorInput = '';
    this.showToast('success', result.alreadyExists ? 'Couleur deja disponible.' : 'Couleur ajoutee.');
  }

  async submitProduct(): Promise<void> {
    console.log('[product-create] click received');
    console.log('[product-create] submit started');
    if (!this.canCreateProduct) {
      this.showToast('error', this.t.droitsCreationManquants);
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const form = this.productForm.getRawValue();
    const colors: StockColor[] = this.selectedProductColors
      .map((value) => this.normalizeTagValue(value))
      .filter((value): value is string => !!value);
    if (!colors.length) {
      this.showToast('error', this.t.couleurObligatoire);
      return;
    }

    const label = String(form.label ?? '').trim();
    if (!label) {
      this.productForm.controls.label.markAsTouched();
      return;
    }

    const reference = String(form.reference ?? '').trim() || label;
    this.runProductCreateUiUpdate(() => {
      this.creatingProduct = true;
    });

    try {
      const payload = {
        reference,
        label,
        description: String(form.description ?? '').trim(),
        category: this.normalizeTagValue(form.category),
        serie: this.normalizeTagValue(form.serie),
        unit: String(form.unit ?? 'piece').trim() || 'piece',
        colors,
        imageRef: this.selectedImageRef,
        lowStockThreshold: Math.max(0, Number(form.lowStockThreshold ?? 0) || 0)
      };

      console.log('[product-create] request sent', {
        mode: this.productModalMode,
        reference: payload.reference,
        category: payload.category,
        serie: payload.serie,
        colorsCount: payload.colors.length
      });

      if (this.productModalMode === 'edit') {
        if (!this.editingProductId) {
          this.showToast('error', 'Produit introuvable pour modification.');
          return;
        }
        const result = await this.store.updateProduct(this.editingProductId, payload);
        console.log('[product-create] response received', { ok: result?.ok === true, mode: 'edit', message: result?.message ?? null });
        if (!result.ok) {
          this.showToast('error', this.resolveProductUpdateError(result.message));
          return;
        }
        this.runProductCreateUiUpdate(() => {
          this.closeCreateProductModal();
          this.showToast('success', 'Produit modifie avec succes.');
        });
        return;
      }

      const created = await this.store.createProduct(payload);
      console.log('[product-create] response received', { ok: created, mode: 'create' });
      if (!created) {
        this.showToast('error', this.t.creationProduitKo);
        return;
      }
      this.runProductCreateUiUpdate(() => {
        this.closeCreateProductModal();
        this.showToast('success', this.t.creationProduitOk);
      });
    } catch (error) {
      console.log('[product-create] response received', {
        ok: false,
        mode: this.productModalMode,
        message: error instanceof Error ? error.message : String(error ?? '')
      });
      this.showToast('error', this.resolveProductCreateError(error));
    } finally {
      this.runProductCreateUiUpdate(() => {
        this.creatingProduct = false;
      });
    }
  }

  archiveProduct(item: StockItem): void {
    console.log('[stock:archive] click received', { itemId: item?.id ?? null });
    console.log('[archives-ui] click received', { action: 'stock:archive', itemId: item?.id ?? null });
    this.openArchiveModal(item);
  }

  openArchiveModal(item: StockItem): void {
    if (!this.canArchiveProduct) {
      this.runStockUiUpdate('stock:archive', () => {
        this.showToast('error', this.t.droitsCreationManquants);
      });
      return;
    }

    if (!item?.id) {
      return;
    }

    if (this.archivingProduct) {
      return;
    }
    console.log('[stock:archive] handler entered');
    this.runStockUiUpdate('stock:archive', () => {
      this.archiveModal = {
        open: true,
        item
      };
    });
  }

  closeArchiveModal(): void {
    if (this.archivingProduct) return;
    this.runStockUiUpdate('stock:archive', () => {
      this.archiveModal = { open: false, item: null };
    });
  }

  async confirmArchiveProduct(): Promise<void> {
    const item = this.archiveModal.item;
    console.log('[stock:archive] click received', { itemId: item?.id ?? null, confirm: true });
    console.log('[archives-ui] click received', { action: 'stock:archive', itemId: item?.id ?? null, confirm: true });
    if (!item?.id || this.archivingProduct) return;
    console.log('[stock:archive] handler entered');
    this.runStockUiUpdate('stock:archive', () => {
      this.archivingProduct = true;
    });

    try {
      console.log('[stock:archive] request sent', { itemId: item.id });
      const archived = await this.store.archiveProduct(item.id);
      console.log('[stock:archive] response received', { ok: archived, itemId: item.id });
      if (!archived) {
        this.runStockUiUpdate('stock:archive', () => {
          this.showToast('error', "Impossible d'archiver le produit.");
        });
        return;
      }
      console.log('[stock:archive] success', { itemId: item.id });
      this.runStockUiUpdate('stock:archive', () => {
        this.showToast('success', 'Produit archive avec succes.');
        this.archiveModal = { open: false, item: null };
      });
    } catch (error) {
      const message = this.resolveProductArchiveError(error);
      console.log('[stock:archive] response received', { ok: false, message });
      this.runStockUiUpdate('stock:archive', () => {
        this.showToast('error', message);
      });
    } finally {
      this.runStockUiUpdate('stock:archive', () => {
        this.archivingProduct = false;
      });
    }
  }

  showToast(type: ToastType, message: string): void {
    this.clearToastTimers();
    const title = type === 'success' ? this.t.succes : type === 'error' ? this.t.erreur : this.t.info;

    this.toast = {
      open: true,
      type,
      title,
      message,
      icon: this.TOAST_ICONS[type],
      progress: 100
    };

    const step = 100 / (this.TOAST_DURATION / 50);
    let progress = 100;
    this.toastProgressTimer = window.setInterval(() => {
      progress = Math.max(0, progress - step);
      this.toast = { ...this.toast, progress };
    }, 50);
    this.toastTimer = window.setTimeout(() => this.closeToast(), this.TOAST_DURATION);
  }

  closeToast(): void {
    this.toast = { ...this.toast, open: false };
    this.clearToastTimers();
  }

  private clearToastTimers(): void {
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
    if (this.toastProgressTimer) {
      window.clearInterval(this.toastProgressTimer);
      this.toastProgressTimer = undefined;
    }
  }

  getQuantity(item: StockItem, color: StockColor): number {
    return Number(item.quantities[color] ?? 0) || 0;
  }

  getColorStatus(item: StockItem, color: StockColor): 'is-zero' | 'is-low' | 'is-ok' {
    const qty = this.getQuantity(item, color);
    if (qty <= 0) return 'is-zero';
    if (qty <= Math.max(1, item.lowStockThreshold || 1)) return 'is-low';
    return 'is-ok';
  }

  getColorStatusLabel(item: StockItem, color: StockColor): string {
    const status = this.getColorStatus(item, color);
    if (status === 'is-zero') return this.t.rupture;
    if (status === 'is-low') return this.t.stockFaible;
    return this.t.ok;
  }

  getColorLabel(color: StockColor): string {
    const normalized = this.normalizeTagValue(color);
    if (normalized === 'blanc') return this.t.blanc;
    if (normalized === 'gris') return this.t.gris;
    if (normalized === 'noir') return this.t.noir;
    return this.humanizeTag(color);
  }

  getCategoryLabel(category: string): string {
    const normalized = this.normalizeTagValue(category);
    if (normalized === 'profil') return this.t.profils;
    if (normalized === 'accessoire') return this.t.accessoires;
    if (normalized === 'joint') return this.t.joints;
    return this.humanizeTag(category);
  }

  getSerieLabel(serie: string): string {
    const normalized = this.normalizeTagValue(serie);
    if (normalized === 'porte-securite') return this.t.porteSecurite;
    return this.humanizeTag(serie);
  }

  getAvailableColors(item: StockItem): StockColor[] {
    const colors = Object.keys(item.quantities) as StockColor[];
    const sorted = colors.sort((a, b) => this.compareColorOrder(a, b));
    return sorted.length ? sorted : ['noir'];
  }

  isItemFullyOut(item: StockItem): boolean {
    return this.getAvailableColors(item).every((color) => this.getQuantity(item, color) <= 0);
  }

  isLowStock(item: StockItem): boolean {
    return this.getAvailableColors(item).some((color) => this.getQuantity(item, color) <= Math.max(1, item.lowStockThreshold || 1));
  }

  getImageSrc(item: StockItem): string {
    if (!item || !item.id) return this.placeholderImage;
    const key = item.id;
    const candidates = this.getImageCandidates(item);
    if (!candidates.length) return this.placeholderImage;
    const index = this.imageFallbackIndex.get(key) ?? 0;
    return candidates[Math.min(index, candidates.length - 1)];
  }

  onImageError(event: Event, item: StockItem): void {
    if (!item || !item.id) return;
    const key = item.id;
    const candidates = this.getImageCandidates(item);
    const target = event.target as HTMLImageElement | null;
    if (target && target.src === this.placeholderImage) {
      return;
    }
    const nextIndex = (this.imageFallbackIndex.get(key) ?? 0) + 1;
    if (nextIndex < candidates.length) {
      this.imageFallbackIndex.set(key, nextIndex);
      if (target) target.src = candidates[nextIndex];
      return;
    }

    if (!this.missingImages.has(key)) {
      console.warn('[stock:image] unresolved image, fallback to placeholder', {
        itemId: item.id,
        reference: item.reference,
        imageUrl: item.imageUrl,
        candidates
      });
    }
    this.missingImages.add(key);
    this.imageFallbackIndex.set(key, candidates.length);
    if (target && target.src !== this.placeholderImage) {
      target.src = this.placeholderImage;
    }
  }

  isImageMissing(item: StockItem): boolean {
    return !!item?.id && this.missingImages.has(item.id);
  }

  private hasColor(item: StockItem, color: StockColor): boolean {
    return !!item?.quantities && Object.prototype.hasOwnProperty.call(item.quantities, color);
  }

  private getImageCandidates(item: StockItem): string[] {
    if (!item) return [this.placeholderImage];
    const candidates: string[] = [];
    const direct = typeof item.imageUrl === 'string' ? item.imageUrl.trim().replace(/\\/g, '/') : '';

    // Data URLs are self-contained — skip all asset fallback logic
    if (/^data:/i.test(direct)) {
      return [direct, 'assets/placeholder.png', this.placeholderImage];
    }

    const directIsPlaceholder = this.isPlaceholderCandidate(direct);
    if (direct && !directIsPlaceholder) {
      candidates.push(direct);
      const directFileName = this.extractImageFileName(direct);
      if (directFileName) {
        candidates.push(`assets/${encodeURIComponent(directFileName)}`);
      }
    }

    const imageKey = this.getImageKey(item);
    if (imageKey) {
      const normalized = this.normalizeCode(imageKey);
      const slug = this.slugifyCode(imageKey);
      const rawName = encodeURIComponent(normalized);
      const slugName = encodeURIComponent(slug);
      this.imageExtensions.forEach((ext) => {
        if (slug) candidates.push(`assets/${slugName}.${ext}`);
        candidates.push(`assets/${rawName}.${ext}`);
      });
    }

    if (direct && directIsPlaceholder) {
      candidates.push(direct);
    }
    candidates.push('assets/placeholder.png');
    candidates.push(this.placeholderImage);
    return Array.from(new Set(candidates));
  }

  private isPlaceholderCandidate(value: string): boolean {
    if (!value) return false;
    const normalized = value.toLowerCase();
    return normalized.includes('placeholder') || value === this.placeholderImage;
  }

  private extractImageFileName(value: string): string {
    if (!value) return '';
    try {
      const decoded = decodeURIComponent(value);
      const segments = decoded.split('/');
      const fileName = segments[segments.length - 1] ?? '';
      if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName)) {
        return fileName;
      }
      return '';
    } catch {
      return '';
    }
  }

  private getImageKey(item: StockItem): string {
    if (!item) return '';
    const reference = item.reference?.trim() ?? '';
    const label = item.label?.trim() ?? '';
    if (reference && this.isCodeLike(reference)) return this.normalizeCode(reference);
    const override = this.imageKeyOverrides.get(label.toLowerCase());
    if (override) return override;
    if (label && this.isCodeLike(label)) return this.normalizeCode(label);
    return label || reference;
  }

  private normalizeCode(code: string): string {
    return code.trim().replace(/\s+/g, ' ');
  }

  private slugifyCode(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/(\d+)\s*mm\b/g, '$1mm')
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '-')
      .replace(/-+/g, '-');
  }

  private isCodeLike(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) return false;
    if (/^\d{2,3}\s*\d{2,3}$/.test(normalized)) return true;
    if (/^[A-Z]{1,4}\d+\s*[A-Z]\d+$/i.test(normalized)) return true;
    if (/^PS-ACC-\d{2}$/i.test(normalized)) return true;
    return false;
  }

  private syncFilterOptions(items: StockItem[], previousFilters: StockFilterState): StockFilterState {
    console.log('[stock-filters] recompute requested');
    const categories = new Set<string>();
    const series = new Set<string>();
    const colors = new Set<string>();

    (items || []).forEach((item) => {
      if (item?.category) categories.add(item.category);
      if (item?.serie) series.add(item.serie);
      Object.keys(item?.quantities ?? {}).forEach((color) => {
        colors.add(color);
      });
    });

    this.filterCategoryOptions = this.sortTags(Array.from(categories), this.knownCategoryOrder);
    this.filterSeriesOptions = this.sortTags(Array.from(series), this.knownSeriesOrder);
    this.filterColorOptions = this.sortTags(Array.from(colors), this.knownColorOrder);
    console.log(`[stock-filters] active series count: ${this.filterSeriesOptions.length}`);
    console.log(`[stock-filters] active categories count: ${this.filterCategoryOptions.length}`);
    console.log(`[stock-filters] active colors count: ${this.filterColorOptions.length}`);
    console.log('[stock-filters] previous filters:', previousFilters);
    this.ensureFilterSelection();
    const nextFilters = this.getFilterSnapshot();
    console.log('[stock-filters] next filters:', nextFilters);
    console.log('[stock-filters] filters updated after delete/archive/restore');
    return nextFilters;
  }

  private mergeMetadataIntoOptions(): void {
    this.recomputeProductFormOptions(this.store.getSnapshotItems());
  }

  private ensureOptionsInclude(category: string, serie: string, colors: string[]): void {
    if (category && !this.categoryOptions.includes(category)) {
      this.categoryOptions = this.sortTags([...this.categoryOptions, category], this.knownCategoryOrder);
    }
    if (serie && !this.seriesOptions.includes(serie)) {
      this.seriesOptions = this.sortTags([...this.seriesOptions, serie], this.knownSeriesOrder);
    }
    const merged = new Set([...this.colorOptions, ...(colors || [])]);
    this.colorOptions = this.sortTags(Array.from(merged), this.knownColorOrder);
  }

  private ensureFilterSelection(): void {
    const serie = this.filters.controls.serie.value;
    const category = this.filters.controls.category.value;
    const color = this.filters.controls.color.value;

    if (serie && serie !== 'all' && !this.filterSeriesOptions.includes(serie)) {
      console.log('[stock-filters] invalid filter reset to Toutes', { filter: 'serie', previous: serie });
      this.filters.controls.serie.setValue('all', { emitEvent: false });
    }
    if (category && category !== 'all' && !this.filterCategoryOptions.includes(category)) {
      console.log('[stock-filters] invalid filter reset to Toutes', { filter: 'category', previous: category });
      this.filters.controls.category.setValue('all', { emitEvent: false });
    }
    if (color && color !== 'all' && !this.filterColorOptions.includes(color)) {
      console.log('[stock-filters] invalid filter reset to Toutes', { filter: 'color', previous: color });
      this.filters.controls.color.setValue('all', { emitEvent: false });
    }
  }

  private getFilterSnapshot(): StockFilterState {
    const raw = this.filters.getRawValue();
    return {
      search: typeof raw.search === 'string' ? raw.search : '',
      serie: typeof raw.serie === 'string' ? raw.serie : 'all',
      category: typeof raw.category === 'string' ? raw.category : 'all',
      color: typeof raw.color === 'string' ? raw.color : 'all'
    };
  }

  private recomputeProductFormOptions(items: StockItem[]): void {
    console.log('[product-form-options] recompute requested');
    const categories = new Set<string>();
    const series = new Set<string>();
    const colors = new Set<string>();

    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item) return;
      if (item.category) categories.add(this.normalizeTagValue(item.category));
      if (item.serie) series.add(this.normalizeTagValue(item.serie));
      Object.keys(item.quantities ?? {}).forEach((color) => {
        const normalized = this.normalizeTagValue(color);
        if (normalized) colors.add(normalized);
      });
    });

    const metadataCategories = this.sortTags(this.productMetadata.categories || [], this.knownCategoryOrder);
    const metadataSeries = this.sortTags(this.productMetadata.series || [], this.knownSeriesOrder);
    const metadataColors = this.sortTags(this.productMetadata.colors || [], this.knownColorOrder);

    this.categoryOptions = this.sortTags(
      (categories.size ? Array.from(categories) : metadataCategories),
      this.knownCategoryOrder
    );
    this.seriesOptions = this.sortTags(
      (series.size ? Array.from(series) : metadataSeries),
      this.knownSeriesOrder
    );
    this.colorOptions = this.sortTags(
      (colors.size ? Array.from(colors) : metadataColors),
      this.knownColorOrder
    );

    this.ensureProductFormSelection();
    console.log(`[product-form-options] categories count: ${this.categoryOptions.length}`);
    console.log(`[product-form-options] series count: ${this.seriesOptions.length}`);
    console.log(`[product-form-options] colors count: ${this.colorOptions.length}`);
    console.log('[product-form-options] options updated after create/delete/archive/restore');
  }

  private ensureProductFormSelection(): void {
    const nextCategory = this.categoryOptions[0] ?? 'accessoire';
    const nextSerie = this.seriesOptions[0] ?? '40';
    const category = this.productForm.controls.category.value;
    const serie = this.productForm.controls.serie.value;

    if (!category || !this.categoryOptions.includes(this.normalizeTagValue(category))) {
      this.productForm.controls.category.setValue(nextCategory, { emitEvent: false });
    }
    if (!serie || !this.seriesOptions.includes(this.normalizeTagValue(serie))) {
      this.productForm.controls.serie.setValue(nextSerie, { emitEvent: false });
    }

    const validColors = this.selectedProductColors
      .map((color) => this.normalizeTagValue(color))
      .filter((color) => this.colorOptions.includes(color));

    if (!validColors.length) {
      this.selectedProductColors = this.colorOptions.length ? [this.colorOptions[0]] : ['blanc'];
      return;
    }

    this.selectedProductColors = Array.from(new Set(validColors));
  }

  private compareColorOrder(a: string, b: string): number {
    const aIndex = this.knownColorOrder.indexOf(this.normalizeTagValue(a));
    const bIndex = this.knownColorOrder.indexOf(this.normalizeTagValue(b));
    const aSort = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const bSort = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    if (aSort !== bSort) return aSort - bSort;
    return a.localeCompare(b);
  }

  private sortTags(values: string[], preferredOrder: string[]): string[] {
    const cleaned = values
      .map((value) => this.normalizeTagValue(value))
      .filter((value): value is string => !!value);

    const unique = Array.from(new Set(cleaned));
    return unique.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a);
      const bIndex = preferredOrder.indexOf(b);
      const aSort = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const bSort = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      if (aSort !== bSort) return aSort - bSort;
      return a.localeCompare(b);
    });
  }

  private normalizeTagValue(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private humanizeTag(value: string): string {
    if (!value) return '';
    const normalized = String(value).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private getDefaultSelectedColors(): string[] {
    const fromMeta = this.sortTags(this.productMetadata.colors || [], this.knownColorOrder);
    if (fromMeta.length) {
      return fromMeta.slice(0, Math.min(3, fromMeta.length));
    }
    return ['blanc', 'gris', 'noir'];
  }

  private resolveMovementError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (!message) {
      return 'Impossible de mettre a jour le stock pour le moment.';
    }
    if (message.includes('FORBIDDEN')) {
      return 'Acces refuse: permission de modification du stock requise.';
    }
    if (message.includes('NOT_AUTHENTICATED')) {
      return 'Session invalide. Reconnectez-vous puis reessayez.';
    }
    if (message.includes('INSUFFICIENT_STOCK') || message.includes('NEGATIVE_STOCK')) {
      return 'Quantite insuffisante pour cette operation.';
    }
    if (message.includes('PRODUCT_NOT_FOUND')) {
      return 'Produit introuvable.';
    }
    if (message.includes('INVALID_COLOR')) {
      return 'Couleur introuvable pour ce produit.';
    }
    if (message.includes('MOVEMENT_DELTA_REQUIRED')) {
      return 'La quantite du mouvement est invalide.';
    }
    if (message.includes('stock.applyMovement') || message.includes('stock:applyMovement') || message.includes('STOCK_MOVEMENT_REJECTED')) {
      return 'Impossible de mettre a jour le stock pour le moment.';
    }
    if (message.includes('IPC_HANDLER_NOT_REGISTERED') || message.includes('API_UNAVAILABLE')) {
      return 'Le service stock est actuellement indisponible.';
    }
    if (message.includes('[IpcService] Timeout')) {
      return 'Le service stock met trop de temps a repondre. Reessayez.';
    }
    if (message.includes('getDb is not a function')) {
      return 'Une erreur interne a empeche la mise a jour du stock.';
    }
    return message;
  }

  private resolveProductCreateError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (!message) {
      return this.t.creationProduitKo;
    }
    if (message.includes('FORBIDDEN')) {
      return this.t.droitsCreationManquants;
    }
    if (message.includes('PRODUCT_REFERENCE_ALREADY_EXISTS')) {
      return 'La reference existe deja.';
    }
    if (message.includes('PRODUCT_LABEL_REQUIRED')) {
      return 'Le nom du produit est obligatoire.';
    }
    if (message.includes('PRODUCT_COLORS_REQUIRED')) {
      return this.t.couleurObligatoire;
    }
    if (message.includes('NOT_AUTHENTICATED')) {
      return 'Session invalide. Reconnectez-vous puis reessayez.';
    }
    return message;
  }

  private resolveProductUpdateError(message?: string): string {
    if (!message) {
      return 'Impossible de modifier le produit.';
    }
    if (message.includes('FORBIDDEN')) {
      return this.t.droitsCreationManquants;
    }
    if (message.includes('PRODUCT_REFERENCE_ALREADY_EXISTS')) {
      return 'La reference existe deja.';
    }
    if (message.includes('PRODUCT_COLOR_HAS_STOCK')) {
      const color = message.split(':')[1] ?? 'couleur';
      return `Impossible de supprimer la couleur ${this.getColorLabel(color)}: stock non nul.`;
    }
    if (message.includes('PRODUCT_COLORS_REQUIRED')) {
      return this.t.couleurObligatoire;
    }
    return message;
  }

  private resolveProductArchiveError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (!message) {
      return "Impossible d'archiver le produit.";
    }
    if (message.includes('FORBIDDEN')) {
      return this.t.droitsCreationManquants;
    }
    if (message.includes('PRODUCT_NOT_FOUND')) {
      return 'Produit introuvable.';
    }
    if (message.includes('NOT_AUTHENTICATED')) {
      return 'Session invalide. Reconnectez-vous puis reessayez.';
    }
    if (message.includes('IPC_HANDLER_NOT_REGISTERED')) {
      return 'Service indisponible. Redemarrez l application.';
    }
    return message;
  }

  private resolveImageSelectionError(errorCode?: string, fallbackMessage?: string): string {
    if (errorCode === 'INVALID_IMAGE_EXTENSION') {
      return 'Format non supporte. Utilisez png, jpg, jpeg ou webp.';
    }
    if (errorCode === 'IMAGE_NOT_FOUND') {
      return 'Le fichier selectionne est introuvable.';
    }
    if (fallbackMessage) {
      return fallbackMessage;
    }
    return "Impossible d'ouvrir le selecteur d'image.";
  }

  private resolveMetadataAddError(message: string | undefined, label: string): string {
    if (!message) {
      return `Impossible d'ajouter la ${label}.`;
    }
    if (message.includes('FORBIDDEN')) {
      return this.t.droitsCreationManquants;
    }
    if (message.includes('PRODUCT_METADATA_KIND_INVALID')) {
      return `Type de ${label} invalide.`;
    }
    if (message.includes('PRODUCT_METADATA_VALUE_REQUIRED')) {
      return `La ${label} est obligatoire.`;
    }
    if (message.includes('NOT_AUTHENTICATED')) {
      return 'Session invalide. Reconnectez-vous puis reessayez.';
    }
    return message;
  }

  private groupByCategory(items: StockItem[]): StockGroup[] {
    const map = new Map<string, StockItem[]>();
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item) return;
      const key = `${item.serie}|${item.category}`;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });

    return Array.from(map.entries())
      .map(([key, grouped]) => {
        const [serie, category] = key.split('|') as [StockSerie, StockCategory];
        const sortedItems = [...grouped].sort((a, b) => a.label.localeCompare(b.label));
        return { serie, category, items: sortedItems };
      })
      .sort((a, b) => {
        const serieCompare = this.getSerieLabel(a.serie).localeCompare(this.getSerieLabel(b.serie));
        if (serieCompare !== 0) return serieCompare;
        return this.getCategoryLabel(a.category).localeCompare(this.getCategoryLabel(b.category));
      });
  }
  private toSafeLower(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  private runStockUiUpdate(
    action: 'stock:add' | 'stock:remove' | 'stock:adjust' | 'stock:edit' | 'stock:archive',
    updater: () => void
  ): void {
    this.zone.run(() => {
      updater();
      console.log(`[${action}] ui updated`);
      console.log('[archives-ui] state updated', { action });
      this.cdr.detectChanges();
      console.log('[archives-ui] change detection triggered', { action });
      console.log('[archives-ui] render ready', { action });
    });
  }

  private runProductCreateUiUpdate(updater: () => void): void {
    this.zone.run(() => {
      updater();
      console.log('[product-create] state updated');
      this.cdr.detectChanges();
      console.log('[product-create] change detection triggered');
      console.log('[product-create] render ready');
    });
  }

  private getMovementActionKey(type: StockMovementType): 'add' | 'remove' | 'adjust' {
    if (type === 'IN') return 'add';
    if (type === 'OUT') return 'remove';
    return 'adjust';
  }

  private canOpenMovement(type: StockMovementType): boolean {
    if (type === 'IN') return this.canAddStock;
    if (type === 'OUT') return this.canRemoveStock;
    return this.canAdjustStock;
  }
}

