import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Invoice } from '../models/invoice';
import { InvoicePersistenceService } from './invoice-persistence.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceStoreService {
  private readonly invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  readonly invoices$ = this.invoicesSubject.asObservable();

  // ✅ initialized = connexion/seed une seule fois
  // load() rafraîchit toujours les données à chaque navigation
  private initialized = false;

  constructor(private persistence: InvoicePersistenceService) {}

  async load(): Promise<void> {
    console.log('[invoices-page] load requested');
    if (!this.initialized) {
      await this.persistence.ensureSeed();
      this.initialized = true;
    }
    // ✅ toujours recharger les données
    await this.refresh();
    if (this.invoicesSubject.value.length === 0) {
      await this.wait(180);
      await this.refresh();
    }
    this.logRenderState();
  }

  async refresh(): Promise<void> {
    const all = await this.persistence.getAll();
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    this.invoicesSubject.next(sorted);
    console.log('[invoices-page] api response received');
    console.log(`[invoices-page] rendered items count: ${sorted.length}`);
    console.log('[invoices-page] empty state condition:', sorted.length === 0);
  }

  getSnapshot(): Invoice[] {
    return this.invoicesSubject.value;
  }

  async getById(id: string): Promise<Invoice | null> {
    const snap = this.invoicesSubject.value;
    const found = snap.find(inv => inv.id === id);
    if (found) return found;

    await this.refresh();
    const snap2 = this.invoicesSubject.value;
    return snap2.find(inv => inv.id === id) ?? null;
  }

  async save(invoice: Invoice): Promise<void> {
    await this.persistence.put(invoice);
    await this.refresh();
  }

  async delete(id: string): Promise<void> {
    await this.persistence.delete(id);
    await this.refresh();
  }

  async isNumeroUnique(numero: string, currentId?: string): Promise<boolean> {
    const all = await this.persistence.getAll();
    return !all.some((invoice) => invoice.numero === numero && invoice.id !== currentId);
  }

  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SPA-${year}-`;
    const all = await this.persistence.getAll();

    const numbers = all
      .map((invoice) => invoice.numero)
      .filter((numero) => numero.startsWith(prefix))
      .map((numero) => Number(numero.replace(prefix, '')))
      .filter((value) => !Number.isNaN(value));

    const next = (Math.max(0, ...numbers) + 1).toString().padStart(4, '0');
    return `${prefix}${next}`;
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logRenderState(): void {
    const count = this.invoicesSubject.value.length;
    console.log(`[invoices-page] rendered items count: ${count}`);
    console.log('[invoices-page] empty state condition:', count === 0);
  }
}
