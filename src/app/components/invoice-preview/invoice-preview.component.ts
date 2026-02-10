import { Component, OnInit, isDevMode, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Invoice } from '../../models/invoice';
import { InvoiceCalcService, InvoiceTotals } from '../../services/invoice-calc.service';
import { InvoiceStoreService } from '../../services/invoice-store.service';
import { ElectronService } from '../../services/electron.service';

type TotalsFinal = {
  fodec: number;
  totalHorsTVA: number; // HT + FODEC
  tva: number;          // 19% sur (HT + FODEC)
  timbre: number;       // 1.000
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
  invoice: Invoice | null = null;

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
    public electron: ElectronService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // debug visible tout de suite
    this.debugUrl =
      (window.location.href || window.location.pathname || window.location.hash || '(no-url)') + '';
    this.debugId = '(loading...)';
    this.debugCount = -1;
    this.cdr.detectChanges();

    await this.store.load();

    // id via query ?id=... OU via /invoices/:id/preview
    let id =
      this.route.snapshot.queryParamMap.get('id') ??
      this.route.snapshot.paramMap.get('id') ??
      this.route.snapshot.paramMap.get('invoiceId') ??
      '';

    // fallback parsing URL
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
      // calc totals "classiques" via service
      this.totals = this.calc.totals(inv);

      // calc totals "facture SPA" avec fodec + timbre
      this.computeFinalTotals();

      // TTC en lettres
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

  print(): void {
    window.print();
  }

  // ✅ Web: "Enregistrer en PDF" via navigateur
  savePdfWeb(): void {
    window.print();
  }

  async exportPdf(): Promise<void> {
    if (!this.invoice) return;

    // si pas electron => fallback print
    if (!this.electron.isElectron) {
      this.savePdfWeb();
      return;
    }

    try {
      const anyElectron: any = this.electron as any;

      if (typeof anyElectron.exportPdf === 'function') {
        await anyElectron.exportPdf();
        return;
      }

      if (anyElectron.ipcRenderer?.invoke) {
        await anyElectron.ipcRenderer.invoke('export-pdf');
        return;
      }

      alert('Export PDF non configuré dans ElectronService.');
    } catch (e) {
      console.error(e);
      alert('Erreur export PDF. Voir console.');
    }
  }

  // ---------- Totaux avec FODEC & timbre ----------
  private computeFinalTotals(): void {
    const baseHT = Number(this.totals.totalHTApresRemise || this.totals.totalHT || 0);

    const fodec = this.round3(baseHT * this.FODEC_RATE);
    const totalHorsTVA = this.round3(baseHT + fodec);
    const tva = this.round3(totalHorsTVA * this.TVA_RATE);
    const timbre = this.TIMBRE;
    const totalTTCFinal = this.round3(totalHorsTVA + tva + timbre);

    this.totalsFinal = { fodec, totalHorsTVA, tva, timbre, totalTTCFinal };
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

  // ---------- TTC en lettres ----------
  private numberToFrenchWords(value: number): string {
    const rounded = Math.round(value * 1000) / 1000;
    const dinars = Math.floor(rounded);
    const milli = Math.round((rounded - dinars) * 1000);

    const dinarsTxt = this.toWordsFr(dinars);
    const milliTxt = this.toWordsFr(milli);

    return `${dinarsTxt} dinars ${milliTxt} millimes`.toUpperCase();
  }

  private toWordsFr(n: number): string {
    if (!Number.isFinite(n)) return 'zéro';
    if (n === 0) return 'zéro';

    const units = [
      'zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
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
