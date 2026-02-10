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
      'Joint de bourrage',
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

    const accessoires40: Array<{ reference: string; label: string }> = [
      { reference: '118 40', label: "Equerre d'alignement dormant" },
      { reference: 'EX45 A114', label: "Equerre d'alignement dormant" },
      { reference: 'Angle pour parcloses arrondies', label: 'Angle pour parcloses arrondies' },
      { reference: "Compas d'arret pour soufflet", label: "Compas d'arret pour soufflet" },
      { reference: '881 40', label: 'Cylindre 60 mm Europeen 30/30' },
      { reference: '882 40', label: 'Cylindre 70 mm Europeen 30/40' },
      { reference: '883 40', label: 'Cylindre 70 mm a olive 30/40' },
      { reference: 'Gache pour serrure horizontale en PVC', label: 'Gache pour serrure horizontale en PVC' },
      { reference: 'Embout battement central', label: 'Embout battement central' },
      { reference: 'Kit cremone', label: 'Kit cremone' },
      { reference: 'Kit semi fixe', label: 'Kit semi fixe' },
      { reference: 'Ferme porte', label: 'Ferme porte' }
    ];

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
      { reference: 'kit coulissant', label: 'Kit coulissant' },
      { reference: 'equerre a visser dormant', label: 'Equerre a visser dormant' },
      { reference: 'busette antivent', label: 'Busette antivent' },
      { reference: 'fermeture encastree fenetre fermeture automatique', label: 'Fermeture encastree fenetre fermeture automatique' },
      { reference: 'fermeture encastree porte-fenetre fermeture avec boutin de debloquage', label: 'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage' }
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
      'joint brosse(fin seal) 6 mm',
      'joint U de vitarge 6 mm'
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
      'joint brosse(fin seal) 6 mm',
      'joint U de vitarge 6 mm'
    ];
    const accessoryDefs: Array<{ reference: string; label: string }> = [
      { reference: 'kit coulissant', label: 'Kit coulissant' },
      { reference: 'equerre a visser dormant', label: 'Equerre a visser dormant' },
      { reference: 'busette antivent', label: 'Busette antivent' },
      { reference: 'fermeture encastree fenetre fermeture automatique', label: 'Fermeture encastree fenetre fermeture automatique' },
      { reference: 'fermeture encastree porte-fenetre fermeture avec boutin de debloquage', label: 'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage' }
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
