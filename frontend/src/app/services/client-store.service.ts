import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client } from '../models/client';
import { ClientPersistenceService } from './client-persistence.service';

@Injectable({
  providedIn: 'root'
})
export class ClientStoreService {
  private readonly clientsSubject = new BehaviorSubject<Client[]>([]);
  readonly clients$ = this.clientsSubject.asObservable();

  private refreshInFlight: Promise<void> | null = null;
  private refreshQueued = false;
  private initialized = false;

  constructor(private persistence: ClientPersistenceService) {}

  async load(): Promise<void> {
    console.log('[clients-page] load requested');
    if (!this.initialized) {
      this.initialized = true;
    }
    await this.refresh();
    if (this.clientsSubject.value.length === 0) {
      await this.wait(180);
      await this.refresh();
    }
    this.logRenderState();
  }

  async refresh(): Promise<void> {
    if (this.refreshInFlight) {
      this.refreshQueued = true;
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.runRefreshLoop().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  getSnapshot(): Client[] {
    return this.clientsSubject.value;
  }

  private async runRefreshLoop(): Promise<void> {
    do {
      this.refreshQueued = false;

      const all = await this.persistence.list();
      const sorted = [...all].sort((a, b) => (a.nom || '').localeCompare((b.nom || ''), 'fr', { sensitivity: 'base' }));

      if (!this.sameCollection(this.clientsSubject.value, sorted)) {
        this.clientsSubject.next(sorted);
      }
      console.log('[clients-page] api response received');
      console.log(`[clients-page] rendered items count: ${sorted.length}`);
      console.log('[clients-page] empty state condition:', sorted.length === 0);
    } while (this.refreshQueued);
  }

  private sameCollection(left: Client[], right: Client[]): boolean {
    if (left.length !== right.length) return false;

    for (let index = 0; index < left.length; index += 1) {
      if (this.signature(left[index]) !== this.signature(right[index])) {
        return false;
      }
    }

    return true;
  }

  private signature(client: Client): string {
    return [
      client.id ?? '',
      client.nom ?? '',
      client.tel ?? client.telephone ?? '',
      client.email ?? '',
      client.mf ?? '',
      client.updatedAt ?? '',
      client.createdAt ?? ''
    ].join('|');
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logRenderState(): void {
    const count = this.clientsSubject.value.length;
    console.log(`[clients-page] rendered items count: ${count}`);
    console.log('[clients-page] empty state condition:', count === 0);
  }
}
