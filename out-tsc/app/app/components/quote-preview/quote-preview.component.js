import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as i0 from "@angular/core";
import * as i1 from "@angular/router";
import * as i2 from "../../services/quote-store.service";
import * as i3 from "../../services/quote-calc.service";
import * as i4 from "../../services/electron.service";
import * as i5 from "@angular/common";
function QuotePreviewComponent_div_10_img_10_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "img", 40);
    i0.ɵɵlistener("error", function QuotePreviewComponent_div_10_img_10_Template_img_error_0_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.logoAvailable = false); });
    i0.ɵɵelementEnd();
} }
function QuotePreviewComponent_div_10_div_11_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 41);
    i0.ɵɵtext(1, "SPA");
    i0.ɵɵelementEnd();
} }
function QuotePreviewComponent_div_10_tr_57_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td", 42);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "td");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "td", 42);
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "td", 42);
    i0.ɵɵtext(8);
    i0.ɵɵpipe(9, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "td", 34);
    i0.ɵɵtext(11);
    i0.ɵɵpipe(12, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(13, "td", 34);
    i0.ɵɵtext(14);
    i0.ɵɵpipe(15, "number");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const line_r3 = ctx.$implicit;
    const i_r4 = ctx.index;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i_r4 + 1);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(line_r3.designation);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(line_r3.unite);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(9, 6, line_r3.quantite, "1.0-3"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(12, 9, line_r3.prixUnitaire, "1.3-3"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(15, 12, ctx_r1.calc.lineHT(line_r3), "1.3-3"));
} }
function QuotePreviewComponent_div_10_tr_67_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td");
    i0.ɵɵtext(2, "Remise");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "td", 34);
    i0.ɵɵtext(4);
    i0.ɵɵpipe(5, "number");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1("- ", i0.ɵɵpipeBind2(5, 1, ctx_r1.totals.remise, "1.3-3"));
} }
function QuotePreviewComponent_div_10_div_84_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 43);
    i0.ɵɵelement(1, "img", 44);
    i0.ɵɵelementEnd();
} }
function QuotePreviewComponent_div_10_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 7)(1, "header", 8)(2, "div", 9)(3, "div", 10);
    i0.ɵɵtext(4, "SOCIETE PRATIQUES ALUMINIUM");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "div");
    i0.ɵɵtext(6, "59, Av. de l\u2019Ind\u00E9pendance - Cit\u00E9 Ettadhamen");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "div");
    i0.ɵɵtext(8, "2041 ARIANA");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(9, "div", 11);
    i0.ɵɵtemplate(10, QuotePreviewComponent_div_10_img_10_Template, 1, 0, "img", 12)(11, QuotePreviewComponent_div_10_div_11_Template, 2, 0, "div", 13);
    i0.ɵɵelementStart(12, "div", 14)(13, "div", 15);
    i0.ɵɵtext(14);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(15, "div", 16);
    i0.ɵɵtext(16);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(17, "div", 16);
    i0.ɵɵtext(18);
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(19, "div", 17)(20, "div", 10);
    i0.ɵɵtext(21, " \u0634\u0631\u0643\u0629 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0623\u0644\u0645\u0646\u064A\u0648\u0645 ");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(22, "div");
    i0.ɵɵtext(23, " 59\u060C \u0634\u0627\u0631\u0639 \u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644 - \u062D\u064A \u0627\u0644\u062A\u0636\u0627\u0645\u0646 ");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(24, "div");
    i0.ɵɵtext(25, "2041 \u0623\u0631\u064A\u0627\u0646\u0629");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(26, "section", 18)(27, "div", 19)(28, "div", 20);
    i0.ɵɵtext(29, "Tunis, le");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(30, "div", 21);
    i0.ɵɵtext(31);
    i0.ɵɵpipe(32, "date");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(33, "div", 22);
    i0.ɵɵtext(34, " DEVIS N\u00B0 ");
    i0.ɵɵelementStart(35, "span", 23);
    i0.ɵɵtext(36);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(37, "div", 24);
    i0.ɵɵtext(38, " Bon de Commande N\u00B0 ");
    i0.ɵɵelementStart(39, "span", 20);
    i0.ɵɵtext(40, "\u2014");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(41, "table", 25)(42, "thead")(43, "tr")(44, "th", 26);
    i0.ɵɵtext(45, "ORD");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(46, "th");
    i0.ɵɵtext(47, "DESIGNATIONS");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(48, "th", 27);
    i0.ɵɵtext(49, "U");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(50, "th", 28);
    i0.ɵɵtext(51, "QUANT");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(52, "th", 29);
    i0.ɵɵtext(53, "P.UNIT");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(54, "th", 30);
    i0.ɵɵtext(55, "P.TOTAL");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(56, "tbody");
    i0.ɵɵtemplate(57, QuotePreviewComponent_div_10_tr_57_Template, 16, 15, "tr", 31);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(58, "div", 32)(59, "table", 33)(60, "tbody")(61, "tr")(62, "td");
    i0.ɵɵtext(63, "TOTAL HT");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(64, "td", 34);
    i0.ɵɵtext(65);
    i0.ɵɵpipe(66, "number");
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(67, QuotePreviewComponent_div_10_tr_67_Template, 6, 4, "tr", 35);
    i0.ɵɵelementStart(68, "tr")(69, "td");
    i0.ɵɵtext(70, "Fodec (1%)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(71, "td", 34);
    i0.ɵɵtext(72);
    i0.ɵɵpipe(73, "number");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(74, "tr", 36)(75, "td");
    i0.ɵɵtext(76, "TOTAL Hors T.V.A");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(77, "td", 34);
    i0.ɵɵtext(78);
    i0.ɵɵpipe(79, "number");
    i0.ɵɵelementEnd()()()()();
    i0.ɵɵelementStart(80, "div", 37);
    i0.ɵɵtext(81, " Arr\u00EAt\u00E9 le pr\u00E9sent devis \u00E0 la somme de : ");
    i0.ɵɵelementStart(82, "strong");
    i0.ɵɵtext(83);
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(84, QuotePreviewComponent_div_10_div_84_Template, 2, 0, "div", 38);
    i0.ɵɵelementStart(85, "footer", 39);
    i0.ɵɵtext(86, " R.C. : B035 145 2004 - M.F. : 89 83 00 W/A/M/000 - RIB : 25079 0000000 213 555 60 zitouna Mutuelle ville");
    i0.ɵɵelement(87, "br");
    i0.ɵɵtext(88, " T\u00E9l. : 71 515 491 - Fax : 70 661 034 - E-mail : saadani.karim@planet.tn ");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const q_r5 = ctx.ngIf;
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance(10);
    i0.ɵɵproperty("ngIf", ctx_r1.logoAvailable);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", !ctx_r1.logoAvailable);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate1(" ", q_r5.client.nom, " ");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1(" ", q_r5.client.adresse, " ");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1(" CODE T.V.A : ", q_r5.client.mf, " ");
    i0.ɵɵadvance(13);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(32, 14, q_r5.date, "dd/MM/yyyy"));
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate(q_r5.numero);
    i0.ɵɵadvance(21);
    i0.ɵɵproperty("ngForOf", q_r5.lignes);
    i0.ɵɵadvance(8);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(66, 17, ctx_r1.totals.totalHT, "1.3-3"));
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngIf", ctx_r1.totals.remise > 0);
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(73, 20, ctx_r1.totals.fodec, "1.3-3"));
    i0.ɵɵadvance(6);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(79, 23, ctx_r1.totals.totalHorsTVA, "1.3-3"));
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate(ctx_r1.totalHorsTvaText);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", !ctx_r1.isPdfExport);
} }
function QuotePreviewComponent_div_11_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 45);
    i0.ɵɵtext(1, " Devis introuvable.\n");
    i0.ɵɵelementEnd();
} }
export class QuotePreviewComponent {
    constructor(route, router, store, calc, electron, cdr) {
        this.route = route;
        this.router = router;
        this.store = store;
        this.calc = calc;
        this.electron = electron;
        this.cdr = cdr;
        this.quote = null;
        this.totals = {
            totalHT: 0,
            remise: 0,
            totalHTApresRemise: 0,
            fodec: 0,
            totalHorsTVA: 0,
            tva: 0,
            totalTTC: 0
        };
        // Logo
        this.logoAvailable = true;
        // PDF export flag
        this.isPdfExport = false;
        // ✅ Total Hors TVA en lettres
        this.totalHorsTvaText = '';
    }
    async ngOnInit() {
        await this.store.load();
        let id = this.route.snapshot.queryParamMap.get('id') ??
            this.route.snapshot.paramMap.get('id') ??
            this.route.snapshot.paramMap.get('quoteId') ??
            '';
        const href = window.location.href || '';
        if (!id && href) {
            const m1 = href.match(/\/quotes\/([^\/?#]+)\/preview/i);
            if (m1?.[1])
                id = m1[1];
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
    back() {
        this.router.navigate(['/quotes']);
    }
    edit() {
        if (!this.quote)
            return;
        this.router.navigate(['/quotes', this.quote.id, 'edit']);
    }
    print() {
        this.isPdfExport = false;
        this.cdr.detectChanges();
        window.print();
    }
    savePdfWeb() {
        this.isPdfExport = true;
        this.cdr.detectChanges();
        window.print();
        this.isPdfExport = false;
        this.cdr.detectChanges();
    }
    async exportPdf() {
        if (!this.quote)
            return;
        try {
            this.isPdfExport = true;
            this.cdr.detectChanges();
            if (!this.electron.isElectron) {
                window.print();
                return;
            }
            const anyElectron = this.electron;
            if (typeof anyElectron.exportPdf === 'function') {
                await anyElectron.exportPdf();
                return;
            }
            if (anyElectron.ipcRenderer?.invoke) {
                await anyElectron.ipcRenderer.invoke('export-pdf');
                return;
            }
            alert('Export PDF non configur\u00e9 dans ElectronService.');
        }
        catch (e) {
            console.error(e);
            alert('Erreur export PDF. Voir console.');
        }
        finally {
            this.isPdfExport = false;
            this.cdr.detectChanges();
        }
    }
    // ---------- NOMBRE EN LETTRES ----------
    numberToFrenchWords(value) {
        const rounded = Math.round(value * 1000) / 1000;
        const dinars = Math.floor(rounded);
        const milli = Math.round((rounded - dinars) * 1000);
        const dinarsTxt = this.toWordsFr(dinars);
        const milliTxt = this.toWordsFr(milli);
        return `${dinarsTxt} dinars ${milliTxt} millimes`.toUpperCase();
    }
    toWordsFr(n) {
        if (!Number.isFinite(n))
            return 'zero';
        if (n === 0)
            return 'zero';
        const units = [
            'zero', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
            'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
        ];
        const tens = [
            '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante',
            'soixante', 'quatre-vingt', 'quatre-vingt'
        ];
        const under100 = (x) => {
            if (x < 20)
                return units[x];
            const t = Math.floor(x / 10);
            const u = x % 10;
            if (t === 7 || t === 9) {
                const base = t === 7 ? 60 : 80;
                return `${under100(base)}-${under100(x - base)}`;
            }
            if (t === 8 && u === 0)
                return 'quatre-vingts';
            if (u === 0)
                return tens[t];
            if (u === 1 && t !== 8)
                return `${tens[t]} et un`;
            return `${tens[t]}-${units[u]}`;
        };
        const under1000 = (x) => {
            if (x < 100)
                return under100(x);
            const h = Math.floor(x / 100);
            const r = x % 100;
            const hTxt = h === 1 ? 'cent' : `${units[h]} cent${r === 0 ? 's' : ''}`;
            return r === 0 ? hTxt : `${hTxt} ${under100(r)}`;
        };
        if (n < 1000)
            return under1000(n);
        if (n < 1000000) {
            const k = Math.floor(n / 1000);
            const r = n % 1000;
            const kTxt = k === 1 ? 'mille' : `${under1000(k)} mille`;
            return r === 0 ? kTxt : `${kTxt} ${under1000(r)}`;
        }
        return String(n);
    }
    static { this.ɵfac = function QuotePreviewComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuotePreviewComponent)(i0.ɵɵdirectiveInject(i1.ActivatedRoute), i0.ɵɵdirectiveInject(i1.Router), i0.ɵɵdirectiveInject(i2.QuoteStoreService), i0.ɵɵdirectiveInject(i3.QuoteCalcService), i0.ɵɵdirectiveInject(i4.ElectronService), i0.ɵɵdirectiveInject(i0.ChangeDetectorRef)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: QuotePreviewComponent, selectors: [["app-quote-preview"]], decls: 12, vars: 5, consts: [[1, "preview-toolbar", "no-print"], [1, "btn", "ghost", 3, "click"], [1, "toolbar-actions"], [1, "btn", "outline", 3, "click", "disabled"], [1, "btn", "primary", 3, "click", "disabled"], ["class", "invoice-page", 4, "ngIf"], ["class", "empty card", 4, "ngIf"], [1, "invoice-page"], [1, "top-header"], [1, "company-fr"], [1, "line1"], [1, "top-logo"], ["src", "assets/logospa.png", "alt", "SPA logo", 3, "error", 4, "ngIf"], ["class", "logo-fallback", 4, "ngIf"], [1, "client-under-logo"], [1, "client-name"], [1, "client-sub"], ["dir", "rtl", "lang", "ar", 1, "company-ar"], [1, "client-row"], [1, "date-right"], [1, "muted"], [1, "date-strong"], [1, "invoice-title"], [1, "mono"], [1, "order-line"], [1, "invoice-table"], [1, "col-ord"], [1, "col-u"], [1, "col-q"], [1, "col-pu"], [1, "col-pt"], [4, "ngFor", "ngForOf"], [1, "totals-area"], [1, "totals"], [1, "num"], [4, "ngIf"], [1, "grand"], [1, "ttc-words"], ["class", "sign-stamp print-only", 4, "ngIf"], [1, "invoice-footer"], ["src", "assets/logospa.png", "alt", "SPA logo", 3, "error"], [1, "logo-fallback"], [1, "center"], [1, "sign-stamp", "print-only"], ["src", "assets/signature-cachet.png", "alt", "Signature et cachet"], [1, "empty", "card"]], template: function QuotePreviewComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "div", 0)(1, "button", 1);
            i0.ɵɵlistener("click", function QuotePreviewComponent_Template_button_click_1_listener() { return ctx.back(); });
            i0.ɵɵtext(2, "Retour");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(3, "div", 2)(4, "button", 3);
            i0.ɵɵlistener("click", function QuotePreviewComponent_Template_button_click_4_listener() { return ctx.edit(); });
            i0.ɵɵtext(5, "Modifier");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(6, "button", 4);
            i0.ɵɵlistener("click", function QuotePreviewComponent_Template_button_click_6_listener() { return ctx.print(); });
            i0.ɵɵtext(7, "Imprimer");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(8, "button", 3);
            i0.ɵɵlistener("click", function QuotePreviewComponent_Template_button_click_8_listener() { return ctx.exportPdf(); });
            i0.ɵɵtext(9, " Enregistrer PDF ");
            i0.ɵɵelementEnd()()();
            i0.ɵɵtemplate(10, QuotePreviewComponent_div_10_Template, 89, 26, "div", 5)(11, QuotePreviewComponent_div_11_Template, 2, 0, "div", 6);
        } if (rf & 2) {
            i0.ɵɵadvance(4);
            i0.ɵɵproperty("disabled", !ctx.quote);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("disabled", !ctx.quote);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("disabled", !ctx.quote);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.quote);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", !ctx.quote);
        } }, dependencies: [CommonModule, i5.NgForOf, i5.NgIf, RouterModule, i5.DecimalPipe, i5.DatePipe], styles: ["\n\n\n\n.preview-toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 16px;\n  gap: 12px;\n}\n\n.toolbar-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 10px;\n  flex-wrap: wrap;\n}\n\n\n\n\n\n.invoice-page[_ngcontent-%COMP%] {\n  background: #fff;\n  width: min(100%, 210mm);\n  height: 297mm;\n  margin: 0 auto;\n  padding: 14mm 16mm;\n  box-shadow: var(--shadow);\n  border-radius: 0;\n  display: flex;\n  flex-direction: column;\n  position: relative;\n  overflow: hidden;\n\n  -webkit-print-color-adjust: exact;\n  print-color-adjust: exact;\n}\n\n\n\n\n\n.top-header[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr 160px 1fr;\n  align-items: start;\n  gap: 12px;\n}\n\n.company-fr[_ngcontent-%COMP%], \n.company-ar[_ngcontent-%COMP%] {\n  font-size: 12px;\n  line-height: 1.25;\n  color: #0a4ea1;\n}\n\n.company-fr[_ngcontent-%COMP%]   .line1[_ngcontent-%COMP%], \n.company-ar[_ngcontent-%COMP%]   .line1[_ngcontent-%COMP%] {\n  font-weight: 900;\n  font-size: 13.8px;\n  margin-bottom: 2px;\n  color: #083a7a;\n}\n\n.company-ar[_ngcontent-%COMP%] {\n  text-align: right;\n  font-family: \"Tahoma\", \"Arial\", sans-serif;\n}\n\n.top-logo[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-start;\n  align-items: center;\n  padding-top: 2px;\n  text-align: center;\n  gap: 10px;\n}\n\n.top-logo[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  display: block;\n  margin: 0 auto;\n  width: 120px;\n  height: auto;\n  object-fit: contain;\n  -webkit-print-color-adjust: exact;\n  print-color-adjust: exact;\n}\n\n.logo-fallback[_ngcontent-%COMP%] {\n  font-family: 'Space Grotesk', sans-serif;\n  font-weight: 900;\n  font-size: 26px;\n}\n\n.client-under-logo[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  margin-top: 14px;\n  text-align: center;\n  line-height: 1.2;\n}\n\n.client-under-logo[_ngcontent-%COMP%]   .client-name[_ngcontent-%COMP%] {\n  font-weight: 900;\n  font-size: 22px;\n  letter-spacing: 0.6px;\n  margin: 0 0 2px 0;\n  color: #111;\n  white-space: nowrap;\n  overflow-wrap: normal;\n  word-break: keep-all;\n  hyphens: none;\n  width: max-content;\n  text-align: center;\n}\n\n.client-under-logo[_ngcontent-%COMP%]   .client-sub[_ngcontent-%COMP%] {\n  font-size: 13px;\n  margin: 0;\n  color: #111;\n  line-height: 1.15;\n  white-space: nowrap;\n  overflow-wrap: normal;\n  word-break: keep-all;\n  hyphens: none;\n  width: max-content;\n  text-align: center;\n}\n\n\n\n\n\n.client-row[_ngcontent-%COMP%] {\n  margin-top: 14px;\n  display: grid;\n  grid-template-columns: 1fr 180px;\n  align-items: start;\n}\n\n.client-center[_ngcontent-%COMP%] {\n  justify-self: center;\n  text-align: center;\n  width: 100%;\n  margin-top: 6px;\n}\n\n.client-title[_ngcontent-%COMP%] { display: none; }\n\n.client-name[_ngcontent-%COMP%] {\n  font-weight: 900;\n  font-size: 22px;\n  letter-spacing: 0.6px;\n  margin-bottom: 4px;\n  color: #111;\n}\n\n.client-sub[_ngcontent-%COMP%] {\n  font-size: 13px;\n  margin-top: 2px;\n  color: #111;\n}\n\n.date-right[_ngcontent-%COMP%] {\n  grid-column: 2;\n  justify-self: end;\n  text-align: right;\n  font-size: 13px;\n  color: #111;\n}\n\n.date-right[_ngcontent-%COMP%]   .muted[_ngcontent-%COMP%] { color: #333; }\n.date-right[_ngcontent-%COMP%]   .date-strong[_ngcontent-%COMP%] { font-weight: 900; }\n\n\n\n\n\n.invoice-title[_ngcontent-%COMP%] {\n  margin-top: 18px;\n  text-align: center;\n  font-weight: 900;\n  font-size: 18px;\n  letter-spacing: 0.8px;\n  color: #111;\n}\n\n.mono[_ngcontent-%COMP%] {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,\n    \"Liberation Mono\", \"Courier New\", monospace;\n}\n\n.order-line[_ngcontent-%COMP%] {\n  margin-top: 12px;\n  font-size: 13px;\n  color: #111;\n}\n\n.muted[_ngcontent-%COMP%] { color: #666; }\n\n\n\n\n\n.invoice-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  margin-top: 12px;\n  font-size: 13px;\n  color: #111;\n}\n\n.invoice-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.invoice-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  border: 1px solid #2a2a2a;\n  padding: 7px 8px;\n  vertical-align: top;\n}\n\n.invoice-table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  text-align: center;\n  font-weight: 900;\n}\n\n.col-ord[_ngcontent-%COMP%] { width: 48px; }\n.col-u[_ngcontent-%COMP%]   { width: 50px; }\n.col-q[_ngcontent-%COMP%]   { width: 86px; }\n.col-pu[_ngcontent-%COMP%]  { width: 110px; }\n.col-pt[_ngcontent-%COMP%]  { width: 120px; }\n\n.center[_ngcontent-%COMP%] { text-align: center; }\n.num[_ngcontent-%COMP%] { text-align: right; }\n\n\n\n\n\n.totals-area[_ngcontent-%COMP%] {\n  margin-top: 14px;\n  display: flex;\n  justify-content: flex-end;\n}\n\n.totals[_ngcontent-%COMP%] {\n  border-collapse: collapse;\n  width: 320px;\n  font-size: 13px;\n  color: #111;\n}\n\n.totals[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  border: 1px solid #2a2a2a;\n  padding: 7px 10px;\n}\n\n.totals[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]:first-child { width: 65%; }\n.totals[_ngcontent-%COMP%]   .grand[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] { font-weight: 900; }\n\n\n\n\n\n.ttc-words[_ngcontent-%COMP%] {\n  margin-top: 12px;\n  font-size: 12.5px;\n  color: #111;\n}\n\n\n\n\n\n\n.sign-stamp[_ngcontent-%COMP%] {\n  position: absolute;\n  right: 18mm;\n  bottom: 28mm;\n  width: 60mm;\n  height: auto;\n  display: none;\n}\n\n.sign-stamp[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  width: 100%;\n  height: auto;\n  object-fit: contain;\n}\n\n.print-only[_ngcontent-%COMP%] { display: none; }\n\n\n\n\n\n.invoice-footer[_ngcontent-%COMP%] {\n  margin-top: auto;\n  padding-top: 10px;\n  border-top: 1px solid #0a4ea1;\n  font-size: 11.5px;\n  text-align: center;\n  color: #0a4ea1;\n  font-weight: 700;\n}\n\n\n\n\n\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted);\n}\n\n\n\n\n\n@page {\n  size: A4;\n  margin: 0;\n}\n\n@media print {\n  .no-print[_ngcontent-%COMP%] { display: none !important; }\n\n  html[_ngcontent-%COMP%], body[_ngcontent-%COMP%] {\n    margin: 0 !important;\n    padding: 0 !important;\n    background: #fff !important;\n  }\n\n  .invoice-page[_ngcontent-%COMP%] {\n    box-shadow: none !important;\n    margin: 0 !important;\n    width: 210mm !important;\n    height: 297mm !important;\n    padding: 14mm 16mm !important;\n    overflow: hidden !important;\n\n    -webkit-print-color-adjust: exact !important;\n    print-color-adjust: exact !important;\n  }\n\n  .top-header[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr 160px 1fr !important;\n    gap: 12px !important;\n  }\n\n  .company-ar[_ngcontent-%COMP%] { text-align: right !important; }\n\n  table[_ngcontent-%COMP%], tr[_ngcontent-%COMP%], td[_ngcontent-%COMP%], th[_ngcontent-%COMP%] {\n    page-break-inside: avoid !important;\n    break-inside: avoid !important;\n  }\n\n  img[_ngcontent-%COMP%] {\n    -webkit-print-color-adjust: exact !important;\n    print-color-adjust: exact !important;\n  }\n\n  .print-only[_ngcontent-%COMP%] { display: block !important; }\n  .sign-stamp[_ngcontent-%COMP%] { display: block !important; }\n}\n\n\n\n\n\n@media (max-width: 980px) {\n  .invoice-page[_ngcontent-%COMP%] {\n    height: auto;\n    min-height: 297mm;\n    padding: 20px;\n  }\n\n  .top-header[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n    text-align: center;\n  }\n\n  .company-ar[_ngcontent-%COMP%] { text-align: center; }\n\n  .client-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n    gap: 10px;\n  }\n\n  .date-right[_ngcontent-%COMP%] { text-align: center; justify-self: center; }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuotePreviewComponent, [{
        type: Component,
        args: [{ selector: 'app-quote-preview', standalone: true, imports: [CommonModule, RouterModule], template: "<div class=\"preview-toolbar no-print\">\n  <button class=\"btn ghost\" (click)=\"back()\">Retour</button>\n  <div class=\"toolbar-actions\">\n    <button class=\"btn outline\" (click)=\"edit()\" [disabled]=\"!quote\">Modifier</button>\n    <button class=\"btn primary\" (click)=\"print()\" [disabled]=\"!quote\">Imprimer</button>\n\n    <button class=\"btn outline\" (click)=\"exportPdf()\" [disabled]=\"!quote\">\n      Enregistrer PDF\n    </button>\n  </div>\n</div>\n\n<div class=\"invoice-page\" *ngIf=\"quote as q\">\n  <!-- ======= TOP HEADER (FR | LOGO | AR) ======= -->\n  <header class=\"top-header\">\n    <div class=\"company-fr\">\n      <div class=\"line1\">SOCIETE PRATIQUES ALUMINIUM</div>\n      <div>59, Av. de l&rsquo;Ind&eacute;pendance - Cit&eacute; Ettadhamen</div>\n      <div>2041 ARIANA</div>\n    </div>\n\n    <div class=\"top-logo\">\n      <img\n        *ngIf=\"logoAvailable\"\n        src=\"assets/logospa.png\"\n        alt=\"SPA logo\"\n        (error)=\"logoAvailable = false\"\n      />\n      <div *ngIf=\"!logoAvailable\" class=\"logo-fallback\">SPA</div>\n\n      <div class=\"client-under-logo\">\n        <div class=\"client-name\">\n          {{ q.client.nom }}\n        </div>\n        <div class=\"client-sub\">\n          {{ q.client.adresse }}\n        </div>\n        <div class=\"client-sub\">\n          CODE T.V.A : {{ q.client.mf }}\n        </div>\n      </div>\n    </div>\n\n    <div class=\"company-ar\" dir=\"rtl\" lang=\"ar\">\n      <div class=\"line1\">\n        &#1588;&#1585;&#1603;&#1577; &#1578;&#1591;&#1576;&#1610;&#1602;&#1575;&#1578; &#1575;&#1604;&#1571;&#1604;&#1605;&#1606;&#1610;&#1608;&#1605;\n      </div>\n      <div>\n        59&#1548; &#1588;&#1575;&#1585;&#1593; &#1575;&#1604;&#1575;&#1587;&#1578;&#1602;&#1604;&#1575;&#1604; - &#1581;&#1610; &#1575;&#1604;&#1578;&#1590;&#1575;&#1605;&#1606;\n      </div>\n      <div>2041 &#1571;&#1585;&#1610;&#1575;&#1606;&#1577;</div>\n    </div>\n  </header>\n\n  <!-- ======= DATE RIGHT ======= -->\n  <section class=\"client-row\">\n    <div class=\"date-right\">\n      <div class=\"muted\">Tunis, le</div>\n      <div class=\"date-strong\">{{ q.date | date:'dd/MM/yyyy' }}</div>\n    </div>\n  </section>\n\n  <!-- ======= TITLE ======= -->\n  <div class=\"invoice-title\">\n    DEVIS N&deg; <span class=\"mono\">{{ q.numero }}</span>\n  </div>\n\n  <div class=\"order-line\">\n    Bon de Commande N&deg; <span class=\"muted\">&mdash;</span>\n  </div>\n\n  <!-- ======= TABLE ======= -->\n  <table class=\"invoice-table\">\n    <thead>\n      <tr>\n        <th class=\"col-ord\">ORD</th>\n        <th>DESIGNATIONS</th>\n        <th class=\"col-u\">U</th>\n        <th class=\"col-q\">QUANT</th>\n        <th class=\"col-pu\">P.UNIT</th>\n        <th class=\"col-pt\">P.TOTAL</th>\n      </tr>\n    </thead>\n\n    <tbody>\n      <tr *ngFor=\"let line of q.lignes; let i = index\">\n        <td class=\"center\">{{ i + 1 }}</td>\n        <td>{{ line.designation }}</td>\n        <td class=\"center\">{{ line.unite }}</td>\n        <td class=\"center\">{{ line.quantite | number:'1.0-3' }}</td>\n        <td class=\"num\">{{ line.prixUnitaire | number:'1.3-3' }}</td>\n        <td class=\"num\">{{ calc.lineHT(line) | number:'1.3-3' }}</td>\n      </tr>\n    </tbody>\n  </table>\n\n  <!-- ======= TOTALS RIGHT BOX (DEVIS: PAS DE TVA / PAS DE TTC) ======= -->\n  <div class=\"totals-area\">\n    <table class=\"totals\">\n      <tbody>\n        <tr>\n          <td>TOTAL HT</td>\n          <td class=\"num\">{{ totals.totalHT | number:'1.3-3' }}</td>\n        </tr>\n\n        <tr *ngIf=\"totals.remise > 0\">\n          <td>Remise</td>\n          <td class=\"num\">- {{ totals.remise | number:'1.3-3' }}</td>\n        </tr>\n\n        <tr>\n          <td>Fodec (1%)</td>\n          <td class=\"num\">{{ totals.fodec | number:'1.3-3' }}</td>\n        </tr>\n\n        <tr class=\"grand\">\n          <td>TOTAL Hors T.V.A</td>\n          <td class=\"num\">{{ totals.totalHorsTVA | number:'1.3-3' }}</td>\n        </tr>\n      </tbody>\n    </table>\n  </div>\n\n  <!-- ======= TOTAL IN WORDS (HORS TVA) ======= -->\n  <div class=\"ttc-words\">\n    Arr&ecirc;t&eacute; le pr&eacute;sent devis &agrave; la somme de :\n    <strong>{{ totalHorsTvaText }}</strong>\n  </div>\n\n  <!-- SIGNATURE + CACHET (print/pdf only) -->\n  <div class=\"sign-stamp print-only\" *ngIf=\"!isPdfExport\">\n    <img src=\"assets/signature-cachet.png\" alt=\"Signature et cachet\" />\n  </div>\n\n  <!-- ======= FOOTER ======= -->\n  <footer class=\"invoice-footer\">\n    R.C. : B035 145 2004 - M.F. : 89 83 00 W/A/M/000 - RIB : 25079 0000000 213 555 60 zitouna Mutuelle ville<br>\n    T&eacute;l. : 71 515 491 - Fax : 70 661 034 - E-mail : saadani.karim@planet.tn\n  </footer>\n</div>\n\n<div class=\"empty card\" *ngIf=\"!quote\">\n  Devis introuvable.\n</div>\n", styles: ["/* =========================\n   TOOLBAR (screen only)\n========================= */\n.preview-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 16px;\n  gap: 12px;\n}\n\n.toolbar-actions {\n  display: flex;\n  gap: 10px;\n  flex-wrap: wrap;\n}\n\n/* =========================\n   PAGE (screen)\n========================= */\n.invoice-page {\n  background: #fff;\n  width: min(100%, 210mm);\n  height: 297mm;\n  margin: 0 auto;\n  padding: 14mm 16mm;\n  box-shadow: var(--shadow);\n  border-radius: 0;\n  display: flex;\n  flex-direction: column;\n  position: relative;\n  overflow: hidden;\n\n  -webkit-print-color-adjust: exact;\n  print-color-adjust: exact;\n}\n\n/* =========================\n   TOP HEADER (FR | LOGO | AR)\n========================= */\n.top-header {\n  display: grid;\n  grid-template-columns: 1fr 160px 1fr;\n  align-items: start;\n  gap: 12px;\n}\n\n.company-fr,\n.company-ar {\n  font-size: 12px;\n  line-height: 1.25;\n  color: #0a4ea1;\n}\n\n.company-fr .line1,\n.company-ar .line1 {\n  font-weight: 900;\n  font-size: 13.8px;\n  margin-bottom: 2px;\n  color: #083a7a;\n}\n\n.company-ar {\n  text-align: right;\n  font-family: \"Tahoma\", \"Arial\", sans-serif;\n}\n\n.top-logo {\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-start;\n  align-items: center;\n  padding-top: 2px;\n  text-align: center;\n  gap: 10px;\n}\n\n.top-logo img {\n  display: block;\n  margin: 0 auto;\n  width: 120px;\n  height: auto;\n  object-fit: contain;\n  -webkit-print-color-adjust: exact;\n  print-color-adjust: exact;\n}\n\n.logo-fallback {\n  font-family: 'Space Grotesk', sans-serif;\n  font-weight: 900;\n  font-size: 26px;\n}\n\n.client-under-logo {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  margin-top: 14px;\n  text-align: center;\n  line-height: 1.2;\n}\n\n.client-under-logo .client-name {\n  font-weight: 900;\n  font-size: 22px;\n  letter-spacing: 0.6px;\n  margin: 0 0 2px 0;\n  color: #111;\n  white-space: nowrap;\n  overflow-wrap: normal;\n  word-break: keep-all;\n  hyphens: none;\n  width: max-content;\n  text-align: center;\n}\n\n.client-under-logo .client-sub {\n  font-size: 13px;\n  margin: 0;\n  color: #111;\n  line-height: 1.15;\n  white-space: nowrap;\n  overflow-wrap: normal;\n  word-break: keep-all;\n  hyphens: none;\n  width: max-content;\n  text-align: center;\n}\n\n/* =========================\n   CLIENT (adresse) + DATE (right)\n========================= */\n.client-row {\n  margin-top: 14px;\n  display: grid;\n  grid-template-columns: 1fr 180px;\n  align-items: start;\n}\n\n.client-center {\n  justify-self: center;\n  text-align: center;\n  width: 100%;\n  margin-top: 6px;\n}\n\n.client-title { display: none; }\n\n.client-name {\n  font-weight: 900;\n  font-size: 22px;\n  letter-spacing: 0.6px;\n  margin-bottom: 4px;\n  color: #111;\n}\n\n.client-sub {\n  font-size: 13px;\n  margin-top: 2px;\n  color: #111;\n}\n\n.date-right {\n  grid-column: 2;\n  justify-self: end;\n  text-align: right;\n  font-size: 13px;\n  color: #111;\n}\n\n.date-right .muted { color: #333; }\n.date-right .date-strong { font-weight: 900; }\n\n/* =========================\n   TITLE + ORDER LINE\n========================= */\n.invoice-title {\n  margin-top: 18px;\n  text-align: center;\n  font-weight: 900;\n  font-size: 18px;\n  letter-spacing: 0.8px;\n  color: #111;\n}\n\n.mono {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,\n    \"Liberation Mono\", \"Courier New\", monospace;\n}\n\n.order-line {\n  margin-top: 12px;\n  font-size: 13px;\n  color: #111;\n}\n\n.muted { color: #666; }\n\n/* =========================\n   TABLE\n========================= */\n.invoice-table {\n  width: 100%;\n  border-collapse: collapse;\n  margin-top: 12px;\n  font-size: 13px;\n  color: #111;\n}\n\n.invoice-table th,\n.invoice-table td {\n  border: 1px solid #2a2a2a;\n  padding: 7px 8px;\n  vertical-align: top;\n}\n\n.invoice-table thead th {\n  text-align: center;\n  font-weight: 900;\n}\n\n.col-ord { width: 48px; }\n.col-u   { width: 50px; }\n.col-q   { width: 86px; }\n.col-pu  { width: 110px; }\n.col-pt  { width: 120px; }\n\n.center { text-align: center; }\n.num { text-align: right; }\n\n/* =========================\n   TOTALS BOX\n========================= */\n.totals-area {\n  margin-top: 14px;\n  display: flex;\n  justify-content: flex-end;\n}\n\n.totals {\n  border-collapse: collapse;\n  width: 320px;\n  font-size: 13px;\n  color: #111;\n}\n\n.totals td {\n  border: 1px solid #2a2a2a;\n  padding: 7px 10px;\n}\n\n.totals td:first-child { width: 65%; }\n.totals .grand td { font-weight: 900; }\n\n/* =========================\n   TOTAL IN WORDS\n========================= */\n.ttc-words {\n  margin-top: 12px;\n  font-size: 12.5px;\n  color: #111;\n}\n\n/* =========================\n   SIGNATURE + CACHET\n   - visible seulement PRINT/PDF\n========================= */\n.sign-stamp {\n  position: absolute;\n  right: 18mm;\n  bottom: 28mm;\n  width: 60mm;\n  height: auto;\n  display: none;\n}\n\n.sign-stamp img {\n  width: 100%;\n  height: auto;\n  object-fit: contain;\n}\n\n.print-only { display: none; }\n\n/* =========================\n   FOOTER (always bottom, blue)\n========================= */\n.invoice-footer {\n  margin-top: auto;\n  padding-top: 10px;\n  border-top: 1px solid #0a4ea1;\n  font-size: 11.5px;\n  text-align: center;\n  color: #0a4ea1;\n  font-weight: 700;\n}\n\n/* =========================\n   EMPTY\n========================= */\n.empty {\n  text-align: center;\n  color: var(--muted);\n}\n\n/* =========================\n   PRINT (FORCE IDENTIQUE)\n========================= */\n@page {\n  size: A4;\n  margin: 0;\n}\n\n@media print {\n  .no-print { display: none !important; }\n\n  html, body {\n    margin: 0 !important;\n    padding: 0 !important;\n    background: #fff !important;\n  }\n\n  .invoice-page {\n    box-shadow: none !important;\n    margin: 0 !important;\n    width: 210mm !important;\n    height: 297mm !important;\n    padding: 14mm 16mm !important;\n    overflow: hidden !important;\n\n    -webkit-print-color-adjust: exact !important;\n    print-color-adjust: exact !important;\n  }\n\n  .top-header {\n    grid-template-columns: 1fr 160px 1fr !important;\n    gap: 12px !important;\n  }\n\n  .company-ar { text-align: right !important; }\n\n  table, tr, td, th {\n    page-break-inside: avoid !important;\n    break-inside: avoid !important;\n  }\n\n  img {\n    -webkit-print-color-adjust: exact !important;\n    print-color-adjust: exact !important;\n  }\n\n  .print-only { display: block !important; }\n  .sign-stamp { display: block !important; }\n}\n\n/* =========================\n   RESPONSIVE (screen only)\n========================= */\n@media (max-width: 980px) {\n  .invoice-page {\n    height: auto;\n    min-height: 297mm;\n    padding: 20px;\n  }\n\n  .top-header {\n    grid-template-columns: 1fr;\n    text-align: center;\n  }\n\n  .company-ar { text-align: center; }\n\n  .client-row {\n    grid-template-columns: 1fr;\n    gap: 10px;\n  }\n\n  .date-right { text-align: center; justify-self: center; }\n}\n"] }]
    }], () => [{ type: i1.ActivatedRoute }, { type: i1.Router }, { type: i2.QuoteStoreService }, { type: i3.QuoteCalcService }, { type: i4.ElectronService }, { type: i0.ChangeDetectorRef }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(QuotePreviewComponent, { className: "QuotePreviewComponent", filePath: "src/app/components/quote-preview/quote-preview.component.ts", lineNumber: 16 }); })();
