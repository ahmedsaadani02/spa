import { Injectable } from '@angular/core';
import { Invoice } from '../../models/invoice';
import { AppApiService } from '../../services/app-api.service';
import { InvoicesRepository } from '../invoices.repository';

@Injectable({
  providedIn: 'root'
})
export class InvoicesIpcRepository implements InvoicesRepository {
  constructor(private ipc: AppApiService) {}

  async getAll(): Promise<Invoice[]> {
    return this.ipc.invoicesGetAll();
  }

  async getById(id: string): Promise<Invoice | null> {
    return this.ipc.invoicesGetById(id);
  }

  async put(invoice: Invoice): Promise<void> {
    await this.ipc.invoicesPut(invoice);
  }

  async delete(id: string): Promise<void> {
    await this.ipc.invoicesDelete(id);
  }
}
