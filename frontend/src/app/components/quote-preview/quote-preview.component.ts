import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Quote } from '../../models/quote';
import { QuoteCalcService, QuoteTotals } from '../../services/quote-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';
import { QuoteStoreService } from '../../services/quote-store.service';
import { AuthService } from '../../services/auth.service';
import { DocumentsService } from '../../services/documents.service';
import { buildMasterDocumentHtml } from '../../utils/master-document-render';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quote-preview.component.html',
  styleUrls: ['./quote-preview.component.css']
})
export class QuotePreviewComponent implements OnInit {
  @ViewChild('printRoot') private printRoot?: ElementRef<HTMLElement>;

  quote: Quote | null = null;
  notice: { open: boolean; type: 'success' | 'info' | 'error'; message: string; invoiceId?: string } = {
    open: false,
    type: 'info',
    message: ''
  };
  convertConfirmOpen = false;
  convertSubmitting = false;

  totals: QuoteTotals = {
    totalHT: 0,
    remise: 0,
    totalHTApresRemise: 0,
    fodec: 0,
    totalHorsTVA: 0,
    tva: 0,
    totalTTC: 0
  };

  // Logo
  logoAvailable = true;

  // PDF export flag
  isPdfExport = false;

  // ✅ Total Hors TVA en lettres
  totalHorsTvaText = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: QuoteStoreService,
    private invoices: InvoiceStoreService,
    private auth: AuthService,
    public calc: QuoteCalcService,
    public electron: DocumentsService,
    private cdr: ChangeDetectorRef
  ) {}

  get canConvertToInvoice(): boolean {
    return this.auth.hasPermission('manageQuotes') && this.auth.hasPermission('manageInvoices');
  }

  isQuoteConverted(): boolean {
    return !!this.getLinkedInvoiceId();
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.store.load(), this.invoices.load()]);

    let id =
      this.route.snapshot.queryParamMap.get('id') ??
      this.route.snapshot.paramMap.get('id') ??
      this.route.snapshot.paramMap.get('quoteId') ??
      '';

    const href = window.location.href || '';
    if (!id && href) {
      const m1 = href.match(/\/quotes\/([^\/?#]+)\/preview/i);
      if (m1?.[1]) id = m1[1];
    }

    if (!id) {
      this.quote = null;
      this.cdr.detectChanges();
      return;
    }

    const quote = await this.store.getById(id);
    this.quote = quote;

    if (quote) {
      this.totals = this.calc.totals(quote);

      // ✅ devis => montant en lettres basé sur TOTAL HORS TVA
      this.totalHorsTvaText = this.numberToFrenchWords(this.totals.totalHorsTVA);
    }

    this.cdr.detectChanges();
  }

  back(): void {
    this.router.navigate(['/quotes']);
  }

  edit(): void {
    if (!this.quote) return;
    this.router.navigate(['/quotes', this.quote.id, 'edit']);
  }

  duplicate(): void {
    if (!this.quote) return;
    this.router.navigate(['/quotes/new'], { queryParams: { fromQuoteId: this.quote.id } });
  }

  async print(): Promise<void> {
    this.isPdfExport = false;
    await this.flushView();
    const title = this.quote?.numero ? `Devis ${this.quote.numero}` : 'Devis';
    console.log('[quote-preview] using master render', { mode: 'print', title });
    const html = await this.buildPrintableHtml(title);
    if (!html) {
      this.showNotice('error', 'Document introuvable pour impression.');
      return;
    }

    const result = await this.electron.printDocument('quote', this.quote?.numero, html, title);
    if (!result) {
      this.showNotice('error', 'Impression indisponible.');
      return;
    }
    if (!result.ok && !result.canceled) {
      this.showNotice('error', result.message || 'Impression impossible.');
    } else if (result.ok) {
      this.showNotice('info', 'Impression envoyee.');
    }
  }

  async convertToInvoice(): Promise<void> {
    if (!this.quote) return;
    if (!this.canConvertToInvoice) {
      this.showNotice('error', 'Acces refuse.');
      return;
    }
    const linkedInvoiceId = this.getLinkedInvoiceId();
    if (linkedInvoiceId) {
      this.showNotice('info', 'Ce devis a deja ete converti en facture.', linkedInvoiceId);
      return;
    }

    this.convertConfirmOpen = true;
    this.convertSubmitting = false;
    console.log('[quote-convert] confirmation opened', { quoteId: this.quote.id, numero: this.quote.numero });
  }

  cancelConvertToInvoice(): void {
    if (this.convertSubmitting) return;
    this.convertConfirmOpen = false;
    console.log('[quote-convert] confirmation cancelled');
  }

  async confirmConvertToInvoice(): Promise<void> {
    if (!this.quote || this.convertSubmitting) {
      return;
    }
    this.convertSubmitting = true;
    console.log('[quote-convert] confirmation accepted', { quoteId: this.quote.id, numero: this.quote.numero });

    const result = await this.store.convertToInvoice(this.quote.id);
    if (!result.ok && !result.alreadyConverted) {
      this.showNotice('error', result.message || 'Conversion impossible.');
      this.convertSubmitting = false;
      this.convertConfirmOpen = false;
      return;
    }

    await this.invoices.load();
    await this.store.refresh();
    this.quote = await this.store.getById(this.quote.id);
    if (result.alreadyConverted && !result.invoiceId) {
      this.showNotice('info', 'Ce devis a deja ete converti en facture.');
      this.convertSubmitting = false;
      this.convertConfirmOpen = false;
      return;
    }
    if (result.invoiceId) {
      this.showNotice(
        result.alreadyConverted ? 'info' : 'success',
        result.alreadyConverted ? 'Ce devis a deja ete converti en facture.' : 'Facture creee avec succes.',
        result.invoiceId
      );
      this.convertSubmitting = false;
      this.convertConfirmOpen = false;
      await this.router.navigate(['/invoices', result.invoiceId, 'preview']);
      return;
    }

    this.showNotice('success', 'Facture creee avec succes.');
    this.convertSubmitting = false;
    this.convertConfirmOpen = false;
  }

  async openConvertedInvoice(): Promise<void> {
    const targetInvoiceId = this.notice.invoiceId || this.getLinkedInvoiceId();
    if (!targetInvoiceId) return;
    await this.router.navigate(['/invoices', targetInvoiceId, 'preview']);
  }

  closeNotice(): void {
    this.notice = { ...this.notice, open: false };
  }

  private showNotice(type: 'success' | 'info' | 'error', message: string, invoiceId?: string): void {
    this.notice = {
      open: true,
      type,
      message,
      invoiceId
    };
  }

  private getLinkedInvoiceId(): string | null {
    if (!this.quote) return null;
    const invoices = this.invoices.getSnapshot();
    if (this.quote.convertedInvoiceId && invoices.some((invoice) => invoice.id === this.quote?.convertedInvoiceId)) {
      return this.quote.convertedInvoiceId;
    }
    const linkedByQuote = invoices.find((invoice) => invoice.quoteId === this.quote?.id);
    return linkedByQuote?.id ?? null;
  }

  async exportPdf(): Promise<void> {
    if (!this.quote) return;

    try {
      this.isPdfExport = true;
      await this.flushView();
      const title = `Devis ${this.quote.numero}`;
      console.log('[quote-preview] using master render', { mode: 'pdf', title });
      const html = await this.buildPrintableHtml(title);
      if (!html) {
        this.showNotice('error', 'Document introuvable pour export PDF.');
        return;
      }

      const result = await this.electron.exportDocumentPdf('quote', this.quote.numero, html, title);
      if (!result) {
        this.showNotice('error', 'Export PDF indisponible.');
        return;
      }
      if (result?.canceled) {
        if (result?.message) {
          this.showNotice('error', result.message);
        }
        return;
      }
      if (!result?.filePath) {
        this.showNotice('error', result?.message || 'Export PDF impossible.');
        return;
      }
      this.showNotice('success', 'PDF enregistre avec succes.');
    } catch (e) {
      console.error(e);
      this.showNotice('error', 'Erreur export PDF.');
    } finally {
      this.isPdfExport = false;
      this.cdr.detectChanges();
    }
  }

  private async flushView(): Promise<void> {
    this.cdr.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  private async buildPrintableHtml(title: string): Promise<string | null> {
    const root = this.printRoot?.nativeElement;
    if (!root) return null;
    return buildMasterDocumentHtml({
      root,
      title,
      logTag: 'quote-render'
    });
  }

  // ---------- NOMBRE EN LETTRES ----------
  private numberToFrenchWords(value: number): string {
    const rounded = Math.round(value * 1000) / 1000;
    const dinars = Math.floor(rounded);
    const milli = Math.round((rounded - dinars) * 1000);

    const dinarsTxt = this.toWordsFr(dinars);
    const milliTxt = this.toWordsFr(milli);

    return `${dinarsTxt} dinars ${milliTxt} millimes`.toUpperCase();
  }

  private toWordsFr(n: number): string {
    if (!Number.isFinite(n)) return 'zero';
    if (n === 0) return 'zero';

    const units = [
      'zero','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
      'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'
    ];
    const tens = [
      '','', 'vingt','trente','quarante','cinquante','soixante',
      'soixante','quatre-vingt','quatre-vingt'
    ];

    const under100 = (x: number): string => {
      if (x < 20) return units[x];
      const t = Math.floor(x / 10);
      const u = x % 10;

      if (t === 7 || t === 9) {
        const base = t === 7 ? 60 : 80;
        return `${under100(base)}-${under100(x - base)}`;
      }

      if (t === 8 && u === 0) return 'quatre-vingts';
      if (u === 0) return tens[t];

      if (u === 1 && t !== 8) return `${tens[t]} et un`;
      return `${tens[t]}-${units[u]}`;
    };

    const under1000 = (x: number): string => {
      if (x < 100) return under100(x);
      const h = Math.floor(x / 100);
      const r = x % 100;
      const hTxt = h === 1 ? 'cent' : `${units[h]} cent${r === 0 ? 's' : ''}`;
      return r === 0 ? hTxt : `${hTxt} ${under100(r)}`;
    };

    if (n < 1000) return under1000(n);

    if (n < 1000000) {
      const k = Math.floor(n / 1000);
      const r = n % 1000;
      const kTxt = k === 1 ? 'mille' : `${under1000(k)} mille`;
      return r === 0 ? kTxt : `${kTxt} ${under1000(r)}`;
    }

    return String(n);
  }
}
