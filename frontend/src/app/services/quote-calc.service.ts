import { Injectable } from '@angular/core';
import { Quote } from '../models/quote';
import { InvoiceLine } from '../models/invoice-line';

export type QuoteTotals = {
  totalHT: number;
  remise: number;
  totalHTApresRemise: number;
  fodec: number;
  totalHorsTVA: number;
  tva: number;
  totalTTC: number;
};

@Injectable({ providedIn: 'root' })
export class QuoteCalcService {
  private readonly FODEC_RATE = 0.01;
  private readonly TVA_RATE = 0.19;

  lineHT(line: InvoiceLine): number {
    const q = Number(line.quantite) || 0;
    const pu = Number(line.prixUnitaire) || 0;
    return q * pu;
  }

  lineTVA(line: InvoiceLine): number {
    const ht = this.lineHT(line);
    return ht * this.TVA_RATE;
  }

  totals(quote: Quote): QuoteTotals {
    const lignes = quote.lignes ?? [];
    const totalHT = lignes.reduce((s, l) => s + this.lineHT(l), 0);

    const remiseType = quote.remiseType ?? 'montant';
    const remiseValue = Number(quote.remiseValue) || 0;

    let remise = 0;
    if (remiseType === 'pourcentage') {
      remise = totalHT * (remiseValue / 100);
    } else {
      remise = remiseValue;
    }
    if (remise < 0) remise = 0;
    if (remise > totalHT) remise = totalHT;

    const totalHTApresRemise = totalHT - remise;
    const fodec = this.round3(totalHTApresRemise * this.FODEC_RATE);
    const totalHorsTVA = this.round3(totalHTApresRemise + fodec);
    const tva = this.round3(totalHorsTVA * this.TVA_RATE);
    const totalTTC = this.round3(totalHorsTVA + tva);

    return {
      totalHT,
      remise,
      totalHTApresRemise,
      fodec,
      totalHorsTVA,
      tva,
      totalTTC
    };
  }

  private round3(n: number): number {
    return Math.round((n + Number.EPSILON) * 1000) / 1000;
  }
}
