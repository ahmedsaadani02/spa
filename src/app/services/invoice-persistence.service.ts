import { Injectable, isDevMode } from '@angular/core';
import { Invoice } from '../models/invoice';
import { ElectronService } from './electron.service';
import { InvoiceStorageService } from './invoice-storage.service';

@Injectable({
  providedIn: 'root'
})
export class InvoicePersistenceService {
  constructor(
    private electron: ElectronService,
    private indexedDb: InvoiceStorageService
  ) {}

  private get useElectron(): boolean {
    return this.electron.isElectron;
  }

  async getAll(): Promise<Invoice[]> {
    if (this.useElectron) {
      if (!this.electron.hasInvoicesApi()) {
        if (isDevMode()) {
          console.warn('[InvoicePersistence] Electron API missing: invoices.getAll');
        }
        return [];
      }

      const all = await this.electron.invoicesGetAll();
      return Array.isArray(all) ? all : [];
    }

    return this.indexedDb.getAll();
  }

  async getById(id: string): Promise<Invoice | null> {
    if (this.useElectron) {
      if (!this.electron.hasInvoicesApi()) {
        if (isDevMode()) {
          console.warn('[InvoicePersistence] Electron API missing: invoices.getById');
        }
        return null;
      }

      return (await this.electron.invoicesGetById(id)) ?? null;
    }

    return this.indexedDb.getById(id);
  }

  async put(invoice: Invoice): Promise<void> {
    if (this.useElectron) {
      if (!this.electron.hasInvoicesApi()) {
        if (isDevMode()) {
          console.warn('[InvoicePersistence] Electron API missing: invoices.put');
        }
        return;
      }

      await this.electron.invoicesPut(invoice);
      return;
    }

    await this.indexedDb.put(invoice);
  }

  async delete(id: string): Promise<void> {
    if (this.useElectron) {
      if (!this.electron.hasInvoicesApi()) {
        if (isDevMode()) {
          console.warn('[InvoicePersistence] Electron API missing: invoices.delete');
        }
        return;
      }

      await this.electron.invoicesDelete(id);
      return;
    }

    await this.indexedDb.delete(id);
  }

  async ensureSeed(): Promise<void> {
    if (!this.useElectron) {
      await this.indexedDb.ensureSeed();
    }
  }
}
