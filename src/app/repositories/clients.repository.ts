import { InjectionToken } from '@angular/core';
import { Client } from '../models/client';

export interface ClientsRepository {
  list(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  search(query: string): Promise<Client[]>;
  upsert(client: Client): Promise<Client | null>;
  delete(id: string): Promise<boolean>;
  findOrCreate(client: Client, preferredId?: string | null): Promise<Client | null>;
}

export const CLIENTS_REPOSITORY = new InjectionToken<ClientsRepository>('CLIENTS_REPOSITORY');
