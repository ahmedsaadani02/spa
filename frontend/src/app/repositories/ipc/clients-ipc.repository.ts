import { Injectable } from '@angular/core';
import { Client } from '../../models/client';
import { IpcService } from '../../services/ipc.service';
import { ClientsRepository } from '../clients.repository';

@Injectable({
  providedIn: 'root'
})
export class ClientsIpcRepository implements ClientsRepository {
  constructor(private ipc: IpcService) {}

  async list(): Promise<Client[]> {
    return this.ipc.clientsList();
  }

  async getById(id: string): Promise<Client | null> {
    return this.ipc.clientsGetById(id);
  }

  async search(query: string): Promise<Client[]> {
    return this.ipc.clientsSearch(query);
  }

  async upsert(client: Client): Promise<Client | null> {
    return this.ipc.clientsUpsert(client);
  }

  async delete(id: string): Promise<boolean> {
    return this.ipc.clientsDelete(id);
  }

  async findOrCreate(client: Client, preferredId?: string | null): Promise<Client | null> {
    return this.ipc.clientsFindOrCreate(client, preferredId ?? null);
  }
}
