import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, map, startWith, takeUntil } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "../../services/invoice-store.service";
import * as i2 from "../../services/invoice-calc.service";
import * as i3 from "@angular/common";
import * as i4 from "@angular/router";
import * as i5 from "@angular/forms";
const _c0 = a0 => ["/invoices", a0, "preview"];
const _c1 = a0 => ["/invoices", a0, "edit"];
function InvoiceListComponent_option_12_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "option", 14);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const month_r1 = ctx.$implicit;
    i0.ɵɵproperty("value", month_r1.key);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", month_r1.label, " ");
} }
function InvoiceListComponent_div_18_div_18_Template(rf, ctx) { if (rf & 1) {
    const _r2 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 22)(1, "div", 23);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "div");
    i0.ɵɵtext(4);
    i0.ɵɵpipe(5, "date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "div");
    i0.ɵɵtext(7);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "div", 24);
    i0.ɵɵtext(9);
    i0.ɵɵpipe(10, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "div", 25)(12, "a", 26);
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(13, "svg", 27);
    i0.ɵɵelement(14, "path", 28)(15, "circle", 29);
    i0.ɵɵelementEnd()();
    i0.ɵɵnamespaceHTML();
    i0.ɵɵelementStart(16, "a", 30);
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(17, "svg", 27);
    i0.ɵɵelement(18, "path", 31)(19, "path", 32);
    i0.ɵɵelementEnd()();
    i0.ɵɵnamespaceHTML();
    i0.ɵɵelementStart(20, "button", 33);
    i0.ɵɵlistener("click", function InvoiceListComponent_div_18_div_18_Template_button_click_20_listener() { const invoice_r3 = i0.ɵɵrestoreView(_r2).$implicit; const ctx_r3 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r3.deleteInvoice(invoice_r3)); });
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(21, "svg", 27);
    i0.ɵɵelement(22, "path", 34)(23, "path", 35)(24, "path", 36)(25, "path", 37)(26, "path", 38);
    i0.ɵɵelementEnd()()()();
} if (rf & 2) {
    const invoice_r3 = ctx.$implicit;
    const ctx_r3 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(invoice_r3.numero);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(5, 6, invoice_r3.date, "dd/MM/yyyy"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(invoice_r3.client.nom);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(10, 9, ctx_r3.totalTTC(invoice_r3), "1.2-2"), " DT");
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("routerLink", i0.ɵɵpureFunction1(12, _c0, invoice_r3.id));
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("routerLink", i0.ɵɵpureFunction1(14, _c1, invoice_r3.id));
} }
function InvoiceListComponent_div_18_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 15)(1, "div", 16)(2, "div", 17);
    i0.ɵɵtext(3);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "div", 18);
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(6, "div", 19)(7, "div", 20)(8, "div");
    i0.ɵɵtext(9, "Num\u00E9ro");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "div");
    i0.ɵɵtext(11, "Date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(12, "div");
    i0.ɵɵtext(13, "Client");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "div");
    i0.ɵɵtext(15, "Total TTC");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(16, "div");
    i0.ɵɵtext(17, "Actions");
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(18, InvoiceListComponent_div_18_div_18_Template, 27, 16, "div", 21);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const group_r5 = ctx.$implicit;
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(group_r5.label);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("", group_r5.items.length, " factures");
    i0.ɵɵadvance(13);
    i0.ɵɵproperty("ngForOf", group_r5.items);
} }
function InvoiceListComponent_div_20_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 39);
    i0.ɵɵtext(1, " Aucune facture trouv\u00E9e. ");
    i0.ɵɵelementEnd();
} }
function InvoiceListComponent_ng_container_23_div_17_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 46)(1, "div", 23);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "div");
    i0.ɵɵtext(4);
    i0.ɵɵpipe(5, "date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "div");
    i0.ɵɵtext(7);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "div", 24);
    i0.ɵɵtext(9);
    i0.ɵɵpipe(10, "number");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const invoice_r6 = ctx.$implicit;
    const ctx_r3 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(invoice_r6.numero);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(5, 4, invoice_r6.date, "dd/MM/yyyy"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(invoice_r6.client.nom);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(10, 7, ctx_r3.totalTTC(invoice_r6), "1.2-2"), " DT");
} }
function InvoiceListComponent_ng_container_23_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementContainerStart(0);
    i0.ɵɵelementStart(1, "div", 40)(2, "div", 41);
    i0.ɵɵtext(3);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "div", 42);
    i0.ɵɵtext(5);
    i0.ɵɵpipe(6, "date");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(7, "div", 43)(8, "div", 44)(9, "div");
    i0.ɵɵtext(10, "NUM\u00C9RO");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "div");
    i0.ɵɵtext(12, "DATE");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(13, "div");
    i0.ɵɵtext(14, "CLIENT");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(15, "div");
    i0.ɵɵtext(16, "TOTAL TTC");
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(17, InvoiceListComponent_ng_container_23_div_17_Template, 11, 10, "div", 45);
    i0.ɵɵelementEnd();
    i0.ɵɵelementContainerEnd();
} if (rf & 2) {
    const printedInvoices_r7 = ctx.ngIf;
    const ctx_r3 = i0.ɵɵnextContext();
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate1("Liste des factures \u2014 ", ctx_r3.selectedMonthLabel);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1(" Date d\u2019impression : ", i0.ɵɵpipeBind2(6, 3, ctx_r3.printDate, "dd/MM/yyyy HH:mm"), " ");
    i0.ɵɵadvance(12);
    i0.ɵɵproperty("ngForOf", printedInvoices_r7);
} }
function InvoiceListComponent_div_25_Template(rf, ctx) { if (rf & 1) {
    const _r8 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 47)(1, "span", 48);
    i0.ɵɵtext(2, "\u2139\uFE0F");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "span", 49);
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "button", 50);
    i0.ɵɵlistener("click", function InvoiceListComponent_div_25_Template_button_click_5_listener() { i0.ɵɵrestoreView(_r8); const ctx_r3 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r3.closeToast()); });
    i0.ɵɵtext(6, "\u00D7");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r3 = i0.ɵɵnextContext();
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate(ctx_r3.toast.message);
} }
export class InvoiceListComponent {
    constructor(store, calc, cdr) {
        this.store = store;
        this.calc = calc;
        this.cdr = cdr;
        this.destroy$ = new Subject();
        this.searchControl = new FormControl('', { nonNullable: true });
        this.monthControl = new FormControl('all', { nonNullable: true });
        this.isPrintMode = false;
        this.printDate = null;
        this.selectedMonthLabel = '';
        this.printInvoicesSnapshot = [];
        this.afterPrintHandler = () => {
            if (!this.isPrintMode)
                return;
            this.isPrintMode = false;
            this.cdr.detectChanges();
            if (this.printFallbackTimer) {
                window.clearTimeout(this.printFallbackTimer);
                this.printFallbackTimer = undefined;
            }
        };
        this.toast = {
            open: false,
            type: 'info',
            message: ''
        };
        this.filteredInvoices$ = combineLatest([
            this.store.invoices$,
            this.searchControl.valueChanges.pipe(startWith(''))
        ]).pipe(map(([invoices, term]) => {
            const query = term.trim().toLowerCase();
            if (!query)
                return invoices;
            return invoices.filter((invoice) => invoice.numero.toLowerCase().includes(query) ||
                invoice.client.nom.toLowerCase().includes(query));
        }));
        this.baseGroups$ = this.filteredInvoices$.pipe(map((invoices) => {
            const groups = this.buildMonthGroups(invoices);
            this.ensureMonthSelection(groups);
            return groups;
        }));
        this.groupedInvoices$ = combineLatest([
            this.baseGroups$,
            this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
        ]).pipe(map(([groups, key]) => {
            if (!key || key === 'all')
                return groups;
            return groups.filter((group) => group.key === key);
        }));
        this.monthOptions$ = this.baseGroups$.pipe(map((groups) => groups.map((group) => ({ key: group.key, label: group.label }))));
        this.selectedMonthLabel$ = combineLatest([
            this.monthOptions$,
            this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
        ]).pipe(map(([options, key]) => {
            if (!key || key === 'all')
                return 'Tous les mois';
            return options.find((option) => option.key === key)?.label ?? 'Tous les mois';
        }));
        this.printInvoices$ = combineLatest([
            this.filteredInvoices$,
            this.monthControl.valueChanges.pipe(startWith(this.monthControl.value))
        ]).pipe(map(([invoices, key]) => {
            if (!key || key === 'all')
                return this.sortInvoices(invoices);
            const filtered = invoices.filter((invoice) => this.getMonthKey(this.parseDate(invoice.date)) === key);
            return this.sortInvoices(filtered);
        }));
    }
    async ngOnInit() {
        await this.store.load();
        window.addEventListener('afterprint', this.afterPrintHandler);
        this.selectedMonthLabel$
            .pipe(takeUntil(this.destroy$))
            .subscribe((label) => {
            this.selectedMonthLabel = label;
        });
        this.printInvoices$
            .pipe(takeUntil(this.destroy$))
            .subscribe((list) => {
            this.printInvoicesSnapshot = list;
        });
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        window.removeEventListener('afterprint', this.afterPrintHandler);
        if (this.toastTimer)
            window.clearTimeout(this.toastTimer);
        if (this.printFallbackTimer)
            window.clearTimeout(this.printFallbackTimer);
    }
    totalTTC(invoice) {
        return this.calc.totals(invoice).totalTTC;
    }
    async deleteInvoice(invoice) {
        const confirmed = confirm(`Supprimer la facture ${invoice.numero} ?`);
        if (!confirmed)
            return;
        await this.store.delete(invoice.id);
    }
    printSelectedMonth() {
        if (!this.printInvoicesSnapshot.length) {
            this.showToast('info', 'Aucune facture pour ce mois');
            return;
        }
        this.printDate = new Date();
        this.isPrintMode = true;
        this.cdr.detectChanges();
        window.setTimeout(() => window.print(), 50);
        if (this.printFallbackTimer)
            window.clearTimeout(this.printFallbackTimer);
        this.printFallbackTimer = window.setTimeout(() => this.afterPrintHandler(), 1000);
    }
    showToast(type, message) {
        this.toast = { open: true, type, message };
        if (this.toastTimer)
            window.clearTimeout(this.toastTimer);
        this.toastTimer = window.setTimeout(() => this.closeToast(), 2200);
    }
    closeToast() {
        this.toast = { ...this.toast, open: false };
        if (this.toastTimer) {
            window.clearTimeout(this.toastTimer);
            this.toastTimer = undefined;
        }
    }
    ensureMonthSelection(groups) {
        if (!groups.length) {
            if (this.monthControl.value !== 'all') {
                this.monthControl.setValue('all', { emitEvent: false });
            }
            return;
        }
        const current = this.monthControl.value;
        if (!current || current === 'all')
            return;
        if (!groups.some((group) => group.key === current)) {
            this.monthControl.setValue('all', { emitEvent: false });
        }
    }
    buildMonthGroups(invoices) {
        const sorted = [...invoices].sort((a, b) => this.toTime(b.date) - this.toTime(a.date));
        const groups = new Map();
        sorted.forEach((invoice) => {
            const date = this.parseDate(invoice.date);
            const key = this.getMonthKey(date);
            if (!groups.has(key)) {
                groups.set(key, { key, label: this.formatMonthLabel(date), items: [] });
            }
            groups.get(key)?.items.push(invoice);
        });
        return Array.from(groups.values());
    }
    sortInvoices(invoices) {
        return [...invoices].sort((a, b) => {
            const diff = this.toTime(b.date) - this.toTime(a.date);
            if (diff !== 0)
                return diff;
            return b.numero.localeCompare(a.numero);
        });
    }
    parseDate(value) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime()))
            return new Date(0);
        return parsed;
    }
    toTime(value) {
        const time = new Date(value).getTime();
        return Number.isNaN(time) ? 0 : time;
    }
    getMonthKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }
    formatMonthLabel(date) {
        const label = new Date(date.getFullYear(), date.getMonth(), 1)
            .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        return label.charAt(0).toUpperCase() + label.slice(1);
    }
    static { this.ɵfac = function InvoiceListComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InvoiceListComponent)(i0.ɵɵdirectiveInject(i1.InvoiceStoreService), i0.ɵɵdirectiveInject(i2.InvoiceCalcService), i0.ɵɵdirectiveInject(i0.ChangeDetectorRef)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: InvoiceListComponent, selectors: [["app-invoice-list"]], decls: 26, vars: 17, consts: [[1, "panel", "card", "no-print"], [1, "panel-header"], [1, "panel-actions", "no-print"], ["type", "search", "placeholder", "Rechercher par num\u00E9ro ou client", 1, "input", 3, "formControl"], ["aria-label", "Mois \u00E0 imprimer", 1, "input", 3, "formControl"], ["value", "all"], [3, "value", 4, "ngFor", "ngForOf"], ["type", "button", 1, "btn", "ghost", 3, "click"], ["routerLink", "/invoices/new", 1, "btn", "primary"], ["class", "month-group", 4, "ngFor", "ngForOf"], ["class", "empty", 4, "ngIf"], [1, "print-area"], [4, "ngIf"], ["class", "toast no-print", 4, "ngIf"], [3, "value"], [1, "month-group"], [1, "month-header"], [1, "month-title"], [1, "month-meta"], [1, "table"], [1, "table-row", "table-head"], ["class", "table-row", 4, "ngFor", "ngForOf"], [1, "table-row"], [1, "mono"], [1, "amount"], [1, "actions"], ["aria-label", "Aper\u00E7u", "title", "Aper\u00E7u", 1, "icon-btn", "icon-btn--ghost", 3, "routerLink"], ["viewBox", "0 0 24 24", "aria-hidden", "true"], ["d", "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"], ["cx", "12", "cy", "12", "r", "3"], ["aria-label", "Modifier", "title", "Modifier", 1, "icon-btn", "icon-btn--outline", 3, "routerLink"], ["d", "M12 20h9"], ["d", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"], ["type", "button", "aria-label", "Supprimer", "title", "Supprimer", 1, "icon-btn", "icon-btn--danger", 3, "click"], ["d", "M3 6h18"], ["d", "M8 6V4h8v2"], ["d", "M19 6l-1 14H6L5 6"], ["d", "M10 11v6"], ["d", "M14 11v6"], [1, "empty"], [1, "print-header"], [1, "print-title"], [1, "print-meta"], [1, "print-table"], [1, "print-row", "print-head"], ["class", "print-row", 4, "ngFor", "ngForOf"], [1, "print-row"], [1, "toast", "no-print"], [1, "toast-icon"], [1, "toast-message"], ["type", "button", 1, "toast-close", 3, "click"]], template: function InvoiceListComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4, "Liste des factures");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "G\u00E9rez l\u2019historique de facturation de SPA en un coup d\u2019\u0153il.");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(7, "div", 2);
            i0.ɵɵelement(8, "input", 3);
            i0.ɵɵelementStart(9, "select", 4)(10, "option", 5);
            i0.ɵɵtext(11, "Tous les mois");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(12, InvoiceListComponent_option_12_Template, 2, 2, "option", 6);
            i0.ɵɵpipe(13, "async");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(14, "button", 7);
            i0.ɵɵlistener("click", function InvoiceListComponent_Template_button_click_14_listener() { return ctx.printSelectedMonth(); });
            i0.ɵɵtext(15, "Imprimer");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(16, "a", 8);
            i0.ɵɵtext(17, "Nouveau");
            i0.ɵɵelementEnd()()();
            i0.ɵɵtemplate(18, InvoiceListComponent_div_18_Template, 19, 3, "div", 9);
            i0.ɵɵpipe(19, "async");
            i0.ɵɵtemplate(20, InvoiceListComponent_div_20_Template, 2, 0, "div", 10);
            i0.ɵɵpipe(21, "async");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(22, "section", 11);
            i0.ɵɵtemplate(23, InvoiceListComponent_ng_container_23_Template, 18, 6, "ng-container", 12);
            i0.ɵɵpipe(24, "async");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(25, InvoiceListComponent_div_25_Template, 7, 1, "div", 13);
        } if (rf & 2) {
            let tmp_4_0;
            i0.ɵɵadvance(8);
            i0.ɵɵproperty("formControl", ctx.searchControl);
            i0.ɵɵadvance();
            i0.ɵɵproperty("formControl", ctx.monthControl);
            i0.ɵɵadvance(3);
            i0.ɵɵproperty("ngForOf", i0.ɵɵpipeBind1(13, 9, ctx.monthOptions$));
            i0.ɵɵadvance(6);
            i0.ɵɵproperty("ngForOf", i0.ɵɵpipeBind1(19, 11, ctx.groupedInvoices$));
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ((tmp_4_0 = i0.ɵɵpipeBind1(21, 13, ctx.filteredInvoices$)) == null ? null : tmp_4_0.length) === 0);
            i0.ɵɵadvance(2);
            i0.ɵɵclassProp("print-only", ctx.isPrintMode);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", i0.ɵɵpipeBind1(24, 15, ctx.printInvoices$));
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.toast.open);
        } }, dependencies: [CommonModule, i3.NgForOf, i3.NgIf, RouterModule, i4.RouterLink, ReactiveFormsModule, i5.NgSelectOption, i5.ɵNgSelectMultipleOption, i5.DefaultValueAccessor, i5.SelectControlValueAccessor, i5.NgControlStatus, i5.FormControlDirective, i3.AsyncPipe, i3.DecimalPipe, i3.DatePipe], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.panel-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  flex-wrap: wrap;\n  margin-left: auto;\n  justify-content: flex-end;\n}\n\n.month-group[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.month-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 10px 14px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n}\n\n.month-title[_ngcontent-%COMP%] {\n  font-weight: 700;\n  letter-spacing: 0.01em;\n}\n\n.month-meta[_ngcontent-%COMP%] {\n  color: var(--muted);\n  font-size: 0.85rem;\n}\n\n.table[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.table-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.2fr 0.8fr 1.2fr 0.9fr 1.3fr;\n  gap: 12px;\n  align-items: center;\n  padding: 12px 0;\n  border-bottom: 1px solid var(--border);\n}\n\n.table-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.actions[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.icon-btn[_ngcontent-%COMP%] {\n  width: 36px;\n  height: 36px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 10px;\n  border: 1px solid var(--border);\n  background: #fff;\n  color: var(--ink);\n  cursor: pointer;\n  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;\n}\n\n.icon-btn[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  width: 18px;\n  height: 18px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 1.8;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n\n.icon-btn--ghost[_ngcontent-%COMP%] {\n  background: #f8f6f1;\n}\n\n.icon-btn--outline[_ngcontent-%COMP%] {\n  background: #fff;\n}\n\n.icon-btn--danger[_ngcontent-%COMP%] {\n  background: #fff5f5;\n  border-color: rgba(180, 35, 24, 0.3);\n  color: #b42318;\n}\n\n.icon-btn[_ngcontent-%COMP%]:hover {\n  background: #111827;\n  color: #fff;\n  transform: translateY(-1px);\n  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);\n}\n\n.icon-btn--danger[_ngcontent-%COMP%]:hover {\n  background: #b42318;\n  color: #fff;\n}\n\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted);\n  padding: 30px 0 10px;\n}\n\n.print-area[_ngcontent-%COMP%] {\n  display: none;\n  padding: 12px 0;\n}\n\n.print-area.print-only[_ngcontent-%COMP%] {\n  display: block;\n}\n\n.print-header[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding-bottom: 12px;\n  margin-bottom: 16px;\n  border-bottom: 1px solid #d1d5db;\n}\n\n.print-title[_ngcontent-%COMP%] {\n  font-size: 1.1rem;\n  font-weight: 700;\n}\n\n.print-meta[_ngcontent-%COMP%] {\n  font-size: 0.85rem;\n  color: #4b5563;\n}\n\n.print-table[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 6px;\n}\n\n.print-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.2fr 0.9fr 1.4fr 0.9fr;\n  gap: 12px;\n  align-items: center;\n  padding: 6px 0;\n  border-bottom: 1px solid #e5e7eb;\n}\n\n.print-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  font-weight: 700;\n  color: #111827;\n  border-bottom: 2px solid #111827;\n  padding-bottom: 8px;\n}\n\n.toast[_ngcontent-%COMP%] {\n  position: fixed;\n  right: 24px;\n  bottom: 24px;\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 14px;\n  border-radius: 12px;\n  background: #111827;\n  color: #fff;\n  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.2);\n  z-index: 80;\n}\n\n.toast-icon[_ngcontent-%COMP%] {\n  font-size: 1rem;\n}\n\n.toast-message[_ngcontent-%COMP%] {\n  font-size: 0.9rem;\n  font-weight: 600;\n}\n\n.toast-close[_ngcontent-%COMP%] {\n  background: transparent;\n  border: none;\n  color: #fff;\n  font-size: 1.1rem;\n  line-height: 1;\n  cursor: pointer;\n  padding: 2px 6px;\n  border-radius: 8px;\n}\n\n.toast-close[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.14);\n}\n\n@media (max-width: 980px) {\n  .panel-header[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n\n  .panel-actions[_ngcontent-%COMP%] {\n    width: 100%;\n  }\n\n  .table-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n    gap: 8px;\n  }\n}\n\n@page {\n  size: A4;\n  margin: 12mm;\n}\n\n@media print {\n  body[_ngcontent-%COMP%] {\n    background: #fff;\n  }\n\n  .no-print[_ngcontent-%COMP%] {\n    display: none !important;\n  }\n\n  .print-area[_ngcontent-%COMP%] {\n    display: block !important;\n  }\n\n  .card[_ngcontent-%COMP%], \n   .table[_ngcontent-%COMP%], \n   .table-row[_ngcontent-%COMP%] {\n    box-shadow: none !important;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InvoiceListComponent, [{
        type: Component,
        args: [{ selector: 'app-invoice-list', standalone: true, imports: [CommonModule, RouterModule, ReactiveFormsModule], template: "<section class=\"panel card no-print\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Liste des factures</h1>\n      <p>G&eacute;rez l&rsquo;historique de facturation de SPA en un coup d&rsquo;&oelig;il.</p>\n    </div>\n    <div class=\"panel-actions no-print\">\n      <input\n        class=\"input\"\n        type=\"search\"\n        placeholder=\"Rechercher par num&eacute;ro ou client\"\n        [formControl]=\"searchControl\"\n      >\n      <select class=\"input\" [formControl]=\"monthControl\" aria-label=\"Mois &agrave; imprimer\">\n        <option value=\"all\">Tous les mois</option>\n        <option *ngFor=\"let month of monthOptions$ | async\" [value]=\"month.key\">\n          {{ month.label }}\n        </option>\n      </select>\n      <button class=\"btn ghost\" type=\"button\" (click)=\"printSelectedMonth()\">Imprimer</button>\n      <a class=\"btn primary\" routerLink=\"/invoices/new\">Nouveau</a>\n    </div>\n  </div>\n\n  <!-- \u2705 group.items au lieu de filteredInvoices$ -->\n  <div class=\"month-group\" *ngFor=\"let group of groupedInvoices$ | async\">\n    <div class=\"month-header\">\n      <div class=\"month-title\">{{ group.label }}</div>\n      <div class=\"month-meta\">{{ group.items.length }} factures</div>\n    </div>\n\n    <div class=\"table\">\n      <div class=\"table-row table-head\">\n        <div>Num&eacute;ro</div>\n        <div>Date</div>\n        <div>Client</div>\n        <div>Total TTC</div>\n        <div>Actions</div>\n      </div>\n      <div class=\"table-row\" *ngFor=\"let invoice of group.items\">\n        <div class=\"mono\">{{ invoice.numero }}</div>\n        <div>{{ invoice.date | date:'dd/MM/yyyy' }}</div>\n        <div>{{ invoice.client.nom }}</div>\n        <div class=\"amount\">{{ totalTTC(invoice) | number:'1.2-2' }} DT</div>\n        <div class=\"actions\">\n          <a\n            class=\"icon-btn icon-btn--ghost\"\n            [routerLink]=\"['/invoices', invoice.id, 'preview']\"\n            aria-label=\"Aper&ccedil;u\"\n            title=\"Aper&ccedil;u\"\n          >\n            <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n              <path d=\"M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z\" />\n              <circle cx=\"12\" cy=\"12\" r=\"3\" />\n            </svg>\n          </a>\n          <a\n            class=\"icon-btn icon-btn--outline\"\n            [routerLink]=\"['/invoices', invoice.id, 'edit']\"\n            aria-label=\"Modifier\"\n            title=\"Modifier\"\n          >\n            <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n              <path d=\"M12 20h9\" />\n              <path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z\" />\n            </svg>\n          </a>\n          <button\n            class=\"icon-btn icon-btn--danger\"\n            type=\"button\"\n            (click)=\"deleteInvoice(invoice)\"\n            aria-label=\"Supprimer\"\n            title=\"Supprimer\"\n          >\n            <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n              <path d=\"M3 6h18\" />\n              <path d=\"M8 6V4h8v2\" />\n              <path d=\"M19 6l-1 14H6L5 6\" />\n              <path d=\"M10 11v6\" />\n              <path d=\"M14 11v6\" />\n            </svg>\n          </button>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"empty\" *ngIf=\"(filteredInvoices$ | async)?.length === 0\">\n    Aucune facture trouv&eacute;e.\n  </div>\n</section>\n\n<!-- \u2705 Section impression identique aux devis -->\n<section class=\"print-area\" [class.print-only]=\"isPrintMode\">\n  <ng-container *ngIf=\"printInvoices$ | async as printedInvoices\">\n    <div class=\"print-header\">\n      <div class=\"print-title\">Liste des factures &mdash; {{ selectedMonthLabel }}</div>\n      <div class=\"print-meta\">\n        Date d&rsquo;impression : {{ printDate | date:'dd/MM/yyyy HH:mm' }}\n      </div>\n    </div>\n\n    <div class=\"print-table\">\n      <div class=\"print-row print-head\">\n        <div>NUM&Eacute;RO</div>\n        <div>DATE</div>\n        <div>CLIENT</div>\n        <div>TOTAL TTC</div>\n      </div>\n      <div class=\"print-row\" *ngFor=\"let invoice of printedInvoices\">\n        <div class=\"mono\">{{ invoice.numero }}</div>\n        <div>{{ invoice.date | date:'dd/MM/yyyy' }}</div>\n        <div>{{ invoice.client.nom }}</div>\n        <div class=\"amount\">{{ totalTTC(invoice) | number:'1.2-2' }} DT</div>\n      </div>\n    </div>\n  </ng-container>\n</section>\n\n<div class=\"toast no-print\" *ngIf=\"toast.open\">\n  <span class=\"toast-icon\">\u2139\uFE0F</span>\n  <span class=\"toast-message\">{{ toast.message }}</span>\n  <button class=\"toast-close\" type=\"button\" (click)=\"closeToast()\">\u00D7</button>\n</div>", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.panel-actions {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n  flex-wrap: wrap;\n  margin-left: auto;\n  justify-content: flex-end;\n}\n\n.month-group {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.month-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 10px 14px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n}\n\n.month-title {\n  font-weight: 700;\n  letter-spacing: 0.01em;\n}\n\n.month-meta {\n  color: var(--muted);\n  font-size: 0.85rem;\n}\n\n.table {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.table-row {\n  display: grid;\n  grid-template-columns: 1.2fr 0.8fr 1.2fr 0.9fr 1.3fr;\n  gap: 12px;\n  align-items: center;\n  padding: 12px 0;\n  border-bottom: 1px solid var(--border);\n}\n\n.table-head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.icon-btn {\n  width: 36px;\n  height: 36px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 10px;\n  border: 1px solid var(--border);\n  background: #fff;\n  color: var(--ink);\n  cursor: pointer;\n  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;\n}\n\n.icon-btn svg {\n  width: 18px;\n  height: 18px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 1.8;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n\n.icon-btn--ghost {\n  background: #f8f6f1;\n}\n\n.icon-btn--outline {\n  background: #fff;\n}\n\n.icon-btn--danger {\n  background: #fff5f5;\n  border-color: rgba(180, 35, 24, 0.3);\n  color: #b42318;\n}\n\n.icon-btn:hover {\n  background: #111827;\n  color: #fff;\n  transform: translateY(-1px);\n  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);\n}\n\n.icon-btn--danger:hover {\n  background: #b42318;\n  color: #fff;\n}\n\n.empty {\n  text-align: center;\n  color: var(--muted);\n  padding: 30px 0 10px;\n}\n\n.print-area {\n  display: none;\n  padding: 12px 0;\n}\n\n.print-area.print-only {\n  display: block;\n}\n\n.print-header {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding-bottom: 12px;\n  margin-bottom: 16px;\n  border-bottom: 1px solid #d1d5db;\n}\n\n.print-title {\n  font-size: 1.1rem;\n  font-weight: 700;\n}\n\n.print-meta {\n  font-size: 0.85rem;\n  color: #4b5563;\n}\n\n.print-table {\n  display: grid;\n  gap: 6px;\n}\n\n.print-row {\n  display: grid;\n  grid-template-columns: 1.2fr 0.9fr 1.4fr 0.9fr;\n  gap: 12px;\n  align-items: center;\n  padding: 6px 0;\n  border-bottom: 1px solid #e5e7eb;\n}\n\n.print-head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  font-weight: 700;\n  color: #111827;\n  border-bottom: 2px solid #111827;\n  padding-bottom: 8px;\n}\n\n.toast {\n  position: fixed;\n  right: 24px;\n  bottom: 24px;\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 14px;\n  border-radius: 12px;\n  background: #111827;\n  color: #fff;\n  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.2);\n  z-index: 80;\n}\n\n.toast-icon {\n  font-size: 1rem;\n}\n\n.toast-message {\n  font-size: 0.9rem;\n  font-weight: 600;\n}\n\n.toast-close {\n  background: transparent;\n  border: none;\n  color: #fff;\n  font-size: 1.1rem;\n  line-height: 1;\n  cursor: pointer;\n  padding: 2px 6px;\n  border-radius: 8px;\n}\n\n.toast-close:hover {\n  background: rgba(255, 255, 255, 0.14);\n}\n\n@media (max-width: 980px) {\n  .panel-header {\n    flex-direction: column;\n  }\n\n  .panel-actions {\n    width: 100%;\n  }\n\n  .table-row {\n    grid-template-columns: 1fr;\n    gap: 8px;\n  }\n}\n\n@page {\n  size: A4;\n  margin: 12mm;\n}\n\n@media print {\n  body {\n    background: #fff;\n  }\n\n  .no-print {\n    display: none !important;\n  }\n\n  .print-area {\n    display: block !important;\n  }\n\n  .card,\n  .table,\n  .table-row {\n    box-shadow: none !important;\n  }\n}\n"] }]
    }], () => [{ type: i1.InvoiceStoreService }, { type: i2.InvoiceCalcService }, { type: i0.ChangeDetectorRef }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(InvoiceListComponent, { className: "InvoiceListComponent", filePath: "src/app/components/invoice-list/invoice-list.component.ts", lineNumber: 25 }); })();
