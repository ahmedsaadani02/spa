import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Quote } from '../../models/quote';
import { QuoteCalcService, QuoteTotals } from '../../services/quote-calc.service';
import { QuoteStoreService } from '../../services/quote-store.service';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-quote-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quote-preview.component.html',
  styleUrls: ['./quote-preview.component.css']
})
export class QuotePreviewComponent implements OnInit {
  quote: Quote | null = null;

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
    public calc: QuoteCalcService,
    public electron: ElectronService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.store.load();

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

  print(): void {
    this.isPdfExport = false;
    this.cdr.detectChanges();
    window.print();
  }

  savePdfWeb(): void {
    this.isPdfExport = true;
    this.cdr.detectChanges();
    window.print();
    this.isPdfExport = false;
    this.cdr.detectChanges();
  }

  async exportPdf(): Promise<void> {
    if (!this.quote) return;

    try {
      this.isPdfExport = true;
      this.cdr.detectChanges();

      if (!this.electron.isElectron) {
        window.print();
        return;
      }

      const anyElectron: any = this.electron as any;

      if (typeof anyElectron.exportPdf === 'function') {
        await anyElectron.exportPdf();
        return;
      }

      if (anyElectron.ipcRenderer?.invoke) {
        await anyElectron.ipcRenderer.invoke('export-pdf');
        return;
      }

      alert('Export PDF non configur\u00e9 dans ElectronService.');
    } catch (e) {
      console.error(e);
      alert('Erreur export PDF. Voir console.');
    } finally {
      this.isPdfExport = false;
      this.cdr.detectChanges();
    }
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
