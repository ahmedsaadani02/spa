import { Injectable } from '@angular/core';
import { Quote } from '../models/quote';

@Injectable({
  providedIn: 'root'
})
export class QuoteStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private readonly dbName = 'spa-quote-db';
  private readonly storeName = 'quotes';
  private readonly version = 1;

  private async openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAll(): Promise<Quote[]> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.getAll();
    const result = await this.requestToPromise<Quote[]>(request);
    await this.transactionDone(tx);
    return result ?? [];
  }

  async getById(id: string): Promise<Quote | null> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.get(id);
    const result = await this.requestToPromise<Quote | undefined>(request);
    await this.transactionDone(tx);
    return result ?? null;
  }

  async put(quote: Quote): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    await this.requestToPromise<IDBValidKey>(store.put(quote));
    await this.transactionDone(tx);
  }

  async delete(id: string): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    await this.requestToPromise<undefined>(store.delete(id));
    await this.transactionDone(tx);
  }

  async ensureSeed(): Promise<void> {
    // pas de seed pour les devis
    return;
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
}
