import { Component, OnInit, isDevMode, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Invoice } from '../../models/invoice';
import { InvoiceCalcService, InvoiceTotals } from '../../services/invoice-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';
import { DocumentsService } from '../../services/documents.service';
import { buildMasterDocumentHtml } from '../../utils/master-document-render';
import { getInvoiceDisplayNumber } from '../../utils/invoice-payload';

type TotalsFinal = {
  fodec: number;
  totalHorsTVA: number;
  tva: number;
  timbre: number;
  totalTTCFinal: number;
};

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-preview.component.html',
  styleUrls: ['./invoice-preview.component.css']
})
export class InvoicePreviewComponent implements OnInit {
  @ViewChild('printRoot') private printRoot?: ElementRef<HTMLElement>;

  invoice: Invoice | null = null;
  noticeMessage = '';
  noticeType: 'info' | 'error' = 'info';

  totals: InvoiceTotals = {
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    remise: 0,
    totalHTApresRemise: 0,
    totalTVAApresRemise: 0
  };

  totalsFinal: TotalsFinal = {
    fodec: 0,
    totalHorsTVA: 0,
    tva: 0,
    timbre: 1,
    totalTTCFinal: 0
  };

  // Logo
  logoAvailable = true;

  // PDF export flag
  isPdfExport = false;

  // Debug
  readonly isDev = isDevMode();
  debugUrl = '';
  debugId = '';
  debugCount = 0;
  marker = 'PREVIEW_V6_' + Math.random().toString(16).slice(2);

  // Constantes
  private readonly FODEC_RATE = 0.01;
  private readonly TVA_RATE = 0.19;
  private readonly TIMBRE = 1.0;

  // Affichage TTC en lettres
  totalTtcText = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: InvoiceStoreService,
    public calc: InvoiceCalcService,
    public electron: DocumentsService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.debugUrl =
      (window.location.href || window.location.pathname || window.location.hash || '(no-url)') + '';
    this.debugId = '(loading...)';
    this.debugCount = -1;
    this.cdr.detectChanges();

    await this.store.load();

    let id =
      this.route.snapshot.queryParamMap.get('id') ??
      this.route.snapshot.paramMap.get('id') ??
      this.route.snapshot.paramMap.get('invoiceId') ??
      '';

