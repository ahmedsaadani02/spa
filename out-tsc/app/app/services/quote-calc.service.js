import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
export class QuoteCalcService {
    constructor() {
        this.FODEC_RATE = 0.01;
        this.TVA_RATE = 0.19;
    }
    lineHT(line) {
        const q = Number(line.quantite) || 0;
        const pu = Number(line.prixUnitaire) || 0;
        return q * pu;
    }
    lineTVA(line) {
        const ht = this.lineHT(line);
        return ht * this.TVA_RATE;
    }
    totals(quote) {
        const lignes = quote.lignes ?? [];
        const totalHT = lignes.reduce((s, l) => s + this.lineHT(l), 0);
        const remiseType = quote.remiseType ?? 'montant';
        const remiseValue = Number(quote.remiseValue) || 0;
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
    round3(n) {
        return Math.round((n + Number.EPSILON) * 1000) / 1000;
    }
    static { this.ɵfac = function QuoteCalcService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuoteCalcService)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: QuoteCalcService, factory: QuoteCalcService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuoteCalcService, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
