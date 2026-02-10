import { Injectable } from '@angular/core';
import { Invoice } from '../models/invoice';

@Injectable({
  providedIn: 'root'
})
export class InvoiceStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  // ✅ Optionnel: si tu veux repartir clean, change en 'spa-invoice-db-v2'
  private readonly dbName = 'spa-invoice-db';
  private readonly storeName = 'invoices';
  private readonly version = 1;

  private async openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;

        // ✅ Création store si absent
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAll(): Promise<Invoice[]> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);

    const request = store.getAll();
    const result = await this.requestToPromise<Invoice[]>(request);

    await this.transactionDone(tx);
    return result ?? [];
  }

  // ✅ Fix preview: get() + fallback getAll().find()
  async getById(id: string): Promise<Invoice | null> {
    const db = await this.openDb();

    // 1) essai direct (rapide)
    try {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);

      const request = store.get(id);
      const result = await this.requestToPromise<Invoice | undefined>(request);

      await this.transactionDone(tx);
      if (result) return result;
    } catch {
      // ignore -> fallback
    }

    // 2) fallback sûr
    const all = await this.getAll();
    return all.find((inv) => inv.id === id) ?? null;
  }

  async put(invoice: Invoice): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    // ✅ attendre que la requête réussisse/échoue
    const request = store.put(invoice);
    await this.requestToPromise<IDBValidKey>(request);

    await this.transactionDone(tx);
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    // ✅ attendre la requête
    const request = store.delete(id);
    await this.requestToPromise<undefined>(request);

    await this.transactionDone(tx);
  }

  async ensureSeed(): Promise<void> {
    const all = await this.getAll();
    if (all.length > 0) return;

    const sample = this.createSampleInvoice();
    await this.put(sample);
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

  private createSampleInvoice(): Invoice {
    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();

    return {
      id: this.createId(),
      numero: `SPA-${year}-0001`,
      date: today,
      client: {
        nom: 'AluDesign SARL',
        adresse: 'Zone Industrielle, Sfax',
        tel: '+216 74 000 000',
        mf: '1234567/A/M/000',
        email: 'contact@aludesign.tn'
      },
      lignes: [
        {
          id: this.createId(),
          designation: 'Profilé aluminium 6063',
          unite: 'm',
          quantite: 120,
          prixUnitaire: 18.5,
          tvaRate: 19
        },
        {
          id: this.createId(),
          designation: 'Fenêtre coulissante',
          unite: 'pièce',
          quantite: 8,
          prixUnitaire: 450,
          tvaRate: 19
        },
        {
          id: this.createId(),
          designation: 'Tôle aluminium',
          unite: 'm²',
          quantite: 42,
          prixUnitaire: 32,
          tvaRate: 19
        }
      ],
      remiseType: 'pourcentage',
      remiseValue: 5,
      remiseAvantTVA: true,
      notes: 'Délai de fabrication estimé : 10 jours ouvrés.',
      conditions: 'Paiement à 30 jours fin de mois.'
    };
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ??
      `inv_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
