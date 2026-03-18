import { Injectable } from '@angular/core';
import { Client } from '../models/client';

interface NormalizedClientInput {
  nom: string;
  adresse: string;
  tel: string;
  mf: string;
  email: string;
  nomKey: string;
  emailKey: string;
  mfKey: string;
  telKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private readonly dbName = 'spa-client-db';
  private readonly storeName = 'clients';
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

  async list(): Promise<Client[]> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.getAll();
    const result = await this.requestToPromise<Client[]>(request);
    await this.transactionDone(tx);
    return this.sortByName((result ?? []).map((client) => this.normalizeStoredClient(client)));
  }

  async getById(id: string): Promise<Client | null> {
    const safeId = (id ?? '').trim();
    if (!safeId) return null;

    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.get(safeId);
    const result = await this.requestToPromise<Client | undefined>(request);
    await this.transactionDone(tx);
    return result ? this.normalizeStoredClient(result) : null;
  }

  async search(query: string): Promise<Client[]> {
    const key = this.toKey(query);
    const phoneKey = this.normalizePhone(query);
    const all = await this.list();
    if (!key) return all;
    return all.filter((client) => {
      const nom = this.toKey(client.nom);
      const tel = this.normalizePhone(client.tel || client.telephone || '');
      const email = this.toKey(client.email ?? '');
      const mf = this.toKey(client.mf ?? '');
      return (
        nom.includes(key) ||
        email.includes(key) ||
        mf.includes(key) ||
        (phoneKey ? tel.includes(phoneKey) : false)
      );
    });
  }

  async upsert(client: Client): Promise<Client | null> {
    const normalized = this.normalizeClientInput(client);
    if (!normalized.nom) return null;

    const now = new Date().toISOString();
    const existing = client.id ? await this.getById(client.id) : null;
    const next: Client = this.normalizeStoredClient({
      id: existing?.id ?? client.id ?? this.createId(),
      nom: normalized.nom,
      adresse: normalized.adresse,
      tel: normalized.tel,
      telephone: normalized.tel,
      mf: normalized.mf,
      email: normalized.email,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });

    await this.put(next);
    return next;
  }

  async delete(id: string): Promise<boolean> {
    const safeId = (id ?? '').trim();
    if (!safeId) return false;

    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    const request = store.delete(safeId);
    await this.requestToPromise<undefined>(request);
    await this.transactionDone(tx);
    return true;
  }

  async findOrCreate(client: Client, preferredId?: string | null): Promise<Client | null> {
    const normalized = this.normalizeClientInput(client);
    if (!normalized.nom) return null;

    if (preferredId) {
      const byId = await this.getById(preferredId);
      if (byId) {
        return this.patchMissingFields(byId, normalized);
      }
    }

    const all = await this.list();
    const matched = this.findEquivalentClient(all, normalized);
    if (matched) {
      return this.patchMissingFields(matched, normalized);
    }

    const created = await this.upsert({
      nom: normalized.nom,
      adresse: normalized.adresse,
      tel: normalized.tel,
      telephone: normalized.tel,
      mf: normalized.mf,
      email: normalized.email
    });
    return created;
  }

  private async patchMissingFields(client: Client, input: NormalizedClientInput): Promise<Client> {
    const next: Client = {
      ...client,
      adresse: client.adresse || input.adresse,
      tel: client.tel || client.telephone || input.tel,
      telephone: client.telephone || client.tel || input.tel,
      mf: client.mf || input.mf,
      email: client.email || input.email
    };

    const changed = (
      (next.adresse ?? '') !== (client.adresse ?? '') ||
      (next.tel ?? '') !== (client.tel ?? '') ||
      (next.mf ?? '') !== (client.mf ?? '') ||
      (next.email ?? '') !== (client.email ?? '')
    );

    if (!changed) return this.normalizeStoredClient(client);

    const updated = await this.upsert({
      ...next,
      id: client.id ?? null,
      createdAt: client.createdAt
    });

    return updated ?? this.normalizeStoredClient(next);
  }

  private findEquivalentClient(clients: Client[], input: NormalizedClientInput): Client | null {
    const withKeys = clients.map((client) => {
      const tel = client.tel || client.telephone || '';
      return {
        client,
        nom: this.toKey(client.nom),
        email: this.toKey(client.email ?? ''),
        mf: this.toKey(client.mf ?? ''),
        tel: this.normalizePhone(tel)
      };
    });

    if (input.emailKey) {
      const byEmail = withKeys.find((item) => item.email && item.email === input.emailKey);
      if (byEmail) return byEmail.client;
    }

    if (input.telKey) {
      const byPhone = withKeys.find((item) => item.tel && item.tel === input.telKey);
      if (byPhone) return byPhone.client;
    }

    if (input.nomKey && input.telKey) {
      const byNomPhone = withKeys.find((item) => item.nom === input.nomKey && item.tel === input.telKey);
      if (byNomPhone) return byNomPhone.client;
    }

    if (input.nomKey && input.emailKey) {
      const byNomEmail = withKeys.find((item) => item.nom === input.nomKey && item.email === input.emailKey);
      if (byNomEmail) return byNomEmail.client;
    }

    if (input.nomKey && input.mfKey) {
      const byNomMf = withKeys.find((item) => item.nom === input.nomKey && item.mf === input.mfKey);
      if (byNomMf) return byNomMf.client;
    }

    return null;
  }

  private normalizeClientInput(value: Partial<Client> | null | undefined): NormalizedClientInput {
    const nom = this.clean(value?.nom);
    const adresse = this.clean(value?.adresse);
    const telRaw = this.clean(value?.tel || value?.telephone);
    const tel = this.cleanPhoneDisplay(telRaw);
    const mf = this.clean(value?.mf);
    const email = this.clean(value?.email).toLowerCase();

    return {
      nom,
      adresse,
      tel,
      mf,
      email,
      nomKey: this.toKey(nom),
      emailKey: this.toKey(email),
      mfKey: this.toKey(mf),
      telKey: this.normalizePhone(tel)
    };
  }

  private clean(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ');
  }

  private cleanPhoneDisplay(value: string): string {
    if (!value) return '';
    return value.replace(/\s+/g, ' ');
  }

  private normalizePhone(value: string): string {
    if (!value) return '';
    return value.replace(/[^\d+]/g, '').toLowerCase();
  }

  private toKey(value: string): string {
    return (value ?? '').trim().toLowerCase();
  }

  private normalizeStoredClient(client: Partial<Client>): Client {
    const tel = this.clean(client.tel || client.telephone);
    return {
      id: client.id ?? null,
      nom: this.clean(client.nom),
      adresse: this.clean(client.adresse),
      tel,
      telephone: tel,
      mf: this.clean(client.mf),
      email: this.clean(client.email).toLowerCase(),
      createdAt: this.clean(client.createdAt),
      updatedAt: this.clean(client.updatedAt)
    };
  }

  private async put(client: Client): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    const request = store.put(client);
    await this.requestToPromise<IDBValidKey>(request);
    await this.transactionDone(tx);
  }

  private sortByName(clients: Client[]): Client[] {
    return [...clients].sort((a, b) => (a.nom || '').localeCompare((b.nom || ''), 'fr', { sensitivity: 'base' }));
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
      `client_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
