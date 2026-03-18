import { Injectable } from '@angular/core';
import { StockItem } from '../models/stock-item';
import { StockMovement } from '../models/stock-movement';

@Injectable({
  providedIn: 'root'
})
export class StockStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly dbName = 'spa-stock-db';
  private readonly version = 1;

  private readonly itemsStore = 'stock_items';
  private readonly movementsStore = 'stock_movements';
  private readonly serie40Accessories: Array<{ reference: string; label: string }> = [
    { reference: 'Equerre à pion', label: 'Equerre à pion' },
    { reference: 'Equerre à sertir en Alu', label: 'Equerre à sertir en Alu' },
    { reference: 'Béquille Luna', label: 'Béquille Luna' },
    { reference: 'Crémone Luna', label: 'Crémone Luna' },
    { reference: 'Loqueteau pour souet', label: 'Loqueteau pour souet' },
    { reference: 'Serrure verticale sans cylindre (Pêne dormant et demi tour)', label: 'Serrure verticale sans cylindre (Pêne dormant et demi tour)' },
    { reference: 'Serrure horizontale (Pêne dormant et demi tour)', label: 'Serrure horizontale (Pêne dormant et demi tour)' },
    { reference: 'Serrure verticale sans cylindre (pêne dormant et rouleau)', label: 'Serrure verticale sans cylindre (pêne dormant et rouleau)' },
    { reference: 'Busette anti-vent', label: 'Busette anti-vent' },
    { reference: 'Angle pour parcloses arrondies', label: 'Angle pour parcloses arrondies' },
    { reference: "Compas d'arrêt pour souet", label: "Compas d'arrêt pour souet" },
    { reference: 'Cylindre 60 mm Européen 30 30', label: 'Cylindre 60 mm Européen 30 30' },
    { reference: 'Cylindre 70 mm à olive 30 40', label: 'Cylindre 70 mm à olive 30 40' },
    { reference: 'Gâche pour serrure verticale en PVC', label: 'Gâche pour serrure verticale en PVC' },
    { reference: 'Embout battement central', label: 'Embout battement central' },
    { reference: 'Kit crémone', label: 'Kit crémone' },
    { reference: 'Kit semi fixe', label: 'Kit semi fixe' },
    { reference: 'Ferme porte', label: 'Ferme porte' }
  ];
  private readonly removedSerie40Accessories = new Set<string>([
    "118 40 equerre d'alignement dormant",
    "ex45 a114 equerre d'alignement dormant",
    '118 40',
    'ex45 a114'
  ]);
  private readonly labelFixes = new Map<string, string>([
    ['accessoire serie 40 - 01', 'Equerre à pion'],
    ['accessoire serie 40 - 02', 'Equerre à sertir en Alu'],
    ['accessoire serie 40 - 03', 'Béquille Luna'],
    ['accessoire serie 40 - 04', 'Crémone Luna'],
    ['accessoire serie 40 - 05', 'Loqueteau pour souet'],
    ['accessoire serie 40 - 06', 'Serrure verticale sans cylindre (Pêne dormant et demi tour)'],
    ['accessoire serie 40 - 07', 'Serrure horizontale (Pêne dormant et demi tour)'],
    ['accessoire serie 40 - 08', 'Serrure verticale sans cylindre (pêne dormant et rouleau)'],
    ['accessoire serie 40 - 09', 'Busette anti-vent'],
    ['accessoire serie 40 - 12', 'Angle pour parcloses arrondies'],
    ['accessoire serie 40 - 13', "Compas d'arrêt pour souet"],
    ['accessoire serie 40 - 14', 'Cylindre 60 mm Européen 30 30'],
    ['accessoire serie 40 - 15', 'Cylindre 70 mm à olive 30 40'],
    ['accessoire serie 40 - 16', 'Gâche pour serrure verticale en PVC'],
    ['accessoire serie 40 - 17', 'Embout battement central'],
    ['accessoire serie 40 - 18', 'Kit crémone'],
    ['cylindre 60 mm européen 30/30', 'Cylindre 60 mm Européen 30 30'],
    ['cylindre 60 mm européen 30 30', 'Cylindre 60 mm Européen 30 30'],
    ['cylindre 60 mm européen 3030', 'Cylindre 60 mm Européen 30 30'],
    ['cylindre 70 mm à olive 30/40', 'Cylindre 70 mm à olive 30 40'],
    ['cylindre 70 mm à olive 30 40', 'Cylindre 70 mm à olive 30 40'],
    ['cylindre 70 mm à olive 3040', 'Cylindre 70 mm à olive 30 40'],
    ['joint de bourrage', 'Joint de bourrage 2mm'],
    ['joint de bourrage 2mm', 'Joint de bourrage 2mm'],
    ['joint de vitrage 3mm', 'Joint de vitrage 3mm'],
    ['joint vitrage 3mm', 'Joint vitrage 3mm'],
    ['joint brosse 8mm', 'Joint brosse 8mm'],
    ['joint de battement', 'Joint de battement'],
    ['joint brosse(fin seal) 6 mm', 'Joint brosse (fin seal) 6 mm'],
    ['joint brosse (fin seal) 6 mm', 'Joint brosse (fin seal) 6 mm'],
    ['joint u de vitarge 6 mm', 'Joint U de vitarge 6 mm'],
    ['kit coulissant', 'Kit coulissant'],
    ['equerre a visser dormant', 'Equerre a visser dormant'],
    ['busette antivent', 'Busette antivent'],
    ['busette antivient', 'Busette antivent'],
    ['fermeture encastree fenetre fermeture automatique', 'Fermeture encastree fenetre fermeture automatique'],
    ['fermeture encastree porte-fenetre fermeture avec boutin de debloquage', 'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage']
  ]);

  private async openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(this.itemsStore)) {
          db.createObjectStore(this.itemsStore, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(this.movementsStore)) {
          const store = db.createObjectStore(this.movementsStore, { keyPath: 'id' });
          store.createIndex('at', 'at', { unique: false });
          store.createIndex('reference', 'reference', { unique: false });
          store.createIndex('actor', 'actor', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAllItems(): Promise<StockItem[]> {
    const db = await this.openDb();
    const tx = db.transaction(this.itemsStore, 'readonly');
    const store = tx.objectStore(this.itemsStore);
    const request = store.getAll();
    const result = await this.requestToPromise<StockItem[]>(request);
    await this.transactionDone(tx);
    return result ?? [];
  }

  async getItem(id: string): Promise<StockItem | null> {
    const db = await this.openDb();
    const tx = db.transaction(this.itemsStore, 'readonly');
    const store = tx.objectStore(this.itemsStore);
    const request = store.get(id);
    const result = await this.requestToPromise<StockItem | undefined>(request);
    await this.transactionDone(tx);
    return result ?? null;
  }

  async getAllMovements(): Promise<StockMovement[]> {
    const db = await this.openDb();
    const tx = db.transaction(this.movementsStore, 'readonly');
    const store = tx.objectStore(this.movementsStore);
    const request = store.getAll();
    const result = await this.requestToPromise<StockMovement[]>(request);
    await this.transactionDone(tx);
    return (result ?? []).sort((a, b) => b.at.localeCompare(a.at));
  }

  async getMovementsByMonth(monthISO: string): Promise<StockMovement[]> {
    const all = await this.getAllMovements();
    if (!monthISO) return [];
    return all.filter((movement) => movement.at.startsWith(monthISO));
  }

  async putItem(item: StockItem): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.itemsStore, 'readwrite');
    const store = tx.objectStore(this.itemsStore);
    await this.requestToPromise<IDBValidKey>(store.put(item));
    await this.transactionDone(tx);
  }

  async addMovement(movement: StockMovement): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.movementsStore, 'readwrite');
    const store = tx.objectStore(this.movementsStore);
    await this.requestToPromise<IDBValidKey>(store.add(movement));
    await this.transactionDone(tx);
  }

  async applyMovement(item: StockItem, movement: StockMovement): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction([this.itemsStore, this.movementsStore], 'readwrite');
    const items = tx.objectStore(this.itemsStore);
    const movements = tx.objectStore(this.movementsStore);
    await this.requestToPromise<IDBValidKey>(items.put(item));
    await this.requestToPromise<IDBValidKey>(movements.add(movement));
    await this.transactionDone(tx);
  }

  async ensureSeed(): Promise<void> {
    const existing = await this.getAllItems();
    if (existing.length > 0) return;
    const seed = this.createSeed();
    const db = await this.openDb();
    const tx = db.transaction(this.itemsStore, 'readwrite');
    const store = tx.objectStore(this.itemsStore);
    for (const item of seed) {
      await this.requestToPromise<IDBValidKey>(store.put(item));
    }
    await this.transactionDone(tx);
  }

  async normalizeSeries67(): Promise<void> {
    const items = await this.getAllItems();
    const normalized = this.applySeries67Normalization(items);
    await this.replaceAllItems(normalized);
  }

  async normalizeLabelsAndReferences(): Promise<void> {
    const items = await this.getAllItems();
    if (items.length === 0) return;

    let changed = false;
    const normalized = items.map((item) => {
      const labelKey = item.label.trim().toLowerCase();
      const referenceKey = item.reference.trim().toLowerCase();
      const nextLabel = this.labelFixes.get(labelKey) ?? item.label;
      const nextReference = this.labelFixes.get(referenceKey) ?? item.reference;
      if (nextLabel === item.label && nextReference === item.reference) {
        return item;
      }
      changed = true;
      return {
        ...item,
        label: nextLabel,
        reference: nextReference
      };
    });

    const filteredSerie40Accessories = normalized.filter((item) => {
      if (item.serie !== '40' || item.category !== 'accessoire') {
        return true;
      }
      const labelKey = item.label.trim().toLowerCase();
      const referenceKey = item.reference.trim().toLowerCase();
      return !this.removedSerie40Accessories.has(labelKey) && !this.removedSerie40Accessories.has(referenceKey);
    });

    if (filteredSerie40Accessories.length !== normalized.length) {
      changed = true;
    }

    const dedupedSerie40 = this.dedupeSerie40Accessories(filteredSerie40Accessories);
    if (dedupedSerie40.removed > 0) {
      changed = true;
    }

    // console.info(`[stock] Serie 40 accessoires: ${dedupedSerie40.removed} doublons supprimés`);

    const withSerie40Accessories = this.ensureSerie40Accessories(dedupedSerie40.items);
    if (withSerie40Accessories.length !== normalized.length) {
      changed = true;
    }

    if (changed) {
      await this.replaceAllItems(withSerie40Accessories);
    }
  }

  private createSeed(): StockItem[] {
    const now = new Date().toISOString();
    const items: StockItem[] = [];
    const profileRefs = [
      '40 100', '40 102', '40 104', '40 107', '40 108', '40 110',
      '40 112', '40 121', '40 128', '40 139', '40 148', '40 150',
      '40 151', '40 153', '40 154', '40 155', '40 156', '40 161',
      '40 164', '40 166', '40 401', '40 402'
    ];

    profileRefs.forEach((ref) => {
      items.push({
        id: this.createId(),
        reference: ref,
        label: `Profil Serie 40 - ${ref}`,
        category: 'profil',
        serie: '40',
        unit: 'barre',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          blanc: 0,
          gris: 0,
          noir: 0
        },
        lowStockThreshold: 2,
        lastUpdated: now
      });
    });

    const joints = [
      'Joint de vitrage 3mm',
      'Joint de bourrage 2mm',
      'Joint brosse 8mm',
      'Joint de battement'
    ];

    joints.forEach((ref) => {
      items.push({
        id: this.createId(),
        reference: ref,
        label: ref,
        category: 'joint',
        serie: '40',
        unit: 'm',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          noir: 0
        },
        lowStockThreshold: 5,
        lastUpdated: now
      });
    });

    const accessoires40 = this.serie40Accessories;

    accessoires40.forEach((acc) => {
      items.push({
        id: this.createId(),
        reference: acc.reference,
        label: acc.label,
        category: 'accessoire',
        serie: '40',
        unit: 'piece',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          blanc: 0,
          gris: 0,
          noir: 0
        },
        lowStockThreshold: 3,
        lastUpdated: now
      });
    });

    const profiles67 = [
      '67 101',
      '67 102',
      '67 103',
      '67 104',
      '67 105',
      '67 106',
      '67 107',
      '67 108',
      '67 114'
    ];

    profiles67.forEach((ref) => {
      items.push({
        id: this.createId(),
        reference: ref,
        label: `Profil Serie 67 - ${ref}`,
        category: 'profil',
        serie: '67',
        unit: 'barre',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          blanc: 0,
          gris: 0,
          noir: 0
        },
        lowStockThreshold: 3,
        lastUpdated: now
      });
    });

    const accessoires67: Array<{ reference: string; label: string }> = [
      { reference: 'Kit coulissant', label: 'Kit coulissant' },
      { reference: 'Equerre a visser dormant', label: 'Equerre a visser dormant' },
      { reference: 'Busette antivent', label: 'Busette antivent' },
      { reference: 'Fermeture encastree fenetre fermeture automatique', label: 'Fermeture encastree fenetre fermeture automatique' },
      { reference: 'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage', label: 'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage' }
    ];

    accessoires67.forEach((acc) => {
      items.push({
        id: this.createId(),
        reference: acc.reference,
        label: acc.label,
        category: 'accessoire',
        serie: '67',
        unit: 'piece',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          blanc: 0,
          gris: 0,
          noir: 0
        },
        lowStockThreshold: 3,
        lastUpdated: now
      });
    });

    const joints67 = [
      'Joint brosse (fin seal) 6 mm',
      'Joint U de vitarge 6 mm'
    ];

    joints67.forEach((ref) => {
      items.push({
        id: this.createId(),
        reference: ref,
        label: ref,
        category: 'joint',
        serie: '67',
        unit: 'ml',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          noir: 0
        },
        lowStockThreshold: 5,
        lastUpdated: now
      });
    });

    for (let i = 1; i <= 9; i += 1) {
      items.push({
        id: this.createId(),
        reference: `PS-ACC-${String(i).padStart(2, '0')}`,
        label: `Accessoire Porte Securite - ${String(i).padStart(2, '0')}`,
        category: 'accessoire',
        serie: 'porte-securite',
        unit: 'piece',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          blanc: 0,
          gris: 0,
          noir: 0
        },
        lowStockThreshold: 3,
        lastUpdated: now
      });
    }

    return items;
  }

  private ensureSerie40Accessories(items: StockItem[]): StockItem[] {
    const now = new Date().toISOString();
    const next = [...items];
    const existing = next.filter((item) => item.serie === '40' && item.category === 'accessoire');
    const byReference = new Map<string, StockItem>();
    existing.forEach((item) => {
      byReference.set(item.reference.toLowerCase(), item);
    });

    this.serie40Accessories.forEach((acc) => {
      const key = acc.reference.toLowerCase();
      const match = byReference.get(key);
      if (match) {
        if (match.label !== acc.label) {
          const index = next.findIndex((item) => item.id === match.id);
          if (index >= 0) {
            next[index] = {
              ...match,
              label: acc.label
            };
          }
        }
        return;
      }

      next.push({
        id: this.createId(),
        reference: acc.reference,
        label: acc.label,
        category: 'accessoire',
        serie: '40',
        unit: 'piece',
        imageUrl: 'assets/placeholder.png',
        quantities: {
          blanc: 0,
          gris: 0,
          noir: 0
        },
        lowStockThreshold: 3,
        lastUpdated: now
      });
    });

    return next;
  }

  private dedupeSerie40Accessories(items: StockItem[]): { items: StockItem[]; removed: number } {
    const output: StockItem[] = [];
    const indexByKey = new Map<string, number>();
    let removed = 0;

    items.forEach((item) => {
      if (item.serie !== '40' || item.category !== 'accessoire') {
        output.push(item);
        return;
      }

      const label = item.label?.trim() ?? '';
      const reference = item.reference?.trim() ?? '';
      const keySource = label || reference;
      const key = this.normalizeProductName(keySource);
      if (!key) {
        output.push(item);
        return;
      }

      const canonicalLabel = this.canonicalizeProductName(label || reference);
      const existingIndex = indexByKey.get(key);
      if (existingIndex === undefined) {
        output.push(canonicalLabel !== item.label ? { ...item, label: canonicalLabel } : item);
        indexByKey.set(key, output.length - 1);
        return;
      }

      const existing = output[existingIndex];
      output[existingIndex] = this.mergeStockItems(existing, item);
      removed += 1;
    });

    return { items: output, removed };
  }

  private mergeStockItems(base: StockItem, extra: StockItem): StockItem {
    const quantities: Partial<Record<'blanc' | 'gris' | 'noir', number>> = { ...base.quantities };
    (Object.keys(extra.quantities) as Array<'blanc' | 'gris' | 'noir'>).forEach((color) => {
      const baseValue = Number(quantities[color] ?? 0) || 0;
      const extraValue = Number(extra.quantities[color] ?? 0) || 0;
      quantities[color] = baseValue + extraValue;
    });

    const canonicalLabel = this.canonicalizeProductName(base.label);

    // TODO: if a price field is added later and duplicates have different prices, keep the first and flag the mismatch.

    return {
      ...base,
      label: canonicalLabel,
      quantities,
      lastUpdated: base.lastUpdated >= extra.lastUpdated ? base.lastUpdated : extra.lastUpdated
    };
  }

  private normalizeProductName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\/\-\s]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private canonicalizeProductName(name: string): string {
    let value = name.trim().replace(/\s+/g, ' ');
    value = value.replace(/\b(\d{2})\s*\/\s*(\d{2})\b/g, (_, a, b) => `${a} ${b}`);
    value = value.replace(/\b(\d{2})\s+(\d{2})\b/g, (_, a, b) => `${a} ${b}`);
    value = value.replace(/\b(\d{2})(\d{2})\b/g, (_, a, b) => `${a} ${b}`);
    return value;
  }

  private applySeries67Normalization(items: StockItem[]): StockItem[] {
    const now = new Date().toISOString();
    const deduped: StockItem[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const key = `${item.serie}|${item.category}|${item.reference}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }

    const profileRefs = [
      '67 101',
      '67 102',
      '67 103',
      '67 104',
      '67 105',
      '67 106',
      '67 107',
      '67 108',
      '67 114'
    ];
    const jointRefs = [
      'Joint brosse (fin seal) 6 mm',
      'Joint U de vitarge 6 mm'
    ];
    const accessoryDefs: Array<{ reference: string; label: string }> = [
      { reference: 'Kit coulissant', label: 'Kit coulissant' },
      { reference: 'Equerre a visser dormant', label: 'Equerre a visser dormant' },
      { reference: 'Busette antivent', label: 'Busette antivent' },
      { reference: 'Fermeture encastree fenetre fermeture automatique', label: 'Fermeture encastree fenetre fermeture automatique' },
      { reference: 'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage', label: 'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage' }
    ];

    const profileSet = new Set(profileRefs.map((ref) => ref.toLowerCase()));
    const jointSet = new Set(jointRefs.map((ref) => ref.toLowerCase()));

    const normalized = deduped.filter((item) => {
      if (item.serie !== '67') return true;
      if (item.category === 'accessoire') return false;
      if (item.category === 'profil') {
        return profileSet.has(item.reference.toLowerCase());
      }
      if (item.category === 'joint') {
        return jointSet.has(item.reference.toLowerCase());
      }
      return true;
    });

    const upsert = (template: StockItem, requiredColors: Array<'blanc' | 'gris' | 'noir'>): void => {
      const key = `${template.serie}|${template.category}|${template.reference}`.toLowerCase();
      const index = normalized.findIndex((item) =>
        `${item.serie}|${item.category}|${item.reference}`.toLowerCase() === key
      );

      const existing = index >= 0 ? normalized[index] : null;
      const quantities: Partial<Record<'blanc' | 'gris' | 'noir', number>> = {};
      requiredColors.forEach((color) => {
        const existingValue = existing?.quantities[color];
        quantities[color] = Number(existingValue ?? 0) || 0;
      });

      const next: StockItem = {
        id: existing?.id ?? this.createId(),
        reference: template.reference,
        label: template.label,
        category: template.category,
        serie: template.serie,
        unit: template.unit,
        imageUrl: existing?.imageUrl?.trim() ? existing.imageUrl : template.imageUrl,
        quantities: template.category === 'joint' ? { noir: quantities.noir ?? 0 } : quantities,
        lowStockThreshold: template.lowStockThreshold,
        lastUpdated: existing?.lastUpdated ?? now
      };

      if (index >= 0) {
        normalized[index] = next;
      } else {
        normalized.push(next);
      }
    };

    profileRefs.forEach((ref) => {
      upsert({
        id: '',
        reference: ref,
        label: `Profil Serie 67 - ${ref}`,
        category: 'profil',
        serie: '67',
        unit: 'barre',
        imageUrl: 'assets/placeholder.png',
        quantities: {},
        lowStockThreshold: 3,
        lastUpdated: now
      }, ['blanc', 'gris', 'noir']);
    });

    accessoryDefs.forEach((acc) => {
      upsert({
        id: '',
        reference: acc.reference,
        label: acc.label,
        category: 'accessoire',
        serie: '67',
        unit: 'piece',
        imageUrl: 'assets/placeholder.png',
        quantities: {},
        lowStockThreshold: 3,
        lastUpdated: now
      }, ['blanc', 'gris', 'noir']);
    });

    jointRefs.forEach((ref) => {
      upsert({
        id: '',
        reference: ref,
        label: ref,
        category: 'joint',
        serie: '67',
        unit: 'ml',
        imageUrl: 'assets/placeholder.png',
        quantities: {},
        lowStockThreshold: 5,
        lastUpdated: now
      }, ['noir']);
    });

    return normalized;
  }

  private async replaceAllItems(items: StockItem[]): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.itemsStore, 'readwrite');
    const store = tx.objectStore(this.itemsStore);
    await this.requestToPromise<undefined>(store.clear());
    for (const item of items) {
      await this.requestToPromise<IDBValidKey>(store.put(item));
    }
    await this.transactionDone(tx);
  }

  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private transactionDone(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ??
      `stock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
