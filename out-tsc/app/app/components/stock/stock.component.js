import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import { STOCK_I18N } from './stock-i18n';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "../../services/stock-store.service";
import * as i3 from "../../services/auth.service";
import * as i4 from "@angular/common";
function StockComponent_button_8_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 29);
    i0.ɵɵlistener("click", function StockComponent_button_8_Template_button_click_0_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.openCreateProductModal()); });
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" + ", ctx_r1.t.nouveauProduit, " ");
} }
function StockComponent_div_68_article_9_div_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 50)(1, "span");
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.imageIndisponible);
} }
function StockComponent_div_68_article_9_span_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 51);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.t.rupture);
} }
function StockComponent_div_68_article_9_div_10_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 52);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const item_r4 = i0.ɵɵnextContext().$implicit;
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(item_r4.description);
} }
function StockComponent_div_68_article_9_div_12_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 53)(1, "span", 54);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "span", 55);
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "span", 56);
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const color_r5 = ctx.$implicit;
    const item_r4 = i0.ɵɵnextContext().$implicit;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵproperty("ngClass", ctx_r1.getColorStatus(item_r4, color_r5));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.getColorLabel(color_r5));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.getQuantity(item_r4, color_r5));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.getColorStatusLabel(item_r4, color_r5));
} }
function StockComponent_div_68_article_9_Template(rf, ctx) { if (rf & 1) {
    const _r3 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "article", 35)(1, "div", 36)(2, "img", 37);
    i0.ɵɵlistener("error", function StockComponent_div_68_article_9_Template_img_error_2_listener($event) { const item_r4 = i0.ɵɵrestoreView(_r3).$implicit; const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.onImageError($event, item_r4)); });
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(3, StockComponent_div_68_article_9_div_3_Template, 3, 1, "div", 38)(4, StockComponent_div_68_article_9_span_4_Template, 2, 1, "span", 39);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "div", 40)(6, "div", 41);
    i0.ɵɵtext(7);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "div", 42);
    i0.ɵɵtext(9);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(10, StockComponent_div_68_article_9_div_10_Template, 2, 1, "div", 43);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "div", 44);
    i0.ɵɵtemplate(12, StockComponent_div_68_article_9_div_12_Template, 7, 4, "div", 45);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(13, "div", 46)(14, "button", 47);
    i0.ɵɵlistener("click", function StockComponent_div_68_article_9_Template_button_click_14_listener() { const item_r4 = i0.ɵɵrestoreView(_r3).$implicit; const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.openMove(item_r4, "IN")); });
    i0.ɵɵtext(15);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(16, "button", 48);
    i0.ɵɵlistener("click", function StockComponent_div_68_article_9_Template_button_click_16_listener() { const item_r4 = i0.ɵɵrestoreView(_r3).$implicit; const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.openMove(item_r4, "OUT")); });
    i0.ɵɵtext(17);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(18, "button", 49);
    i0.ɵɵlistener("click", function StockComponent_div_68_article_9_Template_button_click_18_listener() { const item_r4 = i0.ɵɵrestoreView(_r3).$implicit; const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.openMove(item_r4, "ADJUST")); });
    i0.ɵɵtext(19);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const item_r4 = ctx.$implicit;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵclassProp("low-stock", ctx_r1.isItemFullyOut(item_r4));
    i0.ɵɵadvance();
    i0.ɵɵclassProp("is-missing", ctx_r1.isImageMissing(item_r4));
    i0.ɵɵadvance();
    i0.ɵɵproperty("src", ctx_r1.getImageSrc(item_r4), i0.ɵɵsanitizeUrl);
    i0.ɵɵattribute("alt", item_r4.label);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.isImageMissing(item_r4));
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.isItemFullyOut(item_r4));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(item_r4.reference);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(item_r4.label);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", item_r4.description);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngForOf", ctx_r1.getAvailableColors(item_r4));
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("disabled", !ctx_r1.canManageStock);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.t.ajouter);
    i0.ɵɵadvance();
    i0.ɵɵproperty("disabled", !ctx_r1.canManageStock);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.t.retirer);
    i0.ɵɵadvance();
    i0.ɵɵproperty("disabled", !ctx_r1.canManageStock);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.t.ajuster);
} }
function StockComponent_div_68_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 30)(1, "div", 31)(2, "h2");
    i0.ɵɵtext(3);
    i0.ɵɵpipe(4, "titlecase");
    i0.ɵɵpipe(5, "titlecase");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "span", 32);
    i0.ɵɵtext(7);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(8, "div", 33);
    i0.ɵɵtemplate(9, StockComponent_div_68_article_9_Template, 20, 18, "article", 34);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const group_r6 = ctx.$implicit;
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate3("", ctx_r1.t.serieLabel, " ", i0.ɵɵpipeBind1(4, 7, group_r6.serie), " - ", i0.ɵɵpipeBind1(5, 9, group_r6.category));
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate2("", group_r6.items.length, " ", ctx_r1.t.articles);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngForOf", group_r6.items)("ngForTrackBy", ctx_r1.trackById);
} }
function StockComponent_div_69_div_7_label_7_option_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "option", 70);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const color_r8 = ctx.$implicit;
    const ctx_r1 = i0.ɵɵnextContext(4);
    i0.ɵɵproperty("value", color_r8);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.getColorLabel(color_r8));
} }
function StockComponent_div_69_div_7_label_7_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 8)(1, "span");
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "select", 19);
    i0.ɵɵtemplate(4, StockComponent_div_69_div_7_label_7_option_4_Template, 2, 2, "option", 69);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.couleur);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngForOf", ctx_r1.modal.availableColors);
} }
function StockComponent_div_69_div_7_label_8_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 8)(1, "span");
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "div", 32);
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.couleur);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.getColorLabel(ctx_r1.modal.availableColors[0]));
} }
function StockComponent_div_69_div_7_div_13_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 8)(1, "span");
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "div", 71)(4, "label", 72);
    i0.ɵɵelement(5, "input", 73);
    i0.ɵɵelementStart(6, "span");
    i0.ɵɵtext(7, "+");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(8, "label", 72);
    i0.ɵɵelement(9, "input", 74);
    i0.ɵɵelementStart(10, "span");
    i0.ɵɵtext(11, "-");
    i0.ɵɵelementEnd()()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.signe);
} }
function StockComponent_div_69_div_7_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 63)(1, "div", 64)(2, "strong");
    i0.ɵɵtext(3);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "span");
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(6, "form", 65);
    i0.ɵɵtemplate(7, StockComponent_div_69_div_7_label_7_Template, 5, 2, "label", 66)(8, StockComponent_div_69_div_7_label_8_Template, 5, 2, "label", 66);
    i0.ɵɵelementStart(9, "label", 8)(10, "span");
    i0.ɵɵtext(11);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(12, "input", 67);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(13, StockComponent_div_69_div_7_div_13_Template, 12, 1, "div", 66);
    i0.ɵɵelementStart(14, "label", 8)(15, "span");
    i0.ɵɵtext(16);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(17, "input", 68);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const item_r9 = ctx.ngIf;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(item_r9.reference);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(item_r9.label);
    i0.ɵɵadvance();
    i0.ɵɵproperty("formGroup", ctx_r1.movementForm);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.modal.availableColors.length > 1);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.modal.availableColors.length === 1);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.quantite);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngIf", ctx_r1.modal.type === "ADJUST");
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.raison);
    i0.ɵɵadvance();
    i0.ɵɵproperty("placeholder", ctx_r1.t.raisonPlaceholder);
} }
function StockComponent_div_69_Template(rf, ctx) { if (rf & 1) {
    const _r7 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 57)(1, "div", 58)(2, "div", 59)(3, "h2");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "button", 60);
    i0.ɵɵlistener("click", function StockComponent_div_69_Template_button_click_5_listener() { i0.ɵɵrestoreView(_r7); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.closeModal()); });
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(7, StockComponent_div_69_div_7_Template, 18, 9, "div", 61);
    i0.ɵɵelementStart(8, "div", 62)(9, "button", 60);
    i0.ɵɵlistener("click", function StockComponent_div_69_Template_button_click_9_listener() { i0.ɵɵrestoreView(_r7); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.closeModal()); });
    i0.ɵɵtext(10);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "button", 29);
    i0.ɵɵlistener("click", function StockComponent_div_69_Template_button_click_11_listener() { i0.ɵɵrestoreView(_r7); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.submitMovement()); });
    i0.ɵɵtext(12);
    i0.ɵɵelementEnd()()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵproperty("dir", ctx_r1.isAr ? "rtl" : "ltr");
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.modal.type === "IN" ? ctx_r1.t.modalAjouter : ctx_r1.modal.type === "OUT" ? ctx_r1.t.modalRetirer : ctx_r1.t.modalAjuster);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.fermer);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.modal.item);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.annuler);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.valider);
} }
function StockComponent_div_70_small_71_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "small");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.selectedImageName);
} }
function StockComponent_div_70_Template(rf, ctx) { if (rf & 1) {
    const _r10 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 57)(1, "div", 75)(2, "div", 59)(3, "h2");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "button", 60);
    i0.ɵɵlistener("click", function StockComponent_div_70_Template_button_click_5_listener() { i0.ɵɵrestoreView(_r10); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.closeCreateProductModal()); });
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(7, "div", 76)(8, "form", 65)(9, "label", 8)(10, "span");
    i0.ɵɵtext(11);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(12, "input", 77);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(13, "label", 8)(14, "span");
    i0.ɵɵtext(15);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(16, "input", 78);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(17, "label", 8)(18, "span");
    i0.ɵɵtext(19);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(20, "input", 79);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(21, "div", 80)(22, "label", 8)(23, "span");
    i0.ɵɵtext(24);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(25, "select", 15)(26, "option", 16);
    i0.ɵɵtext(27);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(28, "option", 17);
    i0.ɵɵtext(29);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(30, "option", 18);
    i0.ɵɵtext(31);
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(32, "label", 8)(33, "span");
    i0.ɵɵtext(34);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(35, "select", 10)(36, "option", 12);
    i0.ɵɵtext(37, "40");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(38, "option", 13);
    i0.ɵɵtext(39, "67");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(40, "option", 14);
    i0.ɵɵtext(41);
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(42, "label", 8)(43, "span");
    i0.ɵɵtext(44);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(45, "input", 81);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(46, "label", 8)(47, "span");
    i0.ɵɵtext(48);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(49, "input", 82);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(50, "div", 8)(51, "span");
    i0.ɵɵtext(52);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(53, "div", 83)(54, "label", 84);
    i0.ɵɵelement(55, "input", 85);
    i0.ɵɵtext(56);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(57, "label", 84);
    i0.ɵɵelement(58, "input", 86);
    i0.ɵɵtext(59);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(60, "label", 84);
    i0.ɵɵelement(61, "input", 87);
    i0.ɵɵtext(62);
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(63, "div", 8)(64, "span");
    i0.ɵɵtext(65);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(66, "div", 88)(67, "img", 89);
    i0.ɵɵlistener("error", function StockComponent_div_70_Template_img_error_67_listener() { i0.ɵɵrestoreView(_r10); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.onProductPreviewError()); });
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(68, "div", 90)(69, "button", 91);
    i0.ɵɵlistener("click", function StockComponent_div_70_Template_button_click_69_listener() { i0.ɵɵrestoreView(_r10); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.pickProductImage()); });
    i0.ɵɵtext(70);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(71, StockComponent_div_70_small_71_Template, 2, 1, "small", 92);
    i0.ɵɵelementStart(72, "small");
    i0.ɵɵtext(73, "Formats: png, jpg, jpeg, webp");
    i0.ɵɵelementEnd()()()()()();
    i0.ɵɵelementStart(74, "div", 62)(75, "button", 60);
    i0.ɵɵlistener("click", function StockComponent_div_70_Template_button_click_75_listener() { i0.ɵɵrestoreView(_r10); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.closeCreateProductModal()); });
    i0.ɵɵtext(76);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(77, "button", 93);
    i0.ɵɵlistener("click", function StockComponent_div_70_Template_button_click_77_listener() { i0.ɵɵrestoreView(_r10); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.submitCreateProduct()); });
    i0.ɵɵtext(78);
    i0.ɵɵelementEnd()()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵproperty("dir", ctx_r1.isAr ? "rtl" : "ltr");
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.modalNouveauProduit);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.fermer);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("formGroup", ctx_r1.productForm);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.reference);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate(ctx_r1.t.nomProduit);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate(ctx_r1.t.description);
    i0.ɵɵadvance();
    i0.ɵɵproperty("placeholder", ctx_r1.t.descriptionPlaceholder);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate(ctx_r1.t.category);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.profils);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.accessoires);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.t.joints);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.serie);
    i0.ɵɵadvance(7);
    i0.ɵɵtextInterpolate(ctx_r1.t.porteSecurite);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.unite);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate(ctx_r1.t.seuilAlerte);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate(ctx_r1.t.couleursDisponibles);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.t.blanc);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.t.gris);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.t.noir);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.imageSelectionnee);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("src", ctx_r1.selectedImagePreview, i0.ɵɵsanitizeUrl);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.t.choisirImage);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.selectedImageName);
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate(ctx_r1.t.annuler);
    i0.ɵɵadvance();
    i0.ɵɵproperty("disabled", ctx_r1.creatingProduct);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r1.t.creerProduit, " ");
} }
function StockComponent_div_71_Template(rf, ctx) { if (rf & 1) {
    const _r11 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 94)(1, "div", 95)(2, "span", 96);
    i0.ɵɵtext(3);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(4, "div", 97)(5, "div", 98);
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "div", 99);
    i0.ɵɵtext(8);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(9, "button", 100);
    i0.ɵɵlistener("click", function StockComponent_div_71_Template_button_click_9_listener() { i0.ɵɵrestoreView(_r11); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.closeToast()); });
    i0.ɵɵtext(10, "x");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "div", 101);
    i0.ɵɵelement(12, "div", 102);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("ngClass", "toast-" + ctx_r1.toast.type);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.toast.icon);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.toast.title);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.toast.message);
    i0.ɵɵadvance(4);
    i0.ɵɵstyleProp("width", ctx_r1.toast.progress, "%");
} }
export class StockComponent {
    get t() {
        return STOCK_I18N[this.lang];
    }
    get isAr() {
        return this.lang === 'ar';
    }
    constructor(fb, store, auth) {
        this.fb = fb;
        this.store = store;
        this.auth = auth;
        this.destroy$ = new Subject();
        this.imageFallbackIndex = new Map();
        this.missingImages = new Set();
        this.imageExtensions = ['png', 'webp', 'jpg', 'jpeg'];
        this.placeholderImage = 'assets/placeholder.png';
        this.imageKeyOverrides = new Map([
            ['busette antivient', 'busette antivent'],
            ['busette anti-vent', 'busette antivent'],
            ['busette antivent', 'busette antivent'],
            ['joint de vitrage 3mm', 'Joint vitrage 3mm'],
            ['joint de bourrage 2mm', 'joint de bourrage 2mm'],
            ['joint brosse (fin seal) 6 mm', 'joint brosse(fin seal) 6 mm'],
            ['joint u de vitarge 6 mm', 'joint U de vitarge 6 mm']
        ]);
        this.lang = 'fr';
        this.filters = this.fb.group({
            search: [''],
            serie: ['all'],
            category: ['all'],
            color: ['all']
        });
        this.movementForm = this.fb.group({
            color: ['blanc'],
            delta: [1, [Validators.required, Validators.min(1)]],
            adjustSign: ['+'],
            reason: ['', Validators.required]
        });
        this.productForm = this.fb.group({
            reference: [''],
            label: ['', Validators.required],
            category: ['accessoire', Validators.required],
            serie: ['40', Validators.required],
            unit: ['piece', Validators.required],
            description: [''],
            lowStockThreshold: [0, [Validators.min(0)]],
            colorBlanc: [true],
            colorGris: [true],
            colorNoir: [true]
        });
        this.groupedItems = [];
        this.totalItems = 0;
        this.alertItems = 0;
        this.modal = {
            open: false,
            item: null,
            type: 'IN',
            availableColors: ['blanc', 'gris', 'noir']
        };
        this.productModalOpen = false;
        this.selectedImageRef = null;
        this.selectedImagePreview = this.placeholderImage;
        this.selectedImageName = '';
        this.creatingProduct = false;
        this.toast = {
            open: false,
            type: 'info',
            title: '',
            message: '',
            icon: '',
            progress: 100
        };
        this.TOAST_DURATION = 3500;
        this.TOAST_ICONS = {
            success: 'OK',
            error: 'ERR',
            info: 'INFO'
        };
    }
    get canManageStock() {
        return this.auth.hasPermission('manageStock');
    }
    get canCreateProduct() {
        const role = this.auth.role();
        return role === 'admin' || role === 'developer' || role === 'owner';
    }
    switchLang(lang) {
        this.lang = lang;
    }
    async ngOnInit() {
        combineLatest([
            this.store.items$,
            this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()))
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([items, filters]) => {
            const search = (filters.search ?? '').trim().toLowerCase();
            const serie = filters.serie ?? 'all';
            const category = filters.category ?? 'all';
            const color = filters.color ?? 'all';
            const filtered = items.filter((item) => {
                const matchesSearch = !search ||
                    item.reference.toLowerCase().includes(search) ||
                    item.label.toLowerCase().includes(search);
                const matchesSerie = serie === 'all' || item.serie === serie;
                const matchesCategory = category === 'all' || item.category === category;
                const matchesColor = color === 'all' || this.hasColor(item, color);
                return matchesSearch && matchesSerie && matchesCategory && matchesColor;
            });
            this.totalItems = filtered.length;
            this.alertItems = filtered.filter((item) => this.isLowStock(item)).length;
            this.groupedItems = this.groupByCategory(filtered);
        });
        await this.store.load();
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearToastTimers();
    }
    trackById(_, item) {
        return item.id;
    }
    openMove(item, type) {
        if (!this.canManageStock) {
            return;
        }
        const colors = this.getAvailableColors(item);
        this.modal = { open: true, item, type, availableColors: colors };
        this.movementForm.reset({
            color: colors[0] ?? 'noir',
            delta: 1,
            adjustSign: '+',
            reason: ''
        });
    }
    closeModal() {
        this.modal = { open: false, item: null, type: 'IN', availableColors: ['blanc', 'gris', 'noir'] };
    }
    async submitMovement() {
        if (!this.modal.item)
            return;
        if (this.movementForm.invalid) {
            this.movementForm.markAllAsTouched();
            return;
        }
        const raw = this.movementForm.getRawValue();
        const delta = Math.abs(Number(raw.delta) || 0);
        if (delta === 0)
            return;
        const signedDelta = this.modal.type === 'ADJUST'
            ? (raw.adjustSign === '-' ? -delta : delta)
            : delta;
        try {
            await this.store.moveStock({
                itemId: this.modal.item.id,
                color: raw.color,
                type: this.modal.type,
                delta: signedDelta,
                reason: raw.reason ?? ''
            });
        }
        catch (error) {
            this.showToast('error', this.resolveMovementError(error));
            return;
        }
        const toastType = this.modal.type === 'IN' ? 'success' : 'info';
        const toastMessage = this.modal.type === 'IN'
            ? this.t.produitAjoute
            : this.modal.type === 'OUT'
                ? this.t.produitRetire
                : this.t.stockAjuste;
        this.closeModal();
        this.showToast(toastType, toastMessage);
    }
    openCreateProductModal() {
        if (!this.canCreateProduct) {
            this.showToast('error', this.t.droitsCreationManquants);
            return;
        }
        this.productForm.reset({
            reference: '',
            label: '',
            category: 'accessoire',
            serie: '40',
            unit: 'piece',
            description: '',
            lowStockThreshold: 0,
            colorBlanc: true,
            colorGris: true,
            colorNoir: true
        });
        this.selectedImageRef = null;
        this.selectedImagePreview = this.placeholderImage;
        this.selectedImageName = '';
        this.productModalOpen = true;
    }
    closeCreateProductModal() {
        this.productModalOpen = false;
        this.creatingProduct = false;
    }
    async pickProductImage() {
        if (!this.canCreateProduct) {
            return;
        }
        const selection = await this.store.selectProductImage();
        if (selection?.error) {
            this.showToast('error', this.resolveImageSelectionError(selection.error, selection.message));
            return;
        }
        if (!selection || selection.canceled) {
            return;
        }
        this.selectedImageRef = selection.imageRef ?? null;
        this.selectedImagePreview = selection.imageUrl || this.placeholderImage;
        this.selectedImageName = selection.fileName ?? '';
    }
    onProductPreviewError() {
        this.selectedImagePreview = this.placeholderImage;
        if (this.selectedImageName) {
            this.showToast('error', "Impossible d'afficher l'image selectionnee.");
        }
    }
    async submitCreateProduct() {
        if (!this.canCreateProduct) {
            this.showToast('error', this.t.droitsCreationManquants);
            return;
        }
        if (this.productForm.invalid) {
            this.productForm.markAllAsTouched();
            return;
        }
        const form = this.productForm.getRawValue();
        const colors = [];
        if (form.colorBlanc)
            colors.push('blanc');
        if (form.colorGris)
            colors.push('gris');
        if (form.colorNoir)
            colors.push('noir');
        if (!colors.length) {
            this.showToast('error', this.t.couleurObligatoire);
            return;
        }
        const label = String(form.label ?? '').trim();
        if (!label) {
            this.productForm.controls.label.markAsTouched();
            return;
        }
        const reference = String(form.reference ?? '').trim() || label;
        this.creatingProduct = true;
        try {
            const created = await this.store.createProduct({
                reference,
                label,
                description: String(form.description ?? '').trim(),
                category: form.category,
                serie: form.serie,
                unit: String(form.unit ?? 'piece').trim() || 'piece',
                colors,
                imageRef: this.selectedImageRef,
                lowStockThreshold: Math.max(0, Number(form.lowStockThreshold ?? 0) || 0)
            });
            if (!created) {
                this.showToast('error', this.t.creationProduitKo);
                return;
            }
            this.closeCreateProductModal();
            this.showToast('success', this.t.creationProduitOk);
        }
        catch (error) {
            this.showToast('error', this.resolveProductCreateError(error));
        }
        finally {
            this.creatingProduct = false;
        }
    }
    showToast(type, message) {
        this.clearToastTimers();
        const title = type === 'success' ? this.t.succes : type === 'error' ? this.t.erreur : this.t.info;
        this.toast = {
            open: true,
            type,
            title,
            message,
            icon: this.TOAST_ICONS[type],
            progress: 100
        };
        const step = 100 / (this.TOAST_DURATION / 50);
        let progress = 100;
        this.toastProgressTimer = window.setInterval(() => {
            progress = Math.max(0, progress - step);
            this.toast = { ...this.toast, progress };
        }, 50);
        this.toastTimer = window.setTimeout(() => this.closeToast(), this.TOAST_DURATION);
    }
    closeToast() {
        this.toast = { ...this.toast, open: false };
        this.clearToastTimers();
    }
    clearToastTimers() {
        if (this.toastTimer) {
            window.clearTimeout(this.toastTimer);
            this.toastTimer = undefined;
        }
        if (this.toastProgressTimer) {
            window.clearInterval(this.toastProgressTimer);
            this.toastProgressTimer = undefined;
        }
    }
    getQuantity(item, color) {
        return Number(item.quantities[color] ?? 0) || 0;
    }
    getColorStatus(item, color) {
        const qty = this.getQuantity(item, color);
        if (qty <= 0)
            return 'is-zero';
        if (qty <= Math.max(1, item.lowStockThreshold || 1))
            return 'is-low';
        return 'is-ok';
    }
    getColorStatusLabel(item, color) {
        const status = this.getColorStatus(item, color);
        if (status === 'is-zero')
            return this.t.rupture;
        if (status === 'is-low')
            return this.t.stockFaible;
        return this.t.ok;
    }
    getColorLabel(color) {
        const map = {
            blanc: 'blanc',
            gris: 'gris',
            noir: 'noir'
        };
        return this.t[map[color]];
    }
    getAvailableColors(item) {
        const colors = Object.keys(item.quantities);
        const sorted = colors.sort((a, b) => ['blanc', 'gris', 'noir'].indexOf(a) - ['blanc', 'gris', 'noir'].indexOf(b));
        return sorted.length ? sorted : ['noir'];
    }
    isItemFullyOut(item) {
        return this.getAvailableColors(item).every((color) => this.getQuantity(item, color) <= 0);
    }
    isLowStock(item) {
        return this.getAvailableColors(item).some((color) => this.getQuantity(item, color) <= Math.max(1, item.lowStockThreshold || 1));
    }
    getImageSrc(item) {
        const key = item.id;
        const candidates = this.getImageCandidates(item);
        if (!candidates.length)
            return this.placeholderImage;
        const index = this.imageFallbackIndex.get(key) ?? 0;
        return candidates[Math.min(index, candidates.length - 1)];
    }
    onImageError(event, item) {
        const key = item.id;
        const candidates = this.getImageCandidates(item);
        const target = event.target;
        const nextIndex = (this.imageFallbackIndex.get(key) ?? 0) + 1;
        if (nextIndex < candidates.length) {
            this.imageFallbackIndex.set(key, nextIndex);
            if (target)
                target.src = candidates[nextIndex];
            return;
        }
        this.missingImages.add(key);
        this.imageFallbackIndex.set(key, candidates.length);
        if (target) {
            target.src = this.placeholderImage;
        }
    }
    isImageMissing(item) {
        return this.missingImages.has(item.id);
    }
    hasColor(item, color) {
        return Object.prototype.hasOwnProperty.call(item.quantities, color);
    }
    getImageCandidates(item) {
        const candidates = [];
        const direct = typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '';
        if (direct && direct !== this.placeholderImage) {
            candidates.push(direct);
        }
        const imageKey = this.getImageKey(item);
        if (imageKey) {
            const normalized = this.normalizeCode(imageKey);
            const slug = this.slugifyCode(imageKey);
            const rawName = encodeURIComponent(normalized);
            const slugName = encodeURIComponent(slug);
            this.imageExtensions.forEach((ext) => {
                if (slug)
                    candidates.push(`assets/${slugName}.${ext}`);
                candidates.push(`assets/${rawName}.${ext}`);
            });
        }
        candidates.push(this.placeholderImage);
        return Array.from(new Set(candidates));
    }
    getImageKey(item) {
        const reference = item.reference?.trim() ?? '';
        const label = item.label?.trim() ?? '';
        if (reference && this.isCodeLike(reference))
            return this.normalizeCode(reference);
        const override = this.imageKeyOverrides.get(label.toLowerCase());
        if (override)
            return override;
        if (label && this.isCodeLike(label))
            return this.normalizeCode(label);
        return label || reference;
    }
    normalizeCode(code) {
        return code.trim().replace(/\s+/g, ' ');
    }
    slugifyCode(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/(\d+)\s*mm\b/g, '$1mm')
            .replace(/['’]/g, '')
            .replace(/[^a-z0-9\s-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\s/g, '-')
            .replace(/-+/g, '-');
    }
    isCodeLike(value) {
        const normalized = value.trim();
        if (!normalized)
            return false;
        if (/^\d{2,3}\s*\d{2,3}$/.test(normalized))
            return true;
        if (/^[A-Z]{1,4}\d+\s*[A-Z]\d+$/i.test(normalized))
            return true;
        if (/^PS-ACC-\d{2}$/i.test(normalized))
            return true;
        return false;
    }
    resolveMovementError(error) {
        const message = error instanceof Error ? error.message : '';
        if (!message) {
            return this.t.erreur;
        }
        if (message.includes('FORBIDDEN')) {
            return 'Accès refusé: permission de modification du stock requise.';
        }
        if (message.includes('NOT_AUTHENTICATED')) {
            return 'Session invalide. Reconnectez-vous puis réessayez.';
        }
        if (message.includes('stock:applyMovement')) {
            return 'Service stock indisponible. Redémarrez l’application.';
        }
        return message;
    }
    resolveProductCreateError(error) {
        const message = error instanceof Error ? error.message : '';
        if (!message) {
            return this.t.creationProduitKo;
        }
        if (message.includes('FORBIDDEN')) {
            return this.t.droitsCreationManquants;
        }
        if (message.includes('PRODUCT_REFERENCE_ALREADY_EXISTS')) {
            return 'La référence existe déjà.';
        }
        if (message.includes('PRODUCT_LABEL_REQUIRED')) {
            return 'Le nom du produit est obligatoire.';
        }
        if (message.includes('PRODUCT_COLORS_REQUIRED')) {
            return this.t.couleurObligatoire;
        }
        if (message.includes('NOT_AUTHENTICATED')) {
            return 'Session invalide. Reconnectez-vous puis réessayez.';
        }
        return message;
    }
    resolveImageSelectionError(errorCode, fallbackMessage) {
        if (errorCode === 'INVALID_IMAGE_EXTENSION') {
            return 'Format non supporte. Utilisez png, jpg, jpeg ou webp.';
        }
        if (errorCode === 'IMAGE_NOT_FOUND') {
            return 'Le fichier selectionne est introuvable.';
        }
        if (fallbackMessage) {
            return fallbackMessage;
        }
        return "Impossible d'ouvrir le selecteur d'image.";
    }
    groupByCategory(items) {
        const map = new Map();
        items.forEach((item) => {
            const key = `${item.serie}|${item.category}`;
            const list = map.get(key) ?? [];
            list.push(item);
            map.set(key, list);
        });
        return Array.from(map.entries()).map(([key, grouped]) => {
            const [serie, category] = key.split('|');
            return { serie, category, items: grouped };
        });
    }
    static { this.ɵfac = function StockComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || StockComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i2.StockStoreService), i0.ɵɵdirectiveInject(i3.AuthService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: StockComponent, selectors: [["app-stock"]], decls: 72, vars: 32, consts: [[1, "panel", 3, "dir"], [1, "panel-header"], [1, "panel-actions"], ["class", "btn primary", "type", "button", 3, "click", 4, "ngIf"], [1, "lang-switch"], ["type", "button", 1, "lang-btn", 3, "click"], [1, "card"], [1, "filters", 3, "formGroup"], [1, "field"], ["type", "search", "formControlName", "search", 1, "input", 3, "placeholder"], ["formControlName", "serie", 1, "input"], ["value", "all"], ["value", "40"], ["value", "67"], ["value", "porte-securite"], ["formControlName", "category", 1, "input"], ["value", "profil"], ["value", "accessoire"], ["value", "joint"], ["formControlName", "color", 1, "input"], ["value", "blanc"], ["value", "gris"], ["value", "noir"], [1, "summary"], [1, "alert"], [1, "stock-groups"], ["class", "stock-group", 4, "ngFor", "ngForOf"], ["class", "modal-backdrop", 4, "ngIf"], ["class", "toast-wrapper", 3, "ngClass", 4, "ngIf"], ["type", "button", 1, "btn", "primary", 3, "click"], [1, "stock-group"], [1, "group-header"], [1, "tag"], [1, "stock-grid"], ["class", "stock-card", 3, "low-stock", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "stock-card"], [1, "stock-image"], ["loading", "lazy", "decoding", "async", 3, "error", "src"], ["class", "image-placeholder", 4, "ngIf"], ["class", "badge", 4, "ngIf"], [1, "stock-info"], [1, "stock-ref"], [1, "stock-label"], ["class", "stock-desc", 4, "ngIf"], [1, "stock-colors"], ["class", "color-row", 3, "ngClass", 4, "ngFor", "ngForOf"], [1, "stock-actions"], ["type", "button", 1, "btn", "outline", 3, "click", "disabled"], ["type", "button", 1, "btn", "ghost", 3, "click", "disabled"], ["type", "button", 1, "btn", "danger", 3, "click", "disabled"], [1, "image-placeholder"], [1, "badge"], [1, "stock-desc"], [1, "color-row", 3, "ngClass"], [1, "color-name"], [1, "color-qty"], [1, "color-alert"], [1, "modal-backdrop"], ["role", "dialog", "aria-modal", "true", 1, "modal-card", "modal-card--compact", 3, "dir"], [1, "modal-header"], ["type", "button", 1, "btn", "ghost", 3, "click"], ["class", "modal-content-scroll modal-body", 4, "ngIf"], [1, "modal-actions"], [1, "modal-content-scroll", "modal-body"], [1, "modal-item"], [1, "modal-form", 3, "formGroup"], ["class", "field", 4, "ngIf"], ["type", "number", "step", "1", "formControlName", "delta", 1, "input"], ["type", "text", "formControlName", "reason", 1, "input", 3, "placeholder"], [3, "value", 4, "ngFor", "ngForOf"], [3, "value"], [1, "radio-row"], [1, "radio"], ["type", "radio", "formControlName", "adjustSign", "value", "+"], ["type", "radio", "formControlName", "adjustSign", "value", "-"], ["role", "dialog", "aria-modal", "true", 1, "modal-card", "modal-card--product", 3, "dir"], [1, "modal-content-scroll"], ["type", "text", "formControlName", "reference", 1, "input"], ["type", "text", "formControlName", "label", 1, "input"], ["type", "text", "formControlName", "description", 1, "input", 3, "placeholder"], [1, "form-grid"], ["type", "text", "formControlName", "unit", 1, "input"], ["type", "number", "min", "0", "formControlName", "lowStockThreshold", 1, "input"], [1, "check-row"], [1, "check-item"], ["type", "checkbox", "formControlName", "colorBlanc"], ["type", "checkbox", "formControlName", "colorGris"], ["type", "checkbox", "formControlName", "colorNoir"], [1, "image-picker-row"], ["alt", "product-preview", 1, "image-preview", 3, "error", "src"], [1, "image-picker-actions"], ["type", "button", 1, "btn", "outline", 3, "click"], [4, "ngIf"], ["type", "button", 1, "btn", "primary", 3, "click", "disabled"], [1, "toast-wrapper", 3, "ngClass"], [1, "toast-icon-wrap"], [1, "toast-icon"], [1, "toast-body"], [1, "toast-title"], [1, "toast-message"], ["type", "button", 1, "toast-close", 3, "click"], [1, "toast-progress-bar"], [1, "toast-progress-fill"]], template: function StockComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(7, "div", 2);
            i0.ɵɵtemplate(8, StockComponent_button_8_Template, 2, 1, "button", 3);
            i0.ɵɵelementStart(9, "div", 4)(10, "button", 5);
            i0.ɵɵlistener("click", function StockComponent_Template_button_click_10_listener() { return ctx.switchLang("fr"); });
            i0.ɵɵtext(11, "FR");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(12, "button", 5);
            i0.ɵɵlistener("click", function StockComponent_Template_button_click_12_listener() { return ctx.switchLang("ar"); });
            i0.ɵɵtext(13, "AR");
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(14, "section", 6)(15, "div", 7)(16, "label", 8)(17, "span");
            i0.ɵɵtext(18);
            i0.ɵɵelementEnd();
            i0.ɵɵelement(19, "input", 9);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(20, "label", 8)(21, "span");
            i0.ɵɵtext(22);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(23, "select", 10)(24, "option", 11);
            i0.ɵɵtext(25);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(26, "option", 12);
            i0.ɵɵtext(27, "40");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(28, "option", 13);
            i0.ɵɵtext(29, "67");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(30, "option", 14);
            i0.ɵɵtext(31);
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(32, "label", 8)(33, "span");
            i0.ɵɵtext(34);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(35, "select", 15)(36, "option", 11);
            i0.ɵɵtext(37);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(38, "option", 16);
            i0.ɵɵtext(39);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(40, "option", 17);
            i0.ɵɵtext(41);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(42, "option", 18);
            i0.ɵɵtext(43);
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(44, "label", 8)(45, "span");
            i0.ɵɵtext(46);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(47, "select", 19)(48, "option", 11);
            i0.ɵɵtext(49);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(50, "option", 20);
            i0.ɵɵtext(51);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(52, "option", 21);
            i0.ɵɵtext(53);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(54, "option", 22);
            i0.ɵɵtext(55);
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(56, "div", 23)(57, "div")(58, "span");
            i0.ɵɵtext(59);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(60, "strong");
            i0.ɵɵtext(61);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(62, "div", 24)(63, "span");
            i0.ɵɵtext(64);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(65, "strong");
            i0.ɵɵtext(66);
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(67, "section", 25);
            i0.ɵɵtemplate(68, StockComponent_div_68_Template, 10, 11, "div", 26);
            i0.ɵɵelementEnd()();
            i0.ɵɵtemplate(69, StockComponent_div_69_Template, 13, 6, "div", 27)(70, StockComponent_div_70_Template, 79, 27, "div", 27)(71, StockComponent_div_71_Template, 13, 6, "div", 28);
        } if (rf & 2) {
            i0.ɵɵproperty("dir", ctx.isAr ? "rtl" : "ltr");
            i0.ɵɵadvance(4);
            i0.ɵɵtextInterpolate(ctx.t.title);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.t.subtitle);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.canCreateProduct);
            i0.ɵɵadvance(2);
            i0.ɵɵclassProp("active", ctx.lang === "fr");
            i0.ɵɵadvance(2);
            i0.ɵɵclassProp("active", ctx.lang === "ar");
            i0.ɵɵadvance(3);
            i0.ɵɵproperty("formGroup", ctx.filters);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.search);
            i0.ɵɵadvance();
            i0.ɵɵproperty("placeholder", ctx.t.searchPlaceholder);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.serie);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.allSeries);
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate(ctx.t.porteSecurite);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.category);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.allCategories);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.t.profils);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.t.accessoires);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.t.joints);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.color);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.allColors);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.t.blanc);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.t.gris);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.t.noir);
            i0.ɵɵadvance(4);
            i0.ɵɵtextInterpolate(ctx.t.totalArticles);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.totalItems);
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.t.articlesAlerte);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.alertItems);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngForOf", ctx.groupedItems);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.modal.open);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.productModalOpen);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.toast.open);
        } }, dependencies: [CommonModule, i4.NgClass, i4.NgForOf, i4.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.NgSelectOption, i1.ɵNgSelectMultipleOption, i1.DefaultValueAccessor, i1.NumberValueAccessor, i1.CheckboxControlValueAccessor, i1.SelectControlValueAccessor, i1.RadioControlValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.MinValidator, i1.FormGroupDirective, i1.FormControlName, i4.TitleCasePipe], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  gap: 16px;\n  align-items: flex-start;\n}\n\n.panel-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.lang-switch[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 4px;\n  background: #f1f5f9;\n  border: 1px solid #e2e8f0;\n  border-radius: 8px;\n  padding: 3px;\n}\n\n.lang-btn[_ngcontent-%COMP%] {\n  border: none;\n  background: transparent;\n  padding: 6px 12px;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 600;\n  color: #64748b;\n}\n\n.lang-btn.active[_ngcontent-%COMP%] {\n  background: #1d4ed8;\n  color: #fff;\n}\n\n.filters[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.summary[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 16px;\n  margin-top: 16px;\n}\n\n.summary[_ngcontent-%COMP%]   div[_ngcontent-%COMP%] {\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 12px 16px;\n  min-width: 160px;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.summary[_ngcontent-%COMP%]   .alert[_ngcontent-%COMP%] {\n  background: #fff1f1;\n  border-color: rgba(180, 35, 24, 0.25);\n}\n\n.stock-groups[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 24px;\n}\n\n.group-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 12px;\n}\n\n.stock-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(220px, 1fr));\n  gap: 16px;\n}\n\n.stock-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 16px;\n  padding: 14px;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);\n}\n\n.stock-card.low-stock[_ngcontent-%COMP%] {\n  border-color: rgba(180, 35, 24, 0.4);\n  background: #fff5f5;\n}\n\n.stock-image[_ngcontent-%COMP%] {\n  border-radius: 12px;\n  overflow: hidden;\n  background: #fff;\n  height: 200px;\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.stock-image.is-missing[_ngcontent-%COMP%] {\n  border: 1px dashed #cbd5e1;\n}\n\n.stock-image[_ngcontent-%COMP%]   img[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n}\n\n.image-placeholder[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.85rem;\n  text-align: center;\n}\n\n.badge[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 10px;\n  right: 10px;\n  background: #b42318;\n  color: #fff;\n  border-radius: 999px;\n  padding: 4px 8px;\n  font-size: 0.7rem;\n  font-weight: 700;\n}\n\n.stock-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.stock-ref[_ngcontent-%COMP%] {\n  font-weight: 700;\n}\n\n.stock-label[_ngcontent-%COMP%] {\n  color: #334155;\n  font-weight: 600;\n}\n\n.stock-desc[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.85rem;\n}\n\n.stock-colors[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.color-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr auto 1fr;\n  gap: 8px;\n  align-items: center;\n  border: 1px solid var(--border);\n  border-radius: 10px;\n  padding: 6px 10px;\n}\n\n.color-row.is-zero[_ngcontent-%COMP%] {\n  background: #fff1f1;\n  border-color: rgba(180, 35, 24, 0.4);\n}\n\n.color-row.is-low[_ngcontent-%COMP%] {\n  background: #fff8e6;\n  border-color: rgba(180, 120, 24, 0.35);\n}\n\n.color-row.is-ok[_ngcontent-%COMP%] {\n  background: #f0fdf4;\n  border-color: rgba(22, 163, 74, 0.35);\n}\n\n.color-qty[_ngcontent-%COMP%] {\n  font-weight: 700;\n}\n\n.color-alert[_ngcontent-%COMP%] {\n  justify-self: end;\n  font-size: 0.78rem;\n  font-weight: 700;\n}\n\n.stock-actions[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n}\n\n.modal-backdrop[_ngcontent-%COMP%] {\n  position: fixed;\n  inset: 0;\n  background: rgba(2, 6, 23, 0.46);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 30;\n  padding: 12px;\n  overflow: hidden;\n}\n\n.modal-card[_ngcontent-%COMP%] {\n  width: min(760px, 100%);\n  max-height: calc(100vh - 24px);\n  background: #fff;\n  border-radius: 16px;\n  padding: 18px;\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.28);\n  overflow: hidden;\n}\n\n.modal-card--compact[_ngcontent-%COMP%] {\n  width: min(560px, 100%);\n}\n\n.modal-card--product[_ngcontent-%COMP%] {\n  width: min(820px, 100%);\n}\n\n.modal-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 10px;\n  flex: 0 0 auto;\n  padding-bottom: 2px;\n  border-bottom: 1px solid #e2e8f0;\n  background: #fff;\n}\n\n.modal-content-scroll[_ngcontent-%COMP%] {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  padding-right: 4px;\n}\n\n.modal-body[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.modal-item[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.modal-form[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 12px;\n}\n\n.form-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n}\n\n.radio-row[_ngcontent-%COMP%], \n.check-row[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  align-items: center;\n}\n\n.check-item[_ngcontent-%COMP%] {\n  display: inline-flex;\n  gap: 6px;\n  align-items: center;\n}\n\n.image-picker-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.image-preview[_ngcontent-%COMP%] {\n  width: 84px;\n  height: 84px;\n  border-radius: 10px;\n  object-fit: contain;\n  border: 1px solid var(--border);\n  background: #fff;\n}\n\n.image-picker-actions[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  word-break: break-word;\n}\n\n.modal-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 10px;\n  flex: 0 0 auto;\n  padding-top: 2px;\n  border-top: 1px solid #e2e8f0;\n  background: #fff;\n}\n\n.toast-wrapper[_ngcontent-%COMP%] {\n  position: fixed;\n  right: 24px;\n  bottom: 24px;\n  z-index: 99;\n  display: flex;\n  gap: 10px;\n  align-items: flex-start;\n  background: #fff;\n  border-radius: 12px;\n  border-left: 4px solid transparent;\n  box-shadow: 0 8px 30px rgba(2, 6, 23, 0.2);\n  min-width: 280px;\n  max-width: 420px;\n  padding: 14px 14px 18px;\n  overflow: hidden;\n}\n\n.toast-success[_ngcontent-%COMP%] {\n  border-left-color: #16a34a;\n}\n\n.toast-error[_ngcontent-%COMP%] {\n  border-left-color: #dc2626;\n}\n\n.toast-info[_ngcontent-%COMP%] {\n  border-left-color: #2563eb;\n}\n\n.toast-icon-wrap[_ngcontent-%COMP%] {\n  width: 32px;\n  height: 32px;\n  border-radius: 999px;\n  background: #eff6ff;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.toast-body[_ngcontent-%COMP%] {\n  flex: 1;\n}\n\n.toast-title[_ngcontent-%COMP%] {\n  font-weight: 700;\n}\n\n.toast-message[_ngcontent-%COMP%] {\n  color: #475569;\n  font-size: 0.85rem;\n}\n\n.toast-close[_ngcontent-%COMP%] {\n  border: none;\n  background: transparent;\n  color: #64748b;\n  cursor: pointer;\n}\n\n.toast-progress-bar[_ngcontent-%COMP%] {\n  position: absolute;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  height: 3px;\n  background: #e2e8f0;\n}\n\n.toast-progress-fill[_ngcontent-%COMP%] {\n  height: 100%;\n  transition: width 50ms linear;\n}\n\n.toast-success[_ngcontent-%COMP%]   .toast-progress-fill[_ngcontent-%COMP%] {\n  background: #16a34a;\n}\n\n.toast-error[_ngcontent-%COMP%]   .toast-progress-fill[_ngcontent-%COMP%] {\n  background: #dc2626;\n}\n\n.toast-info[_ngcontent-%COMP%]   .toast-progress-fill[_ngcontent-%COMP%] {\n  background: #2563eb;\n}\n\n@media (max-width: 1024px) {\n  .stock-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n\n  .filters[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n\n@media (max-width: 720px) {\n  .stock-grid[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .panel-header[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n\n  .panel-actions[_ngcontent-%COMP%] {\n    width: 100%;\n    justify-content: space-between;\n  }\n\n  .filters[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .summary[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n\n  .stock-actions[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .form-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .modal-card[_ngcontent-%COMP%] {\n    width: 100%;\n    max-height: 92vh;\n    border-radius: 14px;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(StockComponent, [{
        type: Component,
        args: [{ selector: 'app-stock', standalone: true, imports: [CommonModule, ReactiveFormsModule], template: "<section class=\"panel\" [dir]=\"isAr ? 'rtl' : 'ltr'\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>{{ t.title }}</h1>\n      <p>{{ t.subtitle }}</p>\n    </div>\n\n    <div class=\"panel-actions\">\n      <button\n        *ngIf=\"canCreateProduct\"\n        class=\"btn primary\"\n        type=\"button\"\n        (click)=\"openCreateProductModal()\"\n      >\n        + {{ t.nouveauProduit }}\n      </button>\n\n      <div class=\"lang-switch\">\n        <button class=\"lang-btn\" [class.active]=\"lang === 'fr'\" type=\"button\" (click)=\"switchLang('fr')\">FR</button>\n        <button class=\"lang-btn\" [class.active]=\"lang === 'ar'\" type=\"button\" (click)=\"switchLang('ar')\">AR</button>\n      </div>\n    </div>\n  </div>\n\n  <section class=\"card\">\n    <div class=\"filters\" [formGroup]=\"filters\">\n      <label class=\"field\">\n        <span>{{ t.search }}</span>\n        <input class=\"input\" type=\"search\" formControlName=\"search\" [placeholder]=\"t.searchPlaceholder\" />\n      </label>\n      <label class=\"field\">\n        <span>{{ t.serie }}</span>\n        <select class=\"input\" formControlName=\"serie\">\n          <option value=\"all\">{{ t.allSeries }}</option>\n          <option value=\"40\">40</option>\n          <option value=\"67\">67</option>\n          <option value=\"porte-securite\">{{ t.porteSecurite }}</option>\n        </select>\n      </label>\n      <label class=\"field\">\n        <span>{{ t.category }}</span>\n        <select class=\"input\" formControlName=\"category\">\n          <option value=\"all\">{{ t.allCategories }}</option>\n          <option value=\"profil\">{{ t.profils }}</option>\n          <option value=\"accessoire\">{{ t.accessoires }}</option>\n          <option value=\"joint\">{{ t.joints }}</option>\n        </select>\n      </label>\n      <label class=\"field\">\n        <span>{{ t.color }}</span>\n        <select class=\"input\" formControlName=\"color\">\n          <option value=\"all\">{{ t.allColors }}</option>\n          <option value=\"blanc\">{{ t.blanc }}</option>\n          <option value=\"gris\">{{ t.gris }}</option>\n          <option value=\"noir\">{{ t.noir }}</option>\n        </select>\n      </label>\n    </div>\n\n    <div class=\"summary\">\n      <div>\n        <span>{{ t.totalArticles }}</span>\n        <strong>{{ totalItems }}</strong>\n      </div>\n      <div class=\"alert\">\n        <span>{{ t.articlesAlerte }}</span>\n        <strong>{{ alertItems }}</strong>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"stock-groups\">\n    <div class=\"stock-group\" *ngFor=\"let group of groupedItems\">\n      <div class=\"group-header\">\n        <h2>{{ t.serieLabel }} {{ group.serie | titlecase }} - {{ group.category | titlecase }}</h2>\n        <span class=\"tag\">{{ group.items.length }} {{ t.articles }}</span>\n      </div>\n\n      <div class=\"stock-grid\">\n        <article class=\"stock-card\" *ngFor=\"let item of group.items; trackBy: trackById\" [class.low-stock]=\"isItemFullyOut(item)\">\n          <div class=\"stock-image\" [class.is-missing]=\"isImageMissing(item)\">\n            <img\n              [src]=\"getImageSrc(item)\"\n              [attr.alt]=\"item.label\"\n              loading=\"lazy\"\n              decoding=\"async\"\n              (error)=\"onImageError($event, item)\"\n            />\n            <div class=\"image-placeholder\" *ngIf=\"isImageMissing(item)\">\n              <span>{{ t.imageIndisponible }}</span>\n            </div>\n            <span class=\"badge\" *ngIf=\"isItemFullyOut(item)\">{{ t.rupture }}</span>\n          </div>\n\n          <div class=\"stock-info\">\n            <div class=\"stock-ref\">{{ item.reference }}</div>\n            <div class=\"stock-label\">{{ item.label }}</div>\n            <div class=\"stock-desc\" *ngIf=\"item.description\">{{ item.description }}</div>\n          </div>\n\n          <div class=\"stock-colors\">\n            <div class=\"color-row\" *ngFor=\"let color of getAvailableColors(item)\" [ngClass]=\"getColorStatus(item, color)\">\n              <span class=\"color-name\">{{ getColorLabel(color) }}</span>\n              <span class=\"color-qty\">{{ getQuantity(item, color) }}</span>\n              <span class=\"color-alert\">{{ getColorStatusLabel(item, color) }}</span>\n            </div>\n          </div>\n\n          <div class=\"stock-actions\">\n            <button class=\"btn outline\" type=\"button\" (click)=\"openMove(item, 'IN')\" [disabled]=\"!canManageStock\">{{ t.ajouter }}</button>\n            <button class=\"btn ghost\" type=\"button\" (click)=\"openMove(item, 'OUT')\" [disabled]=\"!canManageStock\">{{ t.retirer }}</button>\n            <button class=\"btn danger\" type=\"button\" (click)=\"openMove(item, 'ADJUST')\" [disabled]=\"!canManageStock\">{{ t.ajuster }}</button>\n          </div>\n        </article>\n      </div>\n    </div>\n  </section>\n</section>\n\n<div class=\"modal-backdrop\" *ngIf=\"modal.open\">\n  <div class=\"modal-card modal-card--compact\" role=\"dialog\" aria-modal=\"true\" [dir]=\"isAr ? 'rtl' : 'ltr'\">\n    <div class=\"modal-header\">\n      <h2>{{ modal.type === 'IN' ? t.modalAjouter : modal.type === 'OUT' ? t.modalRetirer : t.modalAjuster }}</h2>\n      <button class=\"btn ghost\" type=\"button\" (click)=\"closeModal()\">{{ t.fermer }}</button>\n    </div>\n\n    <div class=\"modal-content-scroll modal-body\" *ngIf=\"modal.item as item\">\n      <div class=\"modal-item\">\n        <strong>{{ item.reference }}</strong>\n        <span>{{ item.label }}</span>\n      </div>\n\n      <form class=\"modal-form\" [formGroup]=\"movementForm\">\n        <label class=\"field\" *ngIf=\"modal.availableColors.length > 1\">\n          <span>{{ t.couleur }}</span>\n          <select class=\"input\" formControlName=\"color\">\n            <option *ngFor=\"let color of modal.availableColors\" [value]=\"color\">{{ getColorLabel(color) }}</option>\n          </select>\n        </label>\n\n        <label class=\"field\" *ngIf=\"modal.availableColors.length === 1\">\n          <span>{{ t.couleur }}</span>\n          <div class=\"tag\">{{ getColorLabel(modal.availableColors[0]) }}</div>\n        </label>\n\n        <label class=\"field\">\n          <span>{{ t.quantite }}</span>\n          <input class=\"input\" type=\"number\" step=\"1\" formControlName=\"delta\" />\n        </label>\n\n        <div class=\"field\" *ngIf=\"modal.type === 'ADJUST'\">\n          <span>{{ t.signe }}</span>\n          <div class=\"radio-row\">\n            <label class=\"radio\"><input type=\"radio\" formControlName=\"adjustSign\" value=\"+\" /><span>+</span></label>\n            <label class=\"radio\"><input type=\"radio\" formControlName=\"adjustSign\" value=\"-\" /><span>-</span></label>\n          </div>\n        </div>\n\n        <label class=\"field\">\n          <span>{{ t.raison }}</span>\n          <input class=\"input\" type=\"text\" formControlName=\"reason\" [placeholder]=\"t.raisonPlaceholder\" />\n        </label>\n      </form>\n    </div>\n\n    <div class=\"modal-actions\">\n      <button class=\"btn ghost\" type=\"button\" (click)=\"closeModal()\">{{ t.annuler }}</button>\n      <button class=\"btn primary\" type=\"button\" (click)=\"submitMovement()\">{{ t.valider }}</button>\n    </div>\n  </div>\n</div>\n\n<div class=\"modal-backdrop\" *ngIf=\"productModalOpen\">\n  <div class=\"modal-card modal-card--product\" role=\"dialog\" aria-modal=\"true\" [dir]=\"isAr ? 'rtl' : 'ltr'\">\n    <div class=\"modal-header\">\n      <h2>{{ t.modalNouveauProduit }}</h2>\n      <button class=\"btn ghost\" type=\"button\" (click)=\"closeCreateProductModal()\">{{ t.fermer }}</button>\n    </div>\n\n    <div class=\"modal-content-scroll\">\n      <form class=\"modal-form\" [formGroup]=\"productForm\">\n        <label class=\"field\">\n          <span>{{ t.reference }}</span>\n          <input class=\"input\" type=\"text\" formControlName=\"reference\" />\n        </label>\n\n        <label class=\"field\">\n          <span>{{ t.nomProduit }}</span>\n          <input class=\"input\" type=\"text\" formControlName=\"label\" />\n        </label>\n\n        <label class=\"field\">\n          <span>{{ t.description }}</span>\n          <input class=\"input\" type=\"text\" formControlName=\"description\" [placeholder]=\"t.descriptionPlaceholder\" />\n        </label>\n\n        <div class=\"form-grid\">\n          <label class=\"field\">\n            <span>{{ t.category }}</span>\n            <select class=\"input\" formControlName=\"category\">\n              <option value=\"profil\">{{ t.profils }}</option>\n              <option value=\"accessoire\">{{ t.accessoires }}</option>\n              <option value=\"joint\">{{ t.joints }}</option>\n            </select>\n          </label>\n\n          <label class=\"field\">\n            <span>{{ t.serie }}</span>\n            <select class=\"input\" formControlName=\"serie\">\n              <option value=\"40\">40</option>\n              <option value=\"67\">67</option>\n              <option value=\"porte-securite\">{{ t.porteSecurite }}</option>\n            </select>\n          </label>\n\n          <label class=\"field\">\n            <span>{{ t.unite }}</span>\n            <input class=\"input\" type=\"text\" formControlName=\"unit\" />\n          </label>\n\n          <label class=\"field\">\n            <span>{{ t.seuilAlerte }}</span>\n            <input class=\"input\" type=\"number\" min=\"0\" formControlName=\"lowStockThreshold\" />\n          </label>\n        </div>\n\n        <div class=\"field\">\n          <span>{{ t.couleursDisponibles }}</span>\n          <div class=\"check-row\">\n            <label class=\"check-item\"><input type=\"checkbox\" formControlName=\"colorBlanc\" /> {{ t.blanc }}</label>\n            <label class=\"check-item\"><input type=\"checkbox\" formControlName=\"colorGris\" /> {{ t.gris }}</label>\n            <label class=\"check-item\"><input type=\"checkbox\" formControlName=\"colorNoir\" /> {{ t.noir }}</label>\n          </div>\n        </div>\n\n        <div class=\"field\">\n          <span>{{ t.imageSelectionnee }}</span>\n          <div class=\"image-picker-row\">\n            <img\n              [src]=\"selectedImagePreview\"\n              alt=\"product-preview\"\n              class=\"image-preview\"\n              (error)=\"onProductPreviewError()\"\n            />\n            <div class=\"image-picker-actions\">\n              <button class=\"btn outline\" type=\"button\" (click)=\"pickProductImage()\">{{ t.choisirImage }}</button>\n              <small *ngIf=\"selectedImageName\">{{ selectedImageName }}</small>\n              <small>Formats: png, jpg, jpeg, webp</small>\n            </div>\n          </div>\n        </div>\n      </form>\n    </div>\n\n    <div class=\"modal-actions\">\n      <button class=\"btn ghost\" type=\"button\" (click)=\"closeCreateProductModal()\">{{ t.annuler }}</button>\n      <button class=\"btn primary\" type=\"button\" [disabled]=\"creatingProduct\" (click)=\"submitCreateProduct()\">\n        {{ t.creerProduit }}\n      </button>\n    </div>\n  </div>\n</div>\n\n<div class=\"toast-wrapper\" *ngIf=\"toast.open\" [ngClass]=\"'toast-' + toast.type\">\n  <div class=\"toast-icon-wrap\">\n    <span class=\"toast-icon\">{{ toast.icon }}</span>\n  </div>\n  <div class=\"toast-body\">\n    <div class=\"toast-title\">{{ toast.title }}</div>\n    <div class=\"toast-message\">{{ toast.message }}</div>\n  </div>\n  <button class=\"toast-close\" type=\"button\" (click)=\"closeToast()\">x</button>\n  <div class=\"toast-progress-bar\">\n    <div class=\"toast-progress-fill\" [style.width.%]=\"toast.progress\"></div>\n  </div>\n</div>\n", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  justify-content: space-between;\n  gap: 16px;\n  align-items: flex-start;\n}\n\n.panel-actions {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.lang-switch {\n  display: flex;\n  gap: 4px;\n  background: #f1f5f9;\n  border: 1px solid #e2e8f0;\n  border-radius: 8px;\n  padding: 3px;\n}\n\n.lang-btn {\n  border: none;\n  background: transparent;\n  padding: 6px 12px;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 600;\n  color: #64748b;\n}\n\n.lang-btn.active {\n  background: #1d4ed8;\n  color: #fff;\n}\n\n.filters {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.summary {\n  display: flex;\n  gap: 16px;\n  margin-top: 16px;\n}\n\n.summary div {\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 12px 16px;\n  min-width: 160px;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.summary .alert {\n  background: #fff1f1;\n  border-color: rgba(180, 35, 24, 0.25);\n}\n\n.stock-groups {\n  display: flex;\n  flex-direction: column;\n  gap: 24px;\n}\n\n.group-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 12px;\n}\n\n.stock-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(220px, 1fr));\n  gap: 16px;\n}\n\n.stock-card {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 16px;\n  padding: 14px;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);\n}\n\n.stock-card.low-stock {\n  border-color: rgba(180, 35, 24, 0.4);\n  background: #fff5f5;\n}\n\n.stock-image {\n  border-radius: 12px;\n  overflow: hidden;\n  background: #fff;\n  height: 200px;\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.stock-image.is-missing {\n  border: 1px dashed #cbd5e1;\n}\n\n.stock-image img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n}\n\n.image-placeholder {\n  color: #64748b;\n  font-size: 0.85rem;\n  text-align: center;\n}\n\n.badge {\n  position: absolute;\n  top: 10px;\n  right: 10px;\n  background: #b42318;\n  color: #fff;\n  border-radius: 999px;\n  padding: 4px 8px;\n  font-size: 0.7rem;\n  font-weight: 700;\n}\n\n.stock-info {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.stock-ref {\n  font-weight: 700;\n}\n\n.stock-label {\n  color: #334155;\n  font-weight: 600;\n}\n\n.stock-desc {\n  color: #64748b;\n  font-size: 0.85rem;\n}\n\n.stock-colors {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.color-row {\n  display: grid;\n  grid-template-columns: 1fr auto 1fr;\n  gap: 8px;\n  align-items: center;\n  border: 1px solid var(--border);\n  border-radius: 10px;\n  padding: 6px 10px;\n}\n\n.color-row.is-zero {\n  background: #fff1f1;\n  border-color: rgba(180, 35, 24, 0.4);\n}\n\n.color-row.is-low {\n  background: #fff8e6;\n  border-color: rgba(180, 120, 24, 0.35);\n}\n\n.color-row.is-ok {\n  background: #f0fdf4;\n  border-color: rgba(22, 163, 74, 0.35);\n}\n\n.color-qty {\n  font-weight: 700;\n}\n\n.color-alert {\n  justify-self: end;\n  font-size: 0.78rem;\n  font-weight: 700;\n}\n\n.stock-actions {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n}\n\n.modal-backdrop {\n  position: fixed;\n  inset: 0;\n  background: rgba(2, 6, 23, 0.46);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 30;\n  padding: 12px;\n  overflow: hidden;\n}\n\n.modal-card {\n  width: min(760px, 100%);\n  max-height: calc(100vh - 24px);\n  background: #fff;\n  border-radius: 16px;\n  padding: 18px;\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.28);\n  overflow: hidden;\n}\n\n.modal-card--compact {\n  width: min(560px, 100%);\n}\n\n.modal-card--product {\n  width: min(820px, 100%);\n}\n\n.modal-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 10px;\n  flex: 0 0 auto;\n  padding-bottom: 2px;\n  border-bottom: 1px solid #e2e8f0;\n  background: #fff;\n}\n\n.modal-content-scroll {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-y: auto;\n  padding-right: 4px;\n}\n\n.modal-body {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.modal-item {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.modal-form {\n  display: grid;\n  gap: 12px;\n}\n\n.form-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n}\n\n.radio-row,\n.check-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  align-items: center;\n}\n\n.check-item {\n  display: inline-flex;\n  gap: 6px;\n  align-items: center;\n}\n\n.image-picker-row {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.image-preview {\n  width: 84px;\n  height: 84px;\n  border-radius: 10px;\n  object-fit: contain;\n  border: 1px solid var(--border);\n  background: #fff;\n}\n\n.image-picker-actions {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  word-break: break-word;\n}\n\n.modal-actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 10px;\n  flex: 0 0 auto;\n  padding-top: 2px;\n  border-top: 1px solid #e2e8f0;\n  background: #fff;\n}\n\n.toast-wrapper {\n  position: fixed;\n  right: 24px;\n  bottom: 24px;\n  z-index: 99;\n  display: flex;\n  gap: 10px;\n  align-items: flex-start;\n  background: #fff;\n  border-radius: 12px;\n  border-left: 4px solid transparent;\n  box-shadow: 0 8px 30px rgba(2, 6, 23, 0.2);\n  min-width: 280px;\n  max-width: 420px;\n  padding: 14px 14px 18px;\n  overflow: hidden;\n}\n\n.toast-success {\n  border-left-color: #16a34a;\n}\n\n.toast-error {\n  border-left-color: #dc2626;\n}\n\n.toast-info {\n  border-left-color: #2563eb;\n}\n\n.toast-icon-wrap {\n  width: 32px;\n  height: 32px;\n  border-radius: 999px;\n  background: #eff6ff;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.toast-body {\n  flex: 1;\n}\n\n.toast-title {\n  font-weight: 700;\n}\n\n.toast-message {\n  color: #475569;\n  font-size: 0.85rem;\n}\n\n.toast-close {\n  border: none;\n  background: transparent;\n  color: #64748b;\n  cursor: pointer;\n}\n\n.toast-progress-bar {\n  position: absolute;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  height: 3px;\n  background: #e2e8f0;\n}\n\n.toast-progress-fill {\n  height: 100%;\n  transition: width 50ms linear;\n}\n\n.toast-success .toast-progress-fill {\n  background: #16a34a;\n}\n\n.toast-error .toast-progress-fill {\n  background: #dc2626;\n}\n\n.toast-info .toast-progress-fill {\n  background: #2563eb;\n}\n\n@media (max-width: 1024px) {\n  .stock-grid {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n\n  .filters {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n}\n\n@media (max-width: 720px) {\n  .stock-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .panel-header {\n    flex-direction: column;\n  }\n\n  .panel-actions {\n    width: 100%;\n    justify-content: space-between;\n  }\n\n  .filters {\n    grid-template-columns: 1fr;\n  }\n\n  .summary {\n    flex-direction: column;\n  }\n\n  .stock-actions {\n    grid-template-columns: 1fr;\n  }\n\n  .form-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .modal-card {\n    width: 100%;\n    max-height: 92vh;\n    border-radius: 14px;\n  }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i2.StockStoreService }, { type: i3.AuthService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(StockComponent, { className: "StockComponent", filePath: "src/app/components/stock/stock.component.ts", lineNumber: 42 }); })();