    const href = window.location.href || '';
    if (!id && href) {
      const m1 = href.match(/\/invoices\/([^\/?#]+)\/preview/i);
      if (m1?.[1]) id = m1[1];

      if (!id) {
        const m2 = href.match(/[?&]id=([^&]+)/i);
        if (m2?.[1]) id = decodeURIComponent(m2[1]);
      }
    }

    this.debugId = id || '(no-id)';
    this.debugCount = this.getSnapshotSafeCount();

    if (this.isDev) {
      console.log('[InvoicePreview] LOADED', this.marker, {
        href,
        routerUrl: this.router.url,
        id: this.debugId,
        count: this.debugCount
      });
    }

    this.cdr.detectChanges();

    if (!id) {
      this.invoice = null;
      this.cdr.detectChanges();
      return;
    }

    const inv = await this.store.getById(id);
    this.invoice = inv;

    if (inv) {
      this.totals = this.calc.totals(inv);
      this.computeFinalTotals();
      this.totalTtcText = this.numberToFrenchWords(this.totalsFinal.totalTTCFinal);
    } else if (this.isDev) {
      console.warn('[InvoicePreview] invoice NOT FOUND for id:', id);
    }

    this.cdr.detectChanges();
  }

  back(): void {
    this.router.navigate(['/invoices']);
  }

  edit(): void {
    if (!this.invoice) return;
    this.router.navigate(['/invoices', this.invoice.id, 'edit']);
  }

  duplicate(): void {
    if (!this.invoice) return;
    this.router.navigate(['/invoices/new'], { queryParams: { fromInvoiceId: this.invoice.id } });
  }

  async print(): Promise<void> {
    this.isPdfExport = false;
    this.noticeMessage = '';

    await this.flushView();
    const title = this.invoice ? `Facture ${this.displayNumber(this.invoice)}` : 'Facture';
    console.log('[invoice-preview] using master page layout', { mode: 'print', title });
    const html = await this.buildPrintableHtml(title);
    if (!html) {
      this.noticeType = 'error';
      this.noticeMessage = 'Document introuvable pour impression.';
      return;
    }

    const result = await this.electron.printDocument('invoice', this.invoice?.numero, html, title);
    if (!result) {
      this.noticeType = 'error';
      this.noticeMessage = 'Impression indisponible.';
      return;
    }
    if (!result.ok && !result.canceled) {
      this.noticeType = 'error';
      this.noticeMessage = result.message || 'Impression impossible.';
    } else if (result.ok) {
      this.noticeType = 'info';
      this.noticeMessage = 'Impression envoyee.';
      this.cdr.detectChanges();
    }
  }

  async exportPdf(): Promise<void> {
    if (!this.invoice) return;

    this.isPdfExport = true;
    this.noticeMessage = '';

    try {
      await this.flushView();
      const title = `Facture ${this.displayNumber(this.invoice)}`;
      console.log('[invoice-preview] using master page layout', { mode: 'pdf', title });
      const html = await this.buildPrintableHtml(title);
      if (!html) {
        this.noticeType = 'error';
        this.noticeMessage = 'Document introuvable pour export PDF.';
        return;
      }

      const result = await this.electron.exportDocumentPdf('invoice', this.invoice.numero, html, title);
      if (!result) {
        this.noticeType = 'error';
        this.noticeMessage = 'Export PDF indisponible.';
        return;
      }
      if (result?.canceled) {
        if (result?.message) {
          this.noticeType = 'error';
          this.noticeMessage = result.message;
        }
        return;
      }
      if (!result?.filePath) {
        this.noticeType = 'error';
        this.noticeMessage = result?.message || 'Export PDF impossible.';
        return;
      }
      this.noticeType = 'info';
      this.noticeMessage = 'PDF enregistre avec succes.';
    } catch (e) {
      console.error(e);
      this.noticeType = 'error';
      this.noticeMessage = 'Erreur export PDF.';
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
      logTag: 'invoice-render'
    });
  }

  private computeFinalTotals(): void {
    const baseHT = Number(this.totals.totalHTApresRemise || this.totals.totalHT || 0);

    const fodec = this.round3(baseHT * this.FODEC_RATE);
    const totalHorsTVA = this.round3(baseHT + fodec);
    const tva = this.round3(totalHorsTVA * this.TVA_RATE);
    const timbre = this.TIMBRE;
    const totalTTCFinal = this.round3(totalHorsTVA + tva + timbre);

    this.totalsFinal = { fodec, totalHorsTVA, tva, timbre, totalTTCFinal };
  }

  displayNumber(invoice: Invoice | null | undefined): string {
    return getInvoiceDisplayNumber(invoice);
  }

  private round3(n: number): number {
    return Math.round((n + Number.EPSILON) * 1000) / 1000;
  }

  private getSnapshotSafeCount(): number {
    try {
      const anyStore: any = this.store as any;
      if (typeof anyStore.getSnapshot === 'function') {
        return (anyStore.getSnapshot() as any[])?.length ?? 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private numberToFrenchWords(value: number): string {
    const rounded = Math.round(value * 1000) / 1000;
    const dinars = Math.floor(rounded);
    const milli = Math.round((rounded - dinars) * 1000);

    const dinarsTxt = this.toWordsFr(dinars);
    const milliTxt = this.toWordsFr(milli);

    return `${dinarsTxt} dinars ${milliTxt} millimes`.toUpperCase();
  }

  private toWordsFr(n: number): string {
    if (!Number.isFinite(n)) return 'z\u00e9ro';
    if (n === 0) return 'z\u00e9ro';

    const units = [
      'z\u00e9ro','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
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
