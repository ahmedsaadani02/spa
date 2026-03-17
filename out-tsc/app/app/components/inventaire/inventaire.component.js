import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, combineLatest, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "../../services/stock-store.service";
import * as i2 from "@angular/common/http";
import * as i3 from "../../services/auth.service";
import * as i4 from "@angular/common";
import * as i5 from "@angular/forms";
function InventaireComponent_div_24_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 15);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r0.priceInteractionMessage, " ");
} }
function InventaireComponent_tr_48_div_13_ng_container_3_div_7_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 34);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(4);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.priceEditError);
} }
function InventaireComponent_tr_48_div_13_ng_container_3_Template(rf, ctx) { if (rf & 1) {
    const _r2 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementContainerStart(0);
    i0.ɵɵelementStart(1, "div", 29)(2, "input", 30);
    i0.ɵɵlistener("keydown", function InventaireComponent_tr_48_div_13_ng_container_3_Template_input_keydown_2_listener($event) { i0.ɵɵrestoreView(_r2); const color_r3 = i0.ɵɵnextContext().$implicit; const row_r4 = i0.ɵɵnextContext().$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.onPriceInputKeydown($event, row_r4, color_r3)); })("blur", function InventaireComponent_tr_48_div_13_ng_container_3_Template_input_blur_2_listener() { i0.ɵɵrestoreView(_r2); const color_r3 = i0.ɵɵnextContext().$implicit; const row_r4 = i0.ɵɵnextContext().$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.onPriceInputBlur(row_r4, color_r3)); });
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "span", 31);
    i0.ɵɵtext(4, "DT");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(5, "div", 32);
    i0.ɵɵtext(6, "Entrer enregistrer \u00B7 Echap annuler");
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(7, InventaireComponent_tr_48_div_13_ng_container_3_div_7_Template, 2, 1, "div", 33);
    i0.ɵɵelementContainerEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("formControl", ctx_r0.priceControl);
    i0.ɵɵadvance(5);
    i0.ɵɵproperty("ngIf", ctx_r0.priceEditError);
} }
function InventaireComponent_tr_48_div_13_ng_template_4_button_0_Template(rf, ctx) { if (rf & 1) {
    const _r5 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 36);
    i0.ɵɵlistener("click", function InventaireComponent_tr_48_div_13_ng_template_4_button_0_Template_button_click_0_listener() { i0.ɵɵrestoreView(_r5); const color_r3 = i0.ɵɵnextContext(2).$implicit; const row_r4 = i0.ɵɵnextContext().$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.startAddPrice(row_r4, color_r3)); });
    i0.ɵɵtext(1, " Ajouter prix ");
    i0.ɵɵelementEnd();
} }
function InventaireComponent_tr_48_div_13_ng_template_4_ng_template_1_Template(rf, ctx) { if (rf & 1) {
    const _r6 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "span", 37);
    i0.ɵɵlistener("dblclick", function InventaireComponent_tr_48_div_13_ng_template_4_ng_template_1_Template_span_dblclick_0_listener() { i0.ɵɵrestoreView(_r6); const color_r3 = i0.ɵɵnextContext(2).$implicit; const row_r4 = i0.ɵɵnextContext().$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.startPriceEdit(row_r4, color_r3)); });
    i0.ɵɵtext(1);
    i0.ɵɵpipe(2, "number");
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const color_r3 = i0.ɵɵnextContext(2).$implicit;
    const row_r4 = i0.ɵɵnextContext().$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵclassProp("disabled", !ctx_r0.supportsPriceEditing);
    i0.ɵɵattribute("title", ctx_r0.supportsPriceEditing ? "Double clic pour modifier" : "Edition indisponible dans ce mode");
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", i0.ɵɵpipeBind2(2, 4, ctx_r0.getColorPrice(row_r4, color_r3), "1.2-2"), " DT ");
} }
function InventaireComponent_tr_48_div_13_ng_template_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵtemplate(0, InventaireComponent_tr_48_div_13_ng_template_4_button_0_Template, 2, 0, "button", 35)(1, InventaireComponent_tr_48_div_13_ng_template_4_ng_template_1_Template, 3, 7, "ng-template", null, 1, i0.ɵɵtemplateRefExtractor);
} if (rf & 2) {
    const existingPrice_r7 = i0.ɵɵreference(2);
    const color_r3 = i0.ɵɵnextContext().$implicit;
    const row_r4 = i0.ɵɵnextContext().$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵproperty("ngIf", ctx_r0.showAddPrice(row_r4, color_r3))("ngIfElse", existingPrice_r7);
} }
function InventaireComponent_tr_48_div_13_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 26)(1, "span", 27);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(3, InventaireComponent_tr_48_div_13_ng_container_3_Template, 8, 2, "ng-container", 28)(4, InventaireComponent_tr_48_div_13_ng_template_4_Template, 3, 2, "ng-template", null, 0, i0.ɵɵtemplateRefExtractor);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const color_r3 = ctx.$implicit;
    const readonlyPrice_r8 = i0.ɵɵreference(5);
    const row_r4 = i0.ɵɵnextContext().$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r0.colorLabel(color_r3));
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.isColorEditing(row_r4, color_r3))("ngIfElse", readonlyPrice_r8);
} }
function InventaireComponent_tr_48_button_22_Template(rf, ctx) { if (rf & 1) {
    const _r9 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 38);
    i0.ɵɵlistener("click", function InventaireComponent_tr_48_button_22_Template_button_click_0_listener() { const color_r10 = i0.ɵɵrestoreView(_r9).$implicit; const row_r4 = i0.ɵɵnextContext().$implicit; const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.openPriceHistory(row_r4, color_r10)); });
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const color_r10 = ctx.$implicit;
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵproperty("disabled", !ctx_r0.supportsPriceEditing);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" \uD83D\uDD58 ", ctx_r0.colorLabel(color_r10), " ");
} }
function InventaireComponent_tr_48_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td", 16);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "td");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "td");
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "td");
    i0.ɵɵtext(8);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "td", 17);
    i0.ɵɵtext(10);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "td", 18)(12, "div", 19);
    i0.ɵɵtemplate(13, InventaireComponent_tr_48_div_13_Template, 6, 3, "div", 20);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(14, "td", 21);
    i0.ɵɵtext(15);
    i0.ɵɵpipe(16, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(17, "td")(18, "span", 22);
    i0.ɵɵtext(19);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(20, "td", 23)(21, "div", 24);
    i0.ɵɵtemplate(22, InventaireComponent_tr_48_button_22_Template, 2, 2, "button", 25);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const row_r4 = ctx.$implicit;
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r4.item.label);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r4.qtyBlanc);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r4.qtyGris);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r4.qtyNoir);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r4.qtyTotal);
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("ngForOf", ctx_r0.colorOrder)("ngForTrackBy", ctx_r0.trackByColor);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(16, 13, row_r4.totalValue, "1.2-2"));
    i0.ɵɵadvance(3);
    i0.ɵɵclassProp("missing", row_r4.priceStatus === "missing");
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", row_r4.priceStatus === "missing" ? "Manquant" : "OK", " ");
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("ngForOf", ctx_r0.colorOrder)("ngForTrackBy", ctx_r0.trackByColor);
} }
function InventaireComponent_tr_49_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td", 39);
    i0.ɵɵtext(2, "Aucun produit correspondant.");
    i0.ɵɵelementEnd()();
} }
function InventaireComponent_div_50_div_8_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 48);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.historyModal.error);
} }
function InventaireComponent_div_50_div_9_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 49);
    i0.ɵɵtext(1, "Chargement...");
    i0.ɵɵelementEnd();
} }
function InventaireComponent_div_50_table_10_tr_12_Template(rf, ctx) { if (rf & 1) {
    const _r12 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "tr")(1, "td");
    i0.ɵɵtext(2);
    i0.ɵɵpipe(3, "date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "td");
    i0.ɵɵtext(5);
    i0.ɵɵpipe(6, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "td");
    i0.ɵɵtext(8);
    i0.ɵɵpipe(9, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "td")(11, "button", 51);
    i0.ɵɵlistener("click", function InventaireComponent_div_50_table_10_tr_12_Template_button_click_11_listener() { const entry_r13 = i0.ɵɵrestoreView(_r12).$implicit; const ctx_r0 = i0.ɵɵnextContext(3); return i0.ɵɵresetView(ctx_r0.restoreHistoryPrice(entry_r13)); });
    i0.ɵɵtext(12);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const entry_r13 = ctx.$implicit;
    const ctx_r0 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(3, 5, entry_r13.changedAt, "dd/MM/yyyy HH:mm"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(6, 8, entry_r13.oldPrice, "1.2-2"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(9, 11, entry_r13.newPrice, "1.2-2"));
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("disabled", ctx_r0.historyModal.restoringId === entry_r13.id);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r0.historyModal.restoringId === entry_r13.id ? "Restauration..." : "Restaurer", " ");
} }
function InventaireComponent_div_50_table_10_tr_13_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td", 52);
    i0.ɵɵtext(2, "Aucun historique pour ce produit/couleur.");
    i0.ɵɵelementEnd()();
} }
function InventaireComponent_div_50_table_10_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "table", 50)(1, "thead")(2, "tr")(3, "th");
    i0.ɵɵtext(4, "Date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "th");
    i0.ɵɵtext(6, "Ancien prix");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "th");
    i0.ɵɵtext(8, "Nouveau prix");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "th");
    i0.ɵɵtext(10, "Action");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(11, "tbody");
    i0.ɵɵtemplate(12, InventaireComponent_div_50_table_10_tr_12_Template, 13, 14, "tr", 12)(13, InventaireComponent_div_50_table_10_tr_13_Template, 3, 0, "tr", 13);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(12);
    i0.ɵɵproperty("ngForOf", ctx_r0.historyModal.entries)("ngForTrackBy", ctx_r0.trackByHistory);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.historyModal.entries.length === 0);
} }
function InventaireComponent_div_50_Template(rf, ctx) { if (rf & 1) {
    const _r11 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 40)(1, "div", 41)(2, "div", 42)(3, "h2");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "button", 43);
    i0.ɵɵlistener("click", function InventaireComponent_div_50_Template_button_click_5_listener() { i0.ɵɵrestoreView(_r11); const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.closePriceHistory()); });
    i0.ɵɵtext(6, "Fermer");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(7, "div", 44);
    i0.ɵɵtemplate(8, InventaireComponent_div_50_div_8_Template, 2, 1, "div", 45)(9, InventaireComponent_div_50_div_9_Template, 2, 0, "div", 46)(10, InventaireComponent_div_50_table_10_Template, 14, 3, "table", 47);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate2(" Historique des prix - ", ctx_r0.historyModal.productLabel, " (", ctx_r0.historyModal.colorLabel, ") ");
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("ngIf", ctx_r0.historyModal.error);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.historyModal.loading);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", !ctx_r0.historyModal.loading);
} }
export class InventaireComponent {
    constructor(store, http, cdr, auth) {
        this.store = store;
        this.http = http;
        this.cdr = cdr;
        this.auth = auth;
        this.destroy$ = new Subject();
        this.catalogueSubject = new BehaviorSubject({});
        this.allColors = ['blanc', 'gris', 'noir'];
        this.allRows = [];
        this.searchControl = new FormControl('', { nonNullable: true });
        this.priceControl = new FormControl('', { nonNullable: true });
        this.rows = [];
        this.totalStockValue = 0;
        this.totalProducts = 0;
        this.editingProductId = null;
        this.editingColor = null;
        this.savingEditorKey = null;
        this.priceEditError = '';
        this.priceInteractionMessage = '';
        this.historyModal = {
            open: false,
            productId: null,
            productLabel: '',
            color: null,
            colorLabel: '',
            entries: [],
            loading: false,
            restoringId: null,
            error: ''
        };
        this.trackByRow = (_, row) => row.item.id;
        this.trackByColor = (_, color) => color;
        this.trackByHistory = (_, entry) => entry.id;
    }
    get actor() {
        return this.auth.username() ?? 'erp-user';
    }
    get supportsPriceEditing() {
        return this.store.supportsInventory;
    }
    get colorOrder() {
        return this.allColors;
    }
    ngOnInit() {
        this.bindSearch();
        void this.initializeDataSources();
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    colorLabel(color) {
        if (color === 'blanc')
            return 'Blanc';
        if (color === 'gris')
            return 'Gris';
        return 'Noir';
    }
    getColorPrice(row, color) {
        return Number(row.prices[color] ?? 0) || 0;
    }
    getColorValue(row, color) {
        return Number(row.valuesByColor[color] ?? 0) || 0;
    }
    isColorEditing(row, color) {
        return this.editingProductId === row.item.id && this.editingColor === color;
    }
    isSavingColor(row, color) {
        return this.savingEditorKey === this.editorKey(row.item.id, color);
    }
    showAddPrice(row, color) {
        return !this.isColorEditing(row, color) && this.getColorPrice(row, color) <= 0;
    }
    startAddPrice(row, color) {
        this.startPriceEdit(row, color, true);
    }
    startPriceEdit(row, color, fromAdd = false) {
        if (!this.supportsPriceEditing) {
            this.priceInteractionMessage = 'Edition des prix indisponible hors mode Electron/SQLite.';
            this.cdr.markForCheck();
            return;
        }
        if (this.savingEditorKey)
            return;
        this.editingProductId = row.item.id;
        this.editingColor = color;
        this.priceEditError = '';
        this.priceInteractionMessage = '';
        const current = this.getColorPrice(row, color);
        this.priceControl.setValue(fromAdd || current <= 0 ? '' : this.formatPriceInput(current));
        this.cdr.markForCheck();
    }
    onPriceInputKeydown(event, row, color) {
        if (event.key === 'Enter') {
            event.preventDefault();
            void this.commitPriceEdit(row, color);
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.cancelPriceEdit();
        }
    }
    onPriceInputBlur(row, color) {
        void this.commitPriceEdit(row, color);
    }
    cancelPriceEdit() {
        this.editingProductId = null;
        this.editingColor = null;
        this.priceEditError = '';
        this.savingEditorKey = null;
        this.cdr.markForCheck();
    }
    async openPriceHistory(row, color) {
        if (!this.supportsPriceEditing)
            return;
        this.historyModal = {
            open: true,
            productId: row.item.id,
            productLabel: row.item.label,
            color,
            colorLabel: this.colorLabel(color),
            entries: [],
            loading: true,
            restoringId: null,
            error: ''
        };
        this.cdr.markForCheck();
        await this.loadHistoryEntries(row.item.id, color);
    }
    closePriceHistory() {
        this.historyModal = {
            open: false,
            productId: null,
            productLabel: '',
            color: null,
            colorLabel: '',
            entries: [],
            loading: false,
            restoringId: null,
            error: ''
        };
        this.cdr.markForCheck();
    }
    async restoreHistoryPrice(entry) {
        const productId = this.historyModal.productId;
        const color = this.historyModal.color;
        if (!productId || !color || this.historyModal.restoringId)
            return;
        if (!Number.isFinite(entry.oldPrice) || entry.oldPrice < 0) {
            this.historyModal = { ...this.historyModal, error: 'Prix a restaurer invalide.' };
            this.cdr.markForCheck();
            return;
        }
        this.historyModal = { ...this.historyModal, restoringId: entry.id, error: '' };
        this.cdr.markForCheck();
        try {
            const restored = await this.store.restoreProductPrice(productId, color, entry.oldPrice, `${this.actor}:restore`);
            if (!restored) {
                this.historyModal = { ...this.historyModal, restoringId: null, error: 'Restauration impossible.' };
                this.cdr.markForCheck();
                return;
            }
            this.patchRowPrice(productId, color, entry.oldPrice);
            await this.loadHistoryEntries(productId, color);
        }
        finally {
            this.historyModal = { ...this.historyModal, restoringId: null };
            this.cdr.markForCheck();
        }
    }
    async initializeDataSources() {
        await this.store.load();
        if (this.store.supportsInventory) {
            this.store.items$
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => {
                void this.refreshFromIpc();
            });
            await this.refreshFromIpc();
            return;
        }
        this.loadCatalogue();
        combineLatest([this.store.items$, this.catalogueSubject])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([items, catalogue]) => {
            const fallbackRows = this.buildRows(items, catalogue);
            this.setRows(fallbackRows, fallbackRows.reduce((sum, row) => sum + row.totalValue, 0));
        });
    }
    bindSearch() {
        this.searchControl.valueChanges
            .pipe(startWith(this.searchControl.getRawValue()), debounceTime(120), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((search) => {
            this.applyFilter(search);
            this.cdr.markForCheck();
        });
    }
    loadCatalogue() {
        this.http.get('assets/catalogue_prix_norm.json').subscribe({
            next: (data) => {
                this.catalogueSubject.next(data?.items ?? {});
            },
            error: () => {
                console.warn('[inventaire] Catalogue prix introuvable ou invalide.');
                this.catalogueSubject.next({});
            }
        });
    }
    async refreshFromIpc() {
        const response = await this.store.getInventory();
        if (!response) {
            this.setRows([], 0);
            return;
        }
        const inventoryRows = this.mapInventoryResponse(response);
        const total = response.totalValue ?? inventoryRows.reduce((sum, row) => sum + row.totalValue, 0);
        this.setRows(inventoryRows, total);
    }
    async commitPriceEdit(row, color) {
        if (!this.isColorEditing(row, color))
            return;
        const key = this.editorKey(row.item.id, color);
        if (this.savingEditorKey === key)
            return;
        const nextPrice = this.validatePriceInput(this.priceControl.value);
        if (nextPrice === null) {
            this.cdr.markForCheck();
            return;
        }
        const previousPrice = this.getColorPrice(row, color);
        if (Math.abs(previousPrice - nextPrice) < 0.000001) {
            this.cancelPriceEdit();
            return;
        }
        this.savingEditorKey = key;
        this.priceEditError = '';
        this.cdr.markForCheck();
        try {
            const saved = await this.store.updatePrice(row.item.id, color, nextPrice, this.actor);
            if (!saved) {
                this.priceEditError = 'Enregistrement impossible.';
                this.cdr.markForCheck();
                return;
            }
            this.patchRowPrice(row.item.id, color, nextPrice);
            this.cancelPriceEdit();
            if (this.historyModal.open && this.historyModal.productId === row.item.id && this.historyModal.color === color) {
                await this.loadHistoryEntries(row.item.id, color);
            }
        }
        finally {
            this.savingEditorKey = null;
            this.cdr.markForCheck();
        }
    }
    patchRowPrice(productId, color, nextPrice) {
        let totalDiff = 0;
        this.allRows = this.allRows.map((row) => {
            if (row.item.id !== productId)
                return row;
            const qty = this.getQtyByColor(row, color);
            const oldTotalValue = row.totalValue;
            const nextPrices = { ...row.prices, [color]: nextPrice };
            const nextValues = { ...row.valuesByColor, [color]: qty * nextPrice };
            const nextTotalValue = this.allColors.reduce((sum, current) => sum + nextValues[current], 0);
            const nextUnitPrice = row.qtyTotal > 0 ? nextTotalValue / row.qtyTotal : Math.max(...this.allColors.map((c) => nextPrices[c]));
            totalDiff += nextTotalValue - oldTotalValue;
            return {
                ...row,
                prices: nextPrices,
                valuesByColor: nextValues,
                unitPrice: nextUnitPrice,
                totalValue: nextTotalValue,
                priceStatus: this.computePriceStatus(nextPrices)
            };
        });
        this.totalStockValue += totalDiff;
        this.applyFilter(this.searchControl.getRawValue());
    }
    async loadHistoryEntries(productId, color) {
        this.historyModal = { ...this.historyModal, loading: true, error: '' };
        this.cdr.markForCheck();
        const entries = await this.store.getProductPriceHistory(productId, color);
        this.historyModal = {
            ...this.historyModal,
            entries,
            loading: false,
            error: entries.length ? '' : this.historyModal.error
        };
        this.cdr.markForCheck();
    }
    validatePriceInput(rawValue) {
        const normalized = this.normalizeNumericInput(rawValue);
        if (!normalized) {
            this.priceEditError = 'Prix obligatoire.';
            return null;
        }
        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) {
            this.priceEditError = 'Prix invalide.';
            return null;
        }
        if (parsed <= 0) {
            this.priceEditError = 'Le prix doit etre superieur a 0.';
            return null;
        }
        this.priceEditError = '';
        return parsed;
    }
    normalizeNumericInput(value) {
        return value.trim().replace(',', '.').replace(/\s+/g, '');
    }
    formatPriceInput(value) {
        const fixed = (Number(value) || 0).toFixed(2);
        return fixed.replace(/\.00$/, '');
    }
    applyFilter(searchRaw) {
        const needle = searchRaw.trim().toLowerCase();
        const filtered = needle
            ? this.allRows.filter((row) => row.item.label.toLowerCase().includes(needle))
            : this.allRows;
        this.rows = [...filtered].sort((a, b) => b.totalValue - a.totalValue);
    }
    setRows(rows, totalValue) {
        this.allRows = rows;
        this.totalProducts = rows.length;
        this.totalStockValue = totalValue;
        this.applyFilter(this.searchControl.getRawValue());
        this.cdr.markForCheck();
    }
    mapInventoryResponse(response) {
        return response.items.map((entry) => {
            const prices = {
                blanc: Number(entry.priceByColor?.blanc ?? entry.unitPrice ?? 0) || 0,
                gris: Number(entry.priceByColor?.gris ?? entry.unitPrice ?? 0) || 0,
                noir: Number(entry.priceByColor?.noir ?? entry.unitPrice ?? 0) || 0
            };
            const valuesByColor = {
                blanc: Number(entry.valueByColor?.blanc ?? (entry.qtyBlanc * prices.blanc)) || 0,
                gris: Number(entry.valueByColor?.gris ?? (entry.qtyGris * prices.gris)) || 0,
                noir: Number(entry.valueByColor?.noir ?? (entry.qtyNoir * prices.noir)) || 0
            };
            return {
                item: {
                    id: entry.product.id,
                    reference: entry.product.reference,
                    label: entry.product.label,
                    category: entry.product.category,
                    serie: entry.product.serie,
                    unit: entry.product.unit,
                    imageUrl: entry.product.imageUrl ?? 'assets/placeholder.png',
                    quantities: {
                        blanc: entry.qtyBlanc,
                        gris: entry.qtyGris,
                        noir: entry.qtyNoir
                    },
                    lowStockThreshold: entry.product.lowStockThreshold ?? 0,
                    lastUpdated: entry.product.lastUpdated ?? new Date().toISOString()
                },
                qtyBlanc: entry.qtyBlanc,
                qtyGris: entry.qtyGris,
                qtyNoir: entry.qtyNoir,
                qtyTotal: entry.qtyTotal,
                unitPrice: Number(entry.unitPrice ?? 0) || 0,
                prices,
                valuesByColor,
                totalValue: Number(entry.totalValue ?? 0) || 0,
                priceStatus: this.computePriceStatus(prices)
            };
        });
    }
    buildRows(items, catalogue) {
        return items.map((item) => {
            const qtyBlanc = Number(item.quantities.blanc ?? 0) || 0;
            const qtyGris = Number(item.quantities.gris ?? 0) || 0;
            const qtyNoir = Number(item.quantities.noir ?? 0) || 0;
            const qtyTotal = qtyBlanc + qtyGris + qtyNoir;
            const lookupKey = this.normalizeName(item.label);
            const entry = catalogue[lookupKey];
            const unitPrice = Number(entry?.prix_ttc ?? 0) || 0;
            const prices = { blanc: unitPrice, gris: unitPrice, noir: unitPrice };
            const valuesByColor = {
                blanc: qtyBlanc * unitPrice,
                gris: qtyGris * unitPrice,
                noir: qtyNoir * unitPrice
            };
            const totalValue = valuesByColor.blanc + valuesByColor.gris + valuesByColor.noir;
            return {
                item,
                qtyBlanc,
                qtyGris,
                qtyNoir,
                qtyTotal,
                unitPrice,
                prices,
                valuesByColor,
                totalValue,
                priceStatus: this.computePriceStatus(prices)
            };
        });
    }
    computePriceStatus(prices) {
        return this.allColors.every((color) => prices[color] > 0) ? 'ok' : 'missing';
    }
    getQtyByColor(row, color) {
        if (color === 'blanc')
            return row.qtyBlanc;
        if (color === 'gris')
            return row.qtyGris;
        return row.qtyNoir;
    }
    editorKey(productId, color) {
        return `${productId}:${color}`;
    }
    normalizeName(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    static { this.ɵfac = function InventaireComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || InventaireComponent)(i0.ɵɵdirectiveInject(i1.StockStoreService), i0.ɵɵdirectiveInject(i2.HttpClient), i0.ɵɵdirectiveInject(i0.ChangeDetectorRef), i0.ɵɵdirectiveInject(i3.AuthService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: InventaireComponent, selectors: [["app-inventaire"]], decls: 51, vars: 11, consts: [["readonlyPrice", ""], ["existingPrice", ""], [1, "panel"], [1, "panel-header"], [1, "card", "inventory-summary"], [1, "summary-item"], [1, "field", "search-field"], ["type", "search", "placeholder", "Nom produit", 1, "input", 3, "formControl"], [1, "card", "inventory-table-card"], ["class", "price-interaction-notice", 4, "ngIf"], [1, "table-wrapper"], [1, "inventory-table"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [4, "ngIf"], ["class", "modal-backdrop", 4, "ngIf"], [1, "price-interaction-notice"], [1, "product-cell"], [1, "qty-total"], [1, "price-cell"], [1, "price-lines"], ["class", "price-line", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "value-cell"], [1, "price-status"], [1, "history-cell"], [1, "history-lines"], ["class", "btn ghost history-btn", "type", "button", 3, "disabled", "click", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "price-line"], [1, "color-tag"], [4, "ngIf", "ngIfElse"], [1, "price-editor"], ["type", "text", "autofocus", "", 1, "input", "price-input", 3, "keydown", "blur", "formControl"], [1, "currency"], [1, "editor-hint"], ["class", "price-error", 4, "ngIf"], [1, "price-error"], ["class", "add-price-btn", "type", "button", 3, "click", 4, "ngIf", "ngIfElse"], ["type", "button", 1, "add-price-btn", 3, "click"], [1, "editable-price", 3, "dblclick"], ["type", "button", 1, "btn", "ghost", "history-btn", 3, "click", "disabled"], ["colspan", "9", 1, "empty-state"], [1, "modal-backdrop"], ["role", "dialog", "aria-modal", "true", 1, "modal-card", "history-modal"], [1, "modal-header"], ["type", "button", 1, "btn", "ghost", 3, "click"], [1, "modal-body"], ["class", "history-error", 4, "ngIf"], ["class", "history-loading", 4, "ngIf"], ["class", "history-table", 4, "ngIf"], [1, "history-error"], [1, "history-loading"], [1, "history-table"], ["type", "button", 1, "btn", "outline", 3, "click", "disabled"], ["colspan", "4", 1, "empty-state"]], template: function InventaireComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 2)(1, "div", 3)(2, "div")(3, "h1");
            i0.ɵɵtext(4, "Inventaire");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "Vue temps reel de la valeur du stock et des prix TTC.");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(7, "section", 4)(8, "div", 5)(9, "span");
            i0.ɵɵtext(10, "Valeur totale du stock");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(11, "strong");
            i0.ɵɵtext(12);
            i0.ɵɵpipe(13, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(14, "div", 5)(15, "span");
            i0.ɵɵtext(16, "Nombre produits");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(17, "strong");
            i0.ɵɵtext(18);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(19, "label", 6)(20, "span");
            i0.ɵɵtext(21, "Recherche");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(22, "input", 7);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(23, "section", 8);
            i0.ɵɵtemplate(24, InventaireComponent_div_24_Template, 2, 1, "div", 9);
            i0.ɵɵelementStart(25, "div", 10)(26, "table", 11)(27, "thead")(28, "tr")(29, "th");
            i0.ɵɵtext(30, "Produit");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(31, "th");
            i0.ɵɵtext(32, "Blanc");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(33, "th");
            i0.ɵɵtext(34, "Gris");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(35, "th");
            i0.ɵɵtext(36, "Noir");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(37, "th");
            i0.ɵɵtext(38, "Qte totale");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(39, "th");
            i0.ɵɵtext(40, "Prix unitaire (DT)");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(41, "th");
            i0.ɵɵtext(42, "Valeur (DT)");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(43, "th");
            i0.ɵɵtext(44, "Statut prix");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(45, "th");
            i0.ɵɵtext(46, "Historique");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(47, "tbody");
            i0.ɵɵtemplate(48, InventaireComponent_tr_48_Template, 23, 16, "tr", 12)(49, InventaireComponent_tr_49_Template, 3, 0, "tr", 13);
            i0.ɵɵelementEnd()()()()();
            i0.ɵɵtemplate(50, InventaireComponent_div_50_Template, 11, 5, "div", 14);
        } if (rf & 2) {
            i0.ɵɵadvance(12);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(13, 8, ctx.totalStockValue, "1.2-2"), " DT");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate(ctx.totalProducts);
            i0.ɵɵadvance(4);
            i0.ɵɵproperty("formControl", ctx.searchControl);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.priceInteractionMessage);
            i0.ɵɵadvance(24);
            i0.ɵɵproperty("ngForOf", ctx.rows)("ngForTrackBy", ctx.trackByRow);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.rows.length === 0);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.historyModal.open);
        } }, dependencies: [CommonModule, i4.NgForOf, i4.NgIf, ReactiveFormsModule, i5.DefaultValueAccessor, i5.NgControlStatus, i5.FormControlDirective, i4.DecimalPipe, i4.DatePipe], styles: [".inventory-summary[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 16px;\n  align-items: end;\n}\n\n.summary-item[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 16px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n  min-width: 180px;\n}\n\n.search-field[_ngcontent-%COMP%] {\n  min-width: 240px;\n}\n\n.inventory-table-card[_ngcontent-%COMP%] {\n  padding: 0;\n}\n\n.price-interaction-notice[_ngcontent-%COMP%] {\n  margin: 14px 14px 0;\n  padding: 10px 12px;\n  border-radius: 10px;\n  border: 1px solid #facc15;\n  background: #fef9c3;\n  color: #854d0e;\n  font-size: 0.82rem;\n  font-weight: 600;\n}\n\n.table-wrapper[_ngcontent-%COMP%] {\n  width: 100%;\n  overflow: auto;\n}\n\n.inventory-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  min-width: 1120px;\n}\n\n.inventory-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.inventory-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 12px 14px;\n  text-align: left;\n  border-bottom: 1px solid var(--border);\n  font-size: 0.9rem;\n  vertical-align: top;\n}\n\n.inventory-table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f4f1ea;\n  font-weight: 700;\n  position: sticky;\n  top: 0;\n  z-index: 1;\n}\n\n.product-cell[_ngcontent-%COMP%] {\n  font-weight: 600;\n  max-width: 280px;\n}\n\n.qty-total[_ngcontent-%COMP%] {\n  font-weight: 700;\n}\n\n.price-cell[_ngcontent-%COMP%] {\n  min-width: 380px;\n}\n\n.price-lines[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 8px;\n}\n\n.price-line[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 56px 1fr;\n  align-items: center;\n  gap: 8px;\n}\n\n.color-tag[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 999px;\n  background: #f4f4f5;\n  color: #27272a;\n  font-size: 0.74rem;\n  font-weight: 700;\n  padding: 4px 8px;\n}\n\n.editable-price[_ngcontent-%COMP%] {\n  cursor: pointer;\n  display: inline-flex;\n  padding: 4px 6px;\n  border-radius: 8px;\n}\n\n.editable-price[_ngcontent-%COMP%]:hover {\n  background: #f3f4f6;\n}\n\n.editable-price.disabled[_ngcontent-%COMP%] {\n  cursor: default;\n}\n\n.price-editor[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: wrap;\n  padding: 4px 6px;\n  border: 1px solid #d6d3d1;\n  border-radius: 10px;\n  background: #fafaf9;\n}\n\n.price-input[_ngcontent-%COMP%] {\n  width: 88px;\n  min-height: auto;\n  padding: 6px 8px;\n  border-radius: 8px;\n}\n\n.currency[_ngcontent-%COMP%] {\n  color: var(--muted);\n  font-weight: 600;\n}\n\n.editor-hint[_ngcontent-%COMP%] {\n  margin-top: 2px;\n  color: #78716c;\n  font-size: 0.73rem;\n  font-weight: 500;\n}\n\n.add-price-btn[_ngcontent-%COMP%] {\n  appearance: none;\n  border: 0;\n  background: transparent;\n  color: #0f766e;\n  font-weight: 700;\n  font-size: 0.82rem;\n  padding: 4px 0;\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n.add-price-btn[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n\n.price-error[_ngcontent-%COMP%] {\n  grid-column: 2;\n  margin-top: 2px;\n  color: #b91c1c;\n  font-size: 0.78rem;\n  font-weight: 600;\n}\n\n.value-cell[_ngcontent-%COMP%] {\n  font-weight: 700;\n  color: #0f766e;\n}\n\n.price-status[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 4px 10px;\n  border-radius: 999px;\n  background: #dcfce7;\n  color: #166534;\n  font-weight: 700;\n  font-size: 0.75rem;\n}\n\n.price-status.missing[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #991b1b;\n}\n\n.history-cell[_ngcontent-%COMP%] {\n  min-width: 150px;\n}\n\n.history-lines[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 6px;\n}\n\n.history-btn[_ngcontent-%COMP%] {\n  justify-content: flex-start;\n  min-height: auto;\n  padding: 6px 10px;\n}\n\n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted);\n  padding: 20px;\n}\n\n.modal-backdrop[_ngcontent-%COMP%] {\n  position: fixed;\n  inset: 0;\n  background: rgba(15, 23, 42, 0.45);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 18px;\n  z-index: 1100;\n}\n\n.modal-card.history-modal[_ngcontent-%COMP%] {\n  width: min(900px, 100%);\n  max-height: 80vh;\n  overflow: auto;\n  border-radius: 14px;\n  background: #fff;\n  border: 1px solid var(--border);\n  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.2);\n}\n\n.modal-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 16px 18px;\n  border-bottom: 1px solid var(--border);\n}\n\n.modal-body[_ngcontent-%COMP%] {\n  padding: 14px 18px 18px;\n}\n\n.history-error[_ngcontent-%COMP%] {\n  margin-bottom: 10px;\n  color: #b91c1c;\n  font-weight: 700;\n}\n\n.history-loading[_ngcontent-%COMP%] {\n  color: var(--muted);\n  font-weight: 600;\n}\n\n.history-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n}\n\n.history-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.history-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 10px;\n  text-align: left;\n  border-bottom: 1px solid var(--border);\n}\n\n.history-table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f8f7f3;\n  font-weight: 700;\n}\n\n@media (max-width: 900px) {\n  .inventory-summary[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}"], changeDetection: 0 }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(InventaireComponent, [{
        type: Component,
        args: [{ selector: 'app-inventaire', standalone: true, imports: [CommonModule, ReactiveFormsModule], changeDetection: ChangeDetectionStrategy.OnPush, template: "<section class=\"panel\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Inventaire</h1>\n      <p>Vue temps reel de la valeur du stock et des prix TTC.</p>\n    </div>\n  </div>\n\n  <section class=\"card inventory-summary\">\n    <div class=\"summary-item\">\n      <span>Valeur totale du stock</span>\n      <strong>{{ totalStockValue | number:'1.2-2' }} DT</strong>\n    </div>\n    <div class=\"summary-item\">\n      <span>Nombre produits</span>\n      <strong>{{ totalProducts }}</strong>\n    </div>\n    <label class=\"field search-field\">\n      <span>Recherche</span>\n      <input class=\"input\" type=\"search\" [formControl]=\"searchControl\" placeholder=\"Nom produit\">\n    </label>\n  </section>\n\n  <section class=\"card inventory-table-card\">\n    <div class=\"price-interaction-notice\" *ngIf=\"priceInteractionMessage\">\n      {{ priceInteractionMessage }}\n    </div>\n\n    <div class=\"table-wrapper\">\n      <table class=\"inventory-table\">\n        <thead>\n          <tr>\n            <th>Produit</th>\n            <th>Blanc</th>\n            <th>Gris</th>\n            <th>Noir</th>\n            <th>Qte totale</th>\n            <th>Prix unitaire (DT)</th>\n            <th>Valeur (DT)</th>\n            <th>Statut prix</th>\n            <th>Historique</th>\n          </tr>\n        </thead>\n        <tbody>\n          <tr *ngFor=\"let row of rows; trackBy: trackByRow\">\n            <td class=\"product-cell\">{{ row.item.label }}</td>\n            <td>{{ row.qtyBlanc }}</td>\n            <td>{{ row.qtyGris }}</td>\n            <td>{{ row.qtyNoir }}</td>\n            <td class=\"qty-total\">{{ row.qtyTotal }}</td>\n\n            <td class=\"price-cell\">\n              <div class=\"price-lines\">\n                <div class=\"price-line\" *ngFor=\"let color of colorOrder; trackBy: trackByColor\">\n                  <span class=\"color-tag\">{{ colorLabel(color) }}</span>\n\n                  <ng-container *ngIf=\"isColorEditing(row, color); else readonlyPrice\">\n                    <div class=\"price-editor\">\n                      <input\n                        class=\"input price-input\"\n                        type=\"text\"\n                        [formControl]=\"priceControl\"\n                        (keydown)=\"onPriceInputKeydown($event, row, color)\"\n                        (blur)=\"onPriceInputBlur(row, color)\"\n                        autofocus\n                      >\n                      <span class=\"currency\">DT</span>\n                    </div>\n                    <div class=\"editor-hint\">Entrer enregistrer \u00B7 Echap annuler</div>\n                    <div class=\"price-error\" *ngIf=\"priceEditError\">{{ priceEditError }}</div>\n                  </ng-container>\n\n                  <ng-template #readonlyPrice>\n                    <button\n                      class=\"add-price-btn\"\n                      type=\"button\"\n                      *ngIf=\"showAddPrice(row, color); else existingPrice\"\n                      (click)=\"startAddPrice(row, color)\"\n                    >\n                      Ajouter prix\n                    </button>\n                    <ng-template #existingPrice>\n                      <span\n                        class=\"editable-price\"\n                        (dblclick)=\"startPriceEdit(row, color)\"\n                        [class.disabled]=\"!supportsPriceEditing\"\n                        [attr.title]=\"supportsPriceEditing ? 'Double clic pour modifier' : 'Edition indisponible dans ce mode'\"\n                      >\n                        {{ getColorPrice(row, color) | number:'1.2-2' }} DT\n                      </span>\n                    </ng-template>\n                  </ng-template>\n                </div>\n              </div>\n            </td>\n\n            <td class=\"value-cell\">{{ row.totalValue | number:'1.2-2' }}</td>\n            <td>\n              <span class=\"price-status\" [class.missing]=\"row.priceStatus === 'missing'\">\n                {{ row.priceStatus === 'missing' ? 'Manquant' : 'OK' }}\n              </span>\n            </td>\n            <td class=\"history-cell\">\n              <div class=\"history-lines\">\n                <button\n                  class=\"btn ghost history-btn\"\n                  type=\"button\"\n                  *ngFor=\"let color of colorOrder; trackBy: trackByColor\"\n                  (click)=\"openPriceHistory(row, color)\"\n                  [disabled]=\"!supportsPriceEditing\"\n                >\n                  &#128344; {{ colorLabel(color) }}\n                </button>\n              </div>\n            </td>\n          </tr>\n          <tr *ngIf=\"rows.length === 0\">\n            <td colspan=\"9\" class=\"empty-state\">Aucun produit correspondant.</td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </section>\n</section>\n\n<div class=\"modal-backdrop\" *ngIf=\"historyModal.open\">\n  <div class=\"modal-card history-modal\" role=\"dialog\" aria-modal=\"true\">\n    <div class=\"modal-header\">\n      <h2>\n        Historique des prix - {{ historyModal.productLabel }} ({{ historyModal.colorLabel }})\n      </h2>\n      <button class=\"btn ghost\" type=\"button\" (click)=\"closePriceHistory()\">Fermer</button>\n    </div>\n\n    <div class=\"modal-body\">\n      <div class=\"history-error\" *ngIf=\"historyModal.error\">{{ historyModal.error }}</div>\n      <div class=\"history-loading\" *ngIf=\"historyModal.loading\">Chargement...</div>\n\n      <table class=\"history-table\" *ngIf=\"!historyModal.loading\">\n        <thead>\n          <tr>\n            <th>Date</th>\n            <th>Ancien prix</th>\n            <th>Nouveau prix</th>\n            <th>Action</th>\n          </tr>\n        </thead>\n        <tbody>\n          <tr *ngFor=\"let entry of historyModal.entries; trackBy: trackByHistory\">\n            <td>{{ entry.changedAt | date:'dd/MM/yyyy HH:mm' }}</td>\n            <td>{{ entry.oldPrice | number:'1.2-2' }}</td>\n            <td>{{ entry.newPrice | number:'1.2-2' }}</td>\n            <td>\n              <button\n                class=\"btn outline\"\n                type=\"button\"\n                (click)=\"restoreHistoryPrice(entry)\"\n                [disabled]=\"historyModal.restoringId === entry.id\"\n              >\n                {{ historyModal.restoringId === entry.id ? 'Restauration...' : 'Restaurer' }}\n              </button>\n            </td>\n          </tr>\n          <tr *ngIf=\"historyModal.entries.length === 0\">\n            <td colspan=\"4\" class=\"empty-state\">Aucun historique pour ce produit/couleur.</td>\n          </tr>\n        </tbody>\n      </table>\n    </div>\n  </div>\n</div>\n", styles: [".inventory-summary {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 16px;\n  align-items: end;\n}\n\n.summary-item {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 16px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n  min-width: 180px;\n}\n\n.search-field {\n  min-width: 240px;\n}\n\n.inventory-table-card {\n  padding: 0;\n}\n\n.price-interaction-notice {\n  margin: 14px 14px 0;\n  padding: 10px 12px;\n  border-radius: 10px;\n  border: 1px solid #facc15;\n  background: #fef9c3;\n  color: #854d0e;\n  font-size: 0.82rem;\n  font-weight: 600;\n}\n\n.table-wrapper {\n  width: 100%;\n  overflow: auto;\n}\n\n.inventory-table {\n  width: 100%;\n  border-collapse: collapse;\n  min-width: 1120px;\n}\n\n.inventory-table th,\n.inventory-table td {\n  padding: 12px 14px;\n  text-align: left;\n  border-bottom: 1px solid var(--border);\n  font-size: 0.9rem;\n  vertical-align: top;\n}\n\n.inventory-table thead th {\n  background: #f4f1ea;\n  font-weight: 700;\n  position: sticky;\n  top: 0;\n  z-index: 1;\n}\n\n.product-cell {\n  font-weight: 600;\n  max-width: 280px;\n}\n\n.qty-total {\n  font-weight: 700;\n}\n\n.price-cell {\n  min-width: 380px;\n}\n\n.price-lines {\n  display: grid;\n  gap: 8px;\n}\n\n.price-line {\n  display: grid;\n  grid-template-columns: 56px 1fr;\n  align-items: center;\n  gap: 8px;\n}\n\n.color-tag {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 999px;\n  background: #f4f4f5;\n  color: #27272a;\n  font-size: 0.74rem;\n  font-weight: 700;\n  padding: 4px 8px;\n}\n\n.editable-price {\n  cursor: pointer;\n  display: inline-flex;\n  padding: 4px 6px;\n  border-radius: 8px;\n}\n\n.editable-price:hover {\n  background: #f3f4f6;\n}\n\n.editable-price.disabled {\n  cursor: default;\n}\n\n.price-editor {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  flex-wrap: wrap;\n  padding: 4px 6px;\n  border: 1px solid #d6d3d1;\n  border-radius: 10px;\n  background: #fafaf9;\n}\n\n.price-input {\n  width: 88px;\n  min-height: auto;\n  padding: 6px 8px;\n  border-radius: 8px;\n}\n\n.currency {\n  color: var(--muted);\n  font-weight: 600;\n}\n\n.editor-hint {\n  margin-top: 2px;\n  color: #78716c;\n  font-size: 0.73rem;\n  font-weight: 500;\n}\n\n.add-price-btn {\n  appearance: none;\n  border: 0;\n  background: transparent;\n  color: #0f766e;\n  font-weight: 700;\n  font-size: 0.82rem;\n  padding: 4px 0;\n  cursor: pointer;\n  white-space: nowrap;\n}\n\n.add-price-btn:hover {\n  text-decoration: underline;\n}\n\n.price-error {\n  grid-column: 2;\n  margin-top: 2px;\n  color: #b91c1c;\n  font-size: 0.78rem;\n  font-weight: 600;\n}\n\n.value-cell {\n  font-weight: 700;\n  color: #0f766e;\n}\n\n.price-status {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 4px 10px;\n  border-radius: 999px;\n  background: #dcfce7;\n  color: #166534;\n  font-weight: 700;\n  font-size: 0.75rem;\n}\n\n.price-status.missing {\n  background: #fee2e2;\n  color: #991b1b;\n}\n\n.history-cell {\n  min-width: 150px;\n}\n\n.history-lines {\n  display: grid;\n  gap: 6px;\n}\n\n.history-btn {\n  justify-content: flex-start;\n  min-height: auto;\n  padding: 6px 10px;\n}\n\n.empty-state {\n  text-align: center;\n  color: var(--muted);\n  padding: 20px;\n}\n\n.modal-backdrop {\n  position: fixed;\n  inset: 0;\n  background: rgba(15, 23, 42, 0.45);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 18px;\n  z-index: 1100;\n}\n\n.modal-card.history-modal {\n  width: min(900px, 100%);\n  max-height: 80vh;\n  overflow: auto;\n  border-radius: 14px;\n  background: #fff;\n  border: 1px solid var(--border);\n  box-shadow: 0 16px 42px rgba(15, 23, 42, 0.2);\n}\n\n.modal-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 16px 18px;\n  border-bottom: 1px solid var(--border);\n}\n\n.modal-body {\n  padding: 14px 18px 18px;\n}\n\n.history-error {\n  margin-bottom: 10px;\n  color: #b91c1c;\n  font-weight: 700;\n}\n\n.history-loading {\n  color: var(--muted);\n  font-weight: 600;\n}\n\n.history-table {\n  width: 100%;\n  border-collapse: collapse;\n}\n\n.history-table th,\n.history-table td {\n  padding: 10px;\n  text-align: left;\n  border-bottom: 1px solid var(--border);\n}\n\n.history-table thead th {\n  background: #f8f7f3;\n  font-weight: 700;\n}\n\n@media (max-width: 900px) {\n  .inventory-summary {\n    grid-template-columns: 1fr;\n  }\n}\n"] }]
    }], () => [{ type: i1.StockStoreService }, { type: i2.HttpClient }, { type: i0.ChangeDetectorRef }, { type: i3.AuthService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(InventaireComponent, { className: "InventaireComponent", filePath: "src/app/components/inventaire/inventaire.component.ts", lineNumber: 57 }); })();
