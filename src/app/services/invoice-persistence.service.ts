import { Injectable, inject, isDevMode } from '@angular/core';
import { Client } from '../models/client';
import { Invoice } from '../models/invoice';
import { INVOICES_REPOSITORY, InvoicesRepository } from '../repositories/invoices.repository';
import { ClientPersistenceService } from './client-persistence.service';

@Injectable({
  providedIn: 'root'
})
export class InvoicePersistenceService {
  private readonly repository = inject<InvoicesRepository>(INVOICES_REPOSITORY);
  private readonly clients = inject(ClientPersistenceService);

  async getAll(): Promise<Invoice[]> {
    const all = await this.repository.getAll();
    if (!Array.isArray(all) && isDevMode()) {
      console.warn('[InvoicePersistence] Repository returned invalid list');
      return [];
    }
    return Array.isArray(all) ? all : [];
  }

  async getById(id: string): Promise<Invoice | null> {
    return (await this.repository.getById(id)) ?? null;
  }

  async put(invoice: Invoice): Promise<void> {
    const normalized = await this.attachClient(invoice);
    await this.repository.put(normalized);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async ensureSeed(): Promise<void> {
    await this.repository.ensureSeed?.();
  }

  private async attachClient(invoice: Invoice): Promise<Invoice> {
    const linked = await this.clients.findOrCreate(invoice.client, invoice.clientId ?? null);
    if (!linked) {
      return {
        ...invoice,
        clientId: null
      };
    }

    return {
      ...invoice,
      clientId: linked.id ?? null,
      client: this.toInvoiceClient(linked)
    };
  }

  private toInvoiceClient(client: Client): Client {
    const tel = (client.tel || client.telephone || '').trim();
    return {
      id: client.id ?? null,
      nom: (client.nom || '').trim(),
      adresse: (client.adresse || '').trim(),
      tel,
      telephone: tel,
      mf: (client.mf || '').trim(),
      email: (client.email || '').trim().toLowerCase(),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
  }
}
