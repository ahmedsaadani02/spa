import { Injectable, inject, isDevMode } from '@angular/core';
import { Client } from '../models/client';
import { CLIENTS_REPOSITORY, ClientsRepository } from '../repositories/clients.repository';

@Injectable({
  providedIn: 'root'
})
export class ClientPersistenceService {
  private readonly repository = inject<ClientsRepository>(CLIENTS_REPOSITORY);
  private readonly operationTimeoutMs = 8000;

  private async withTimeout<T>(promise: Promise<T>, label: string, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`[ClientPersistence] Timeout on ${label}`)), this.operationTimeoutMs);
      });
      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      if (isDevMode()) {
        console.warn(`[ClientPersistence] ${label} failed`, error);
      }
      return fallback;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async list(): Promise<Client[]> {
    const clients = await this.withTimeout(this.repository.list(), 'list', [] as Client[]);
    if (!Array.isArray(clients) && isDevMode()) {
      console.warn('[ClientPersistence] Repository returned invalid list');
      return [];
    }

    return Array.isArray(clients) ? clients : [];
  }

  async getById(id: string): Promise<Client | null> {
    return this.withTimeout(this.repository.getById(id), 'getById', null);
  }

  async search(query: string): Promise<Client[]> {
    const clients = await this.withTimeout(this.repository.search(query), 'search', [] as Client[]);
    if (!Array.isArray(clients)) return [];
    return clients;
  }

  async upsert(client: Client): Promise<Client | null> {
    return this.withTimeout(this.repository.upsert(client), 'upsert', null);
  }

  async delete(id: string): Promise<boolean> {
    return this.withTimeout(this.repository.delete(id), 'delete', false);
  }

  async findOrCreate(client: Client, preferredId?: string | null): Promise<Client | null> {
    return this.withTimeout(this.repository.findOrCreate(client, preferredId ?? null), 'findOrCreate', null);
  }
}
