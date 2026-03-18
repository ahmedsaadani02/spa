import { Injectable } from '@angular/core';
import { Client } from '../../models/client';
import { ClientStorageService } from '../../services/client-storage.service';
import { ClientsRepository } from '../clients.repository';

@Injectable({
  providedIn: 'root'
})
export class ClientsIndexedDbRepository implements ClientsRepository {
  constructor(private storage: ClientStorageService) {}

  async list(): Promise<Client[]> {
    return this.storage.list();
  }

  async getById(id: string): Promise<Client | null> {
    return this.storage.getById(id);
  }

  async search(query: string): Promise<Client[]> {
    return this.storage.search(query);
  }

  async upsert(client: Client): Promise<Client | null> {
    return this.storage.upsert(client);
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async findOrCreate(client: Client, preferredId?: string | null): Promise<Client | null> {
    return this.storage.findOrCreate(client, preferredId ?? null);
  }
}
