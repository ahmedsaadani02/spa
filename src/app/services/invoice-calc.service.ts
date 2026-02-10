import { Injectable } from '@angular/core';
import { Invoice } from '../models/invoice';
import { InvoiceLine } from '../models/invoice-line';

export type InvoiceTotals = {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  remise: number;
  totalHTApresRemise: number;
  totalTVAApresRemise: number;
};

@Injectable({ providedIn: 'root' })
export class InvoiceCalcService {
  lineHT(line: InvoiceLine): number {
    const q = Number(line.quantite) || 0;
    const pu = Number(line.prixUnitaire) || 0;
    return q * pu;
  }

  lineTVA(line: InvoiceLine): number {
    const ht = this.lineHT(line);
    const tva = 19; // ✅ TVA fixée
    return ht * (tva / 100);
  }

  lineTTC(line: InvoiceLine): number {
    return this.lineHT(line) + this.lineTVA(line);
  }

  totals(invoice: Invoice): InvoiceTotals {
    const lignes = invoice.lignes ?? [];

    const totalHT = lignes.reduce((s, l) => s + this.lineHT(l), 0);
    const totalTVA = lignes.reduce((s, l) => s + this.lineTVA(l), 0);

    // Remise
    const remiseType = invoice.remiseType ?? 'montant';
    const remiseValue = Number(invoice.remiseValue) || 0;

    let remise = 0;
    if (remiseType === 'pourcentage') {
      remise = totalHT * (remiseValue / 100);
    } else {
      remise = remiseValue;
    }
    if (remise < 0) remise = 0;
    if (remise > totalHT) remise = totalHT;

    const remiseAvantTVA = invoice.remiseAvantTVA ?? true;

    let totalHTApresRemise = totalHT;
    let totalTVAApresRemise = totalTVA;

    if (remiseAvantTVA) {
      totalHTApresRemise = totalHT - remise;
      totalTVAApresRemise = totalHTApresRemise * (19 / 100);
    } else {
      totalHTApresRemise = totalHT;
      totalTVAApresRemise = totalTVA;
    }

    const totalTTC = totalHTApresRemise + totalTVAApresRemise;

    return {
      totalHT,
      totalTVA,
      totalTTC,
      remise,
      totalHTApresRemise,
      totalTVAApresRemise
    };
  }
}
