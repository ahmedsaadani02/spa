import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
export class InvoiceCalcService {
    lineHT(line) {
        const q = Number(line.quantite) || 0;
        const pu = Number(line.prixUnitaire) || 0;
        return q * pu;
    }
    lineTVA(line) {
        const ht = this.lineHT(line);
        const tva = 19; // ✅ TVA fixée
        return ht * (tva / 100);
    }
    lineTTC(line) {
        return this.lineHT(line) + this.lineTVA(line);
    }
    totals(invoice) {
        const lignes = invoice.lignes ?? [];
        const totalHT = lignes.reduce((s, l) => s + this.lineHT(l), 0);
        const totalTVA = lignes.reduce((s, l) => s + this.lineTVA(l), 0);
        // Remise
        const remiseType = invoice.remiseType ?? 'montant';
        const remiseValue = Number(invoice.remiseValue) || 0;
        let remise = 0;
        if (remiseType === 'pourcentage') {
            remise = totalHT * (remiseValue / 100);
        }
        else {
            remise = remiseValue;
        }
        if (remise < 0)
            remise = 0;
        if (remise > totalHT)
            remise = totalHT;
        const remiseAvantTVA = invoice.remiseAvantTVA ?? true;
        let totalHTApresRemise = totalHT;
        let totalTVAApresRemise = totalTVA;
        if (remiseAvantTVA) {
            totalHTApresRemise = totalHT - remise;
            totalTVAApresRemise = totalHTApresRemise * (19 / 100);
        }
        else {
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
    static { this.ɵfac = function InvoiceCalcService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InvoiceCalcService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: InvoiceCalcService, factory: InvoiceCalcService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InvoiceCalcService, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
