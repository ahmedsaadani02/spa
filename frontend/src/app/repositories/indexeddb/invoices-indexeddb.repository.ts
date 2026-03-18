import { Injectable } from '@angular/core';
import { Invoice } from '../../models/invoice';
import { InvoiceStorageService } from '../../services/invoice-storage.service';
import { InvoicesRepository } from '../invoices.repository';

@Injectable({
  providedIn: 'root'
})
export class InvoicesIndexedDbRepository implements InvoicesRepository {
  constructor(private storage: InvoiceStorageService) {}

  async getAll(): Promise<Invoice[]> {
    return this.storage.getAll();
  }

  async getById(id: string): Promise<Invoice | null> {
    return this.storage.getById(id);
  }

  async put(invoice: Invoice): Promise<void> {
    await this.storage.put(invoice);
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  async ensureSeed(): Promise<void> {
    await this.storage.ensureSeed();
  }
}
