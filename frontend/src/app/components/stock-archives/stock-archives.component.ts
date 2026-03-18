import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { StockStoreService } from '../../services/stock-store.service';
import { StockItem } from '../../models/stock-item';
import type { SpaProductRow } from '../../types/electron';

interface ArchivedProductCard {
  id: string;
  reference: string;
  label: string;
  description: string;
  category: string;
  serie: string;
  unit: string;
  imageUrl: string;
  archivedAt: string | null;
  colors: string[];
}

interface PurgeModalState {
  open: boolean;
  item: ArchivedProductCard | null;
}

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  open: boolean;
  type: ToastType;
  title: string;
  message: string;
  icon: string;
  progress: number;
}

@Component({
  selector: 'app-stock-archives',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stock-archives.component.html',
  styleUrls: ['./stock-archives.component.css']
})
export class StockArchivesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly imageFallbackIndex = new Map<string, number>();
  private readonly missingImages = new Set<string>();
  private readonly imageExtensions = ['png', 'webp', 'jpg', 'jpeg'];
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
  private toastTimer?: number;
  private toastProgressTimer?: number;
  private readonly TOAST_DURATION = 3500;
  private readonly TOAST_ICONS: Record<ToastType, string> = {
    success: 'OK',
    error: 'ERR',
    info: 'INFO'
  };

  archivedProducts: ArchivedProductCard[] = [];
  archivedSearch = '';
  restoringProductId: string | null = null;
  purgingProduct = false;
  purgeModal: PurgeModalState = {
    open: false,
    item: null
  };
  toast: ToastState = {
    open: false,
    type: 'info',
    title: '',
    message: '',
    icon: '',
    progress: 100
  };

  constructor(
    private readonly store: StockStoreService,
    private readonly auth: AuthService,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get archivedProductsCount(): number {
    return this.archivedProducts.length;
  }

  get hasArchivedSearch(): boolean {
    return this.archivedSearch.trim().length > 0;
  }

  get canManageCatalog(): boolean {
    const role = this.auth.role();
    return role === 'admin' || role === 'developer' || role === 'owner';
  }

  get filteredArchivedProducts(): ArchivedProductCard[] {
    const query = this.toSafeLower(this.archivedSearch);
    if (!query) {
      return this.archivedProducts;
    }

    return this.archivedProducts.filter((item) => {
      const ref = this.toSafeLower(item.reference);
      const label = this.toSafeLower(item.label);
      const description = this.toSafeLower(item.description);
      const category = this.toSafeLower(item.category);
      const serie = this.toSafeLower(item.serie);
      return (
        ref.includes(query) ||
        label.includes(query) ||
        description.includes(query) ||
        category.includes(query) ||
        serie.includes(query)
      );
    });
  }

  async ngOnInit(): Promise<void> {
    console.log('[stock-archives-page] load requested');
    console.log('[archives:view] route entered');
    console.log('[archives-ui] handler entered', { action: 'archives:view' });
    this.store.archivedProducts$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rows) => {
        this.runUiUpdate('archives:view', () => {
          this.archivedProducts = rows.map((row) => this.toArchivedProductCard(row));
        });
        console.log(`[stock-archives-page] rendered items count: ${this.archivedProducts.length}`);
        console.log('[stock-archives-page] empty state condition:', this.archivedProducts.length === 0);
      });

    console.log('[archives-ui] request sent', { action: 'archives:view' });
    await this.store.load();
    console.log('[archives-ui] response received', { action: 'archives:view' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearToastTimers();
  }

  trackByArchivedId(_: number, item: ArchivedProductCard): string {
    return item.id;
  }

  async restoreArchivedProduct(item: ArchivedProductCard): Promise<void> {
    console.log('[archives:restore] click received', { itemId: item?.id ?? null });
    console.log('[archives-ui] click received', { action: 'archives:restore', itemId: item?.id ?? null });
    if (!item?.id || this.restoringProductId) return;
    console.log('[archives:restore] handler entered');
    console.log('[archives-ui] handler entered', { action: 'archives:restore' });
    this.runUiUpdate('archives:restore', () => {
      this.restoringProductId = item.id;
    });

    try {
      console.log('[archives-ui] request sent', { action: 'archives:restore', itemId: item.id });
      const result = await this.store.restoreProduct(item.id);
      console.log('[archives-ui] response received', { action: 'archives:restore', result });
      if (!result.ok) {
        this.runUiUpdate('archives:restore', () => {
          this.showToast('error', this.resolveProductRestoreError(result.message));
        });
        return;
      }
      this.runUiUpdate('archives:restore', () => {
        this.showToast('success', 'Produit restaure avec succes.');
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PRODUCT_RESTORE_FAILED';
      console.log('[archives-ui] response received', { action: 'archives:restore', message });
      this.runUiUpdate('archives:restore', () => {
        this.showToast('error', this.resolveProductRestoreError(message));
      });
    } finally {
      this.runUiUpdate('archives:restore', () => {
        this.restoringProductId = null;
      });
    }
  }

  isRestoring(item: ArchivedProductCard): boolean {
    return this.restoringProductId === item.id;
  }

  openPurgeModal(item: ArchivedProductCard): void {
    console.log('[archives:delete] click received', { itemId: item?.id ?? null });
    console.log('[archives-ui] click received', { action: 'archives:delete', itemId: item?.id ?? null });
    if (!this.canManageCatalog) {
      this.runUiUpdate('archives:delete', () => {
        this.showToast('error', 'Acces refuse: action reservee a admin/dev/pdg.');
      });
      return;
    }
    if (this.purgingProduct) return;
    console.log('[archives:delete] handler entered');
    console.log('[archives-ui] handler entered', { action: 'archives:delete' });
    this.runUiUpdate('archives:delete', () => {
      this.purgeModal = { open: true, item };
    });
  }

  closePurgeModal(): void {
    if (this.purgingProduct) return;
    this.runUiUpdate('archives:delete', () => {
      this.purgeModal = { open: false, item: null };
    });
  }

  async confirmPurgeProduct(): Promise<void> {
    const item = this.purgeModal.item;
    console.log('[archives:delete] click received', { itemId: item?.id ?? null, confirm: true });
    console.log('[archives-ui] click received', { action: 'archives:delete', itemId: item?.id ?? null, confirm: true });
    if (!item?.id || this.purgingProduct) return;

    console.log('[archives:delete] handler entered');
    console.log('[archives-ui] handler entered', { action: 'archives:delete' });
    this.runUiUpdate('archives:delete', () => {
      this.purgingProduct = true;
    });
    try {
      console.log('[archives-ui] request sent', { action: 'archives:delete', itemId: item.id });
      const result = await this.store.purgeProduct(item.id);
      console.log('[archives-ui] response received', { action: 'archives:delete', result });
      if (!result.ok) {
        this.runUiUpdate('archives:delete', () => {
          this.showToast('error', this.resolveProductPurgeError(result.message));
        });
        return;
      }
      console.log('[stock:delete] success', { itemId: item.id });
      this.runUiUpdate('archives:delete', () => {
        this.showToast('success', 'Produit supprime definitivement.');
        this.purgeModal = { open: false, item: null };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PRODUCT_PURGE_FAILED';
      console.log('[archives-ui] response received', { action: 'archives:delete', message });
      this.runUiUpdate('archives:delete', () => {
        this.showToast('error', this.resolveProductPurgeError(message));
      });
    } finally {
      this.runUiUpdate('archives:delete', () => {
        this.purgingProduct = false;
      });
    }
  }

  getArchivedImageSrc(item: ArchivedProductCard): string {
    return this.getImageSrc(this.toStockImageSource(item));
  }

  onArchivedImageError(event: Event, item: ArchivedProductCard): void {
    this.onImageError(event, this.toStockImageSource(item));
  }

  isArchivedImageMissing(item: ArchivedProductCard): boolean {
    return !!item?.id && this.missingImages.has(item.id);
  }

  getColorLabel(color: string): string {
    const normalized = this.normalizeTagValue(color);
    if (normalized === 'blanc') return 'Blanc';
    if (normalized === 'gris') return 'Gris';
    if (normalized === 'noir') return 'Noir';
    return this.humanizeTag(color);
  }

  getCategoryLabel(category: string): string {
    const normalized = this.normalizeTagValue(category);
    if (normalized === 'profil') return 'Profils';
    if (normalized === 'accessoire') return 'Accessoires';
    if (normalized === 'joint') return 'Joints';
    return this.humanizeTag(category);
  }

  getSerieLabel(serie: string): string {
    const normalized = this.normalizeTagValue(serie);
    if (normalized === 'porte-securite') return 'Porte securite';
    return this.humanizeTag(serie);
  }

  showToast(type: ToastType, message: string): void {
    this.clearToastTimers();
    const title = type === 'success' ? 'Succes' : type === 'error' ? 'Erreur' : 'Info';

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

  private runUiUpdate(action: 'archives:view' | 'archives:restore' | 'archives:delete', updater: () => void): void {
    this.zone.run(() => {
      updater();
      console.log('[archives-ui] state updated', { action });
      this.cdr.detectChanges();
      console.log('[archives-ui] change detection triggered', { action });
      console.log('[archives-ui] render ready', { action });
    });
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

  private getImageSrc(item: StockItem): string {
    if (!item || !item.id) return this.placeholderImage;
    const key = item.id;
    const candidates = this.getImageCandidates(item);
    if (!candidates.length) return this.placeholderImage;
    const index = this.imageFallbackIndex.get(key) ?? 0;
    return candidates[Math.min(index, candidates.length - 1)];
  }

  private onImageError(event: Event, item: StockItem): void {
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
      console.warn('[stock-archives:image] unresolved image, fallback to placeholder', {
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

  private getImageCandidates(item: StockItem): string[] {
    if (!item) return [this.placeholderImage];
    const candidates: string[] = [];
    const direct = typeof item.imageUrl === 'string' ? item.imageUrl.trim().replace(/\\/g, '/') : '';
    const directIsPlaceholder = this.isPlaceholderCandidate(direct);
    if (direct && !directIsPlaceholder) {
      candidates.push(...this.getDirectImageCandidates(direct));
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

  private getDirectImageCandidates(value: string): string[] {
    const direct = value.trim().replace(/\\/g, '/');
    if (!direct) return [];

    const normalized = direct.replace(/^\/+/, '');
    const list = [direct];

    if (/^product-images\//i.test(normalized)) {
      list.push(`/api/${normalized}`);
      const fileName = this.extractImageFileName(normalized);
      if (fileName) {
        list.push(`/api/product-images/${encodeURIComponent(fileName)}`);
      }
    } else if (/^api\/product-images\//i.test(normalized)) {
      list.push(`/${normalized}`);
    } else if (/^\/?api\/product-images\//i.test(direct)) {
      if (!direct.startsWith('/')) {
        list.push(`/${direct}`);
      }
    }

    return Array.from(new Set(list.filter(Boolean)));
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
      .replace(/['â€™]/g, '')
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

  private toArchivedProductCard(row: SpaProductRow): ArchivedProductCard {
    return {
      id: row.id,
      reference: row.reference,
      label: row.label,
      description: row.description ?? '',
      category: row.category,
      serie: row.serie,
      unit: row.unit,
      imageUrl: row.image_url ?? '',
      archivedAt: row.archived_at ?? null,
      colors: this.sortTags(
        Array.from(new Set((row.colors || []).map((color) => this.normalizeTagValue(color)).filter(Boolean))),
        this.knownColorOrder
      )
    };
  }

  private toStockImageSource(item: ArchivedProductCard): StockItem {
    const quantities: Record<string, number> = {};
    (item.colors || []).forEach((color) => {
      quantities[color] = 0;
    });

    return {
      id: item.id,
      reference: item.reference,
      label: item.label,
      description: item.description,
      category: item.category,
      serie: item.serie,
      unit: item.unit,
      imageUrl: item.imageUrl,
      quantities,
      lowStockThreshold: 0,
      lastUpdated: item.archivedAt ?? new Date().toISOString()
    };
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

  private resolveProductRestoreError(message?: string): string {
    if (!message) {
      return 'Impossible de restaurer le produit.';
    }
    if (message.includes('FORBIDDEN')) {
      return 'Acces refuse: action reservee a admin/dev/pdg.';
    }
    if (message.includes('PRODUCT_NOT_FOUND')) {
      return 'Produit introuvable.';
    }
    return message;
  }

  private resolveProductPurgeError(message?: string): string {
    if (!message) {
      return 'Impossible de supprimer definitivement le produit.';
    }
    if (message.includes('PRODUCT_PURGE_REQUIRES_ARCHIVED')) {
      return 'Le produit doit etre archive avant suppression definitive.';
    }
    if (message.includes('PRODUCT_ALREADY_PURGED')) {
      return 'Ce produit a deja ete supprime du catalogue.';
    }
    if (message.includes('FORBIDDEN')) {
      return 'Acces refuse: action reservee a admin/dev/pdg.';
    }
    return message;
  }

  private toSafeLower(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }
}
