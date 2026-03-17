import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, startWith, takeUntil } from 'rxjs';
import { ClientAutocompleteComponent } from '../client-autocomplete/client-autocomplete.component';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "../../services/quote-store.service";
import * as i3 from "../../services/quote-calc.service";
import * as i4 from "@angular/router";
import * as i5 from "@angular/common";
function QuoteFormComponent_span_18_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 38);
    i0.ɵɵtext(1, "Ce numero existe deja.");
    i0.ɵɵelementEnd();
} }
function QuoteFormComponent_div_69_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 39);
    i0.ɵɵelement(1, "input", 40)(2, "input", 41)(3, "input", 42)(4, "input", 43);
    i0.ɵɵelementStart(5, "div", 44);
    i0.ɵɵtext(6);
    i0.ɵɵpipe(7, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "button", 45);
    i0.ɵɵlistener("click", function QuoteFormComponent_div_69_Template_button_click_8_listener() { const i_r2 = i0.ɵɵrestoreView(_r1).index; const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.removeLine(i_r2)); });
    i0.ɵɵtext(9, "Supprimer");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const i_r2 = ctx.index;
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵproperty("formGroupName", i_r2);
    i0.ɵɵadvance(6);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(7, 2, ctx_r2.lineHT(i_r2), "1.2-2"));
} }
function QuoteFormComponent_div_108_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div")(1, "span");
    i0.ɵɵtext(2, "Remise");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "strong");
    i0.ɵɵtext(4);
    i0.ɵɵpipe(5, "number");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1("- ", i0.ɵɵpipeBind2(5, 1, ctx_r2.totals.remise, "1.2-2"), " DT");
} }
const TVA_RATE = 19;
export class QuoteFormComponent {
    constructor(fb, store, calc, route, router) {
        this.fb = fb;
        this.store = store;
        this.calc = calc;
        this.route = route;
        this.router = router;
        this.destroy$ = new Subject();
        this.isApplyingClientSelection = false;
        this.selectedClient = null;
        this.currentId = null;
        this.form = this.fb.group({
            numero: ['', Validators.required],
            date: ['', Validators.required],
            clientId: [''],
            client: this.fb.group({
                nom: ['', Validators.required],
                adresse: ['', Validators.required],
                tel: [''],
                mf: [''],
                email: ['', Validators.email]
            }),
            lignes: this.fb.array([]),
            remiseType: ['montant'],
            remiseValue: [0],
            notes: [''],
            conditions: ['']
        });
        this.totals = {
            totalHT: 0,
            remise: 0,
            totalHTApresRemise: 0,
            fodec: 0,
            totalHorsTVA: 0,
            tva: 0,
            totalTTC: 0
        };
        this.isEdit = false;
        this.numeroConflict = false;
    }
    get lignes() {
        return this.form.get('lignes');
    }
    get clientFormGroup() {
        return this.form.get('client');
    }
    async ngOnInit() {
        await this.store.load();
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit = true;
            const quote = await this.store.getById(id);
            if (!quote) {
                this.router.navigate(['/quotes']);
                return;
            }
            this.currentId = quote.id;
            this.form.patchValue({
                numero: quote.numero,
                date: quote.date,
                clientId: quote.clientId ?? quote.client?.id ?? null,
                client: {
                    nom: quote.client?.nom ?? '',
                    adresse: quote.client?.adresse ?? '',
                    tel: quote.client?.tel || quote.client?.telephone || '',
                    mf: quote.client?.mf ?? '',
                    email: quote.client?.email ?? ''
                },
                remiseType: quote.remiseType ?? 'montant',
                remiseValue: quote.remiseValue ?? 0,
                notes: quote.notes ?? '',
                conditions: quote.conditions ?? ''
            });
            this.setLines(quote.lignes ?? []);
        }
        else {
            this.isEdit = false;
            this.currentId = this.ensureCurrentId();
            const numero = await this.store.getNextQuoteNumber();
            this.form.patchValue({
                numero,
                date: new Date().toISOString().slice(0, 10),
                clientId: null,
                remiseType: 'montant',
                remiseValue: 0
            });
            this.addLine();
        }
        this.initializeSelectedClientFromForm();
        this.form.get('client')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.syncClientLinkOnManualEdit());
        this.form.valueChanges
            .pipe(startWith(this.form.getRawValue()), takeUntil(this.destroy$))
            .subscribe(() => this.updateTotals());
        this.updateTotals();
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    onClientSelected(client) {
        this.isApplyingClientSelection = true;
        this.selectedClient = client;
        this.form.patchValue({ clientId: client?.id ?? null }, { emitEvent: false });
        this.isApplyingClientSelection = false;
    }
    addLine() {
        this.lignes.push(this.createLine());
    }
    removeLine(index) {
        if (this.lignes.length <= 1)
            return;
        this.lignes.removeAt(index);
    }
    lineHT(index) {
        const line = this.normalizeLine(this.lignes.at(index).value);
        return this.calc.lineHT(line);
    }
    async save(goToPreview) {
        this.numeroConflict = false;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const quote = this.buildQuote();
        const unique = await this.store.isNumeroUnique(quote.numero, quote.id);
        if (!unique) {
            this.numeroConflict = true;
            return;
        }
        await this.store.save(quote);
        if (goToPreview) {
            this.router.navigate(['/quotes', quote.id, 'preview']);
            return;
        }
        this.router.navigate(['/quotes']);
    }
    cancel() {
        this.router.navigate(['/quotes']);
    }
    updateTotals() {
        this.totals = this.calc.totals(this.buildQuote());
    }
    setLines(lines) {
        this.lignes.clear();
        lines.forEach((line) => this.lignes.push(this.createLine(line)));
        if (lines.length === 0)
            this.addLine();
    }
    createLine(line) {
        return this.fb.group({
            id: [line?.id ?? this.createId()],
            designation: [line?.designation ?? '', Validators.required],
            unite: [line?.unite ?? '', Validators.required],
            quantite: [line?.quantite ?? 0, [Validators.required, Validators.min(0)]],
            prixUnitaire: [line?.prixUnitaire ?? 0, [Validators.required, Validators.min(0)]],
            tvaRate: [TVA_RATE]
        });
    }
    buildQuote() {
        const raw = this.form.getRawValue();
        const clientId = this.normalizeText(raw.clientId) || null;
        return {
            id: this.ensureCurrentId(),
            numero: this.normalizeText(raw.numero),
            date: this.normalizeText(raw.date || new Date().toISOString().slice(0, 10)),
            clientId,
            client: {
                id: clientId,
                nom: this.normalizeText(raw.client?.nom),
                adresse: this.normalizeText(raw.client?.adresse),
                tel: this.normalizeText(raw.client?.tel),
                telephone: this.normalizeText(raw.client?.tel),
                mf: this.normalizeText(raw.client?.mf),
                email: this.normalizeText(raw.client?.email).toLowerCase()
            },
            lignes: (raw.lignes ?? []).map((line) => this.normalizeLine(line)),
            remiseType: raw.remiseType ?? 'montant',
            remiseValue: Number(raw.remiseValue) || 0,
            notes: raw.notes ?? '',
            conditions: raw.conditions ?? ''
        };
    }
    normalizeLine(line) {
        return {
            ...line,
            quantite: Number(line.quantite) || 0,
            prixUnitaire: Number(line.prixUnitaire) || 0,
            tvaRate: TVA_RATE
        };
    }
    ensureCurrentId() {
        if (!this.currentId) {
            this.currentId = this.createId();
        }
        return this.currentId;
    }
    initializeSelectedClientFromForm() {
        const raw = this.form.getRawValue();
        const currentId = this.normalizeText(raw.clientId) || null;
        if (!currentId && !this.normalizeText(raw.client?.nom)) {
            this.selectedClient = null;
            return;
        }
        this.selectedClient = {
            id: currentId,
            nom: this.normalizeText(raw.client?.nom),
            adresse: this.normalizeText(raw.client?.adresse),
            tel: this.normalizeText(raw.client?.tel),
            telephone: this.normalizeText(raw.client?.tel),
            mf: this.normalizeText(raw.client?.mf),
            email: this.normalizeText(raw.client?.email).toLowerCase()
        };
    }
    syncClientLinkOnManualEdit() {
        if (this.isApplyingClientSelection || !this.selectedClient)
            return;
        const rawClient = this.form.getRawValue().client;
        if (this.matchesSelectedClient(rawClient, this.selectedClient))
            return;
        this.selectedClient = null;
        this.form.patchValue({ clientId: null }, { emitEvent: false });
    }
    matchesSelectedClient(rawClient, selected) {
        return (this.toKey(rawClient?.nom) === this.toKey(selected.nom) &&
            this.toKey(rawClient?.adresse) === this.toKey(selected.adresse) &&
            this.toKey(rawClient?.tel) === this.toKey(selected.tel || selected.telephone) &&
            this.toKey(rawClient?.mf) === this.toKey(selected.mf) &&
            this.toKey(rawClient?.email) === this.toKey(selected.email));
    }
    normalizeText(value) {
        if (typeof value !== 'string')
            return '';
        return value.trim().replace(/\s+/g, ' ');
    }
    toKey(value) {
        return this.normalizeText(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }
    createId() {
        return globalThis.crypto?.randomUUID?.() ??
            `quote_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
    static { this.ɵfac = function QuoteFormComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || QuoteFormComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i2.QuoteStoreService), i0.ɵɵdirectiveInject(i3.QuoteCalcService), i0.ɵɵdirectiveInject(i4.ActivatedRoute), i0.ɵɵdirectiveInject(i4.Router)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: QuoteFormComponent, selectors: [["app-quote-form"]], decls: 122, vars: 15, consts: [[1, "form-header"], [1, "form-header-actions"], ["routerLink", "/quotes", 1, "btn", "ghost"], [1, "form-grid", 3, "ngSubmit", "formGroup"], [1, "card"], [1, "grid-3"], [1, "field"], ["formControlName", "numero", "type", "text", 1, "input"], ["class", "error", 4, "ngIf"], ["formControlName", "date", "type", "date", 1, "input"], [1, "tag"], ["formGroupName", "client", 1, "grid-2"], ["clientControlName", "nom", 3, "clientSelected", "formGroup"], ["formControlName", "tel", "type", "text", 1, "input"], ["formControlName", "adresse", "rows", "3", 1, "input"], [1, "stack"], ["formControlName", "mf", "type", "text", 1, "input"], ["formControlName", "email", "type", "email", 1, "input"], [1, "section-head"], ["type", "button", 1, "btn", "outline", 3, "click"], ["formArrayName", "lignes", 1, "lines"], [1, "line-row", "line-head"], ["class", "line-row", 3, "formGroupName", 4, "ngFor", "ngForOf"], ["formControlName", "remiseType", 1, "input"], ["value", "montant"], ["value", "pourcentage"], ["type", "number", "min", "0", "step", "0.01", "formControlName", "remiseValue", 1, "input"], [1, "grid-2"], ["formControlName", "notes", "rows", "4", 1, "input"], ["formControlName", "conditions", "rows", "4", 1, "input"], [1, "card", "totals"], [1, "totals-grid"], [4, "ngIf"], [1, "accent"], [1, "form-actions"], ["type", "button", 1, "btn", "ghost", 3, "click"], ["type", "submit", 1, "btn", "outline"], ["type", "button", 1, "btn", "primary", 3, "click"], [1, "error"], [1, "line-row", 3, "formGroupName"], ["formControlName", "designation", "placeholder", "Profile aluminium 6063", 1, "input"], ["formControlName", "unite", "placeholder", "m", 1, "input"], ["formControlName", "quantite", "type", "number", "min", "0", "step", "0.01", 1, "input"], ["formControlName", "prixUnitaire", "type", "number", "min", "0", "step", "0.01", 1, "input"], [1, "amount"], ["type", "button", 1, "btn", "danger", 3, "click"]], template: function QuoteFormComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div")(2, "h1");
            i0.ɵɵtext(3);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(4, "p");
            i0.ɵɵtext(5, "Les montants sont recalcules en temps reel.");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(6, "div", 1)(7, "a", 2);
            i0.ɵɵtext(8, "Retour liste");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(9, "form", 3);
            i0.ɵɵlistener("ngSubmit", function QuoteFormComponent_Template_form_ngSubmit_9_listener() { return ctx.save(false); });
            i0.ɵɵelementStart(10, "section", 4)(11, "h2");
            i0.ɵɵtext(12, "Informations devis");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(13, "div", 5)(14, "label", 6)(15, "span");
            i0.ɵɵtext(16, "Numero");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(17, "input", 7);
            i0.ɵɵtemplate(18, QuoteFormComponent_span_18_Template, 2, 0, "span", 8);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(19, "label", 6)(20, "span");
            i0.ɵɵtext(21, "Date");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(22, "input", 9);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(23, "div", 6)(24, "span");
            i0.ɵɵtext(25, "Statut");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(26, "div", 10);
            i0.ɵɵtext(27);
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(28, "section", 4)(29, "h2");
            i0.ɵɵtext(30, "Client");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(31, "div", 11)(32, "app-client-autocomplete", 12);
            i0.ɵɵlistener("clientSelected", function QuoteFormComponent_Template_app_client_autocomplete_clientSelected_32_listener($event) { return ctx.onClientSelected($event); });
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(33, "label", 6)(34, "span");
            i0.ɵɵtext(35, "Telephone");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(36, "input", 13);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(37, "label", 6)(38, "span");
            i0.ɵɵtext(39, "Adresse");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(40, "textarea", 14);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(41, "div", 15)(42, "label", 6)(43, "span");
            i0.ɵɵtext(44, "MF");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(45, "input", 16);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(46, "label", 6)(47, "span");
            i0.ɵɵtext(48, "Email");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(49, "input", 17);
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(50, "section", 4)(51, "div", 18)(52, "h2");
            i0.ɵɵtext(53, "Lignes produits");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(54, "button", 19);
            i0.ɵɵlistener("click", function QuoteFormComponent_Template_button_click_54_listener() { return ctx.addLine(); });
            i0.ɵɵtext(55, "Ajouter ligne");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(56, "div", 20)(57, "div", 21)(58, "div");
            i0.ɵɵtext(59, "Designation");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(60, "div");
            i0.ɵɵtext(61, "Unite");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(62, "div");
            i0.ɵɵtext(63, "Qte");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(64, "div");
            i0.ɵɵtext(65, "PU");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(66, "div");
            i0.ɵɵtext(67, "HT");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(68, "div");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(69, QuoteFormComponent_div_69_Template, 10, 5, "div", 22);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(70, "section", 4)(71, "h2");
            i0.ɵɵtext(72, "Remise");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(73, "div", 5)(74, "label", 6)(75, "span");
            i0.ɵɵtext(76, "Type");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(77, "select", 23)(78, "option", 24);
            i0.ɵɵtext(79, "Montant");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(80, "option", 25);
            i0.ɵɵtext(81, "Pourcentage");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(82, "label", 6)(83, "span");
            i0.ɵɵtext(84, "Valeur");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(85, "input", 26);
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(86, "section", 4)(87, "h2");
            i0.ɵɵtext(88, "Notes & Conditions");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(89, "div", 27)(90, "label", 6)(91, "span");
            i0.ɵɵtext(92, "Notes");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(93, "textarea", 28);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(94, "label", 6)(95, "span");
            i0.ɵɵtext(96, "Conditions");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(97, "textarea", 29);
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(98, "section", 30)(99, "h2");
            i0.ɵɵtext(100, "Totaux");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(101, "div", 31)(102, "div")(103, "span");
            i0.ɵɵtext(104, "Total Hors taxes");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(105, "strong");
            i0.ɵɵtext(106);
            i0.ɵɵpipe(107, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵtemplate(108, QuoteFormComponent_div_108_Template, 6, 4, "div", 32);
            i0.ɵɵelementStart(109, "div")(110, "span");
            i0.ɵɵtext(111, "Total Net HT");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(112, "strong", 33);
            i0.ɵɵtext(113);
            i0.ɵɵpipe(114, "number");
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(115, "div", 34)(116, "button", 35);
            i0.ɵɵlistener("click", function QuoteFormComponent_Template_button_click_116_listener() { return ctx.cancel(); });
            i0.ɵɵtext(117, "Annuler");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(118, "button", 36);
            i0.ɵɵtext(119, "Enregistrer");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(120, "button", 37);
            i0.ɵɵlistener("click", function QuoteFormComponent_Template_button_click_120_listener() { return ctx.save(true); });
            i0.ɵɵtext(121, "Enregistrer & Apercu");
            i0.ɵɵelementEnd()()();
        } if (rf & 2) {
            i0.ɵɵadvance(3);
            i0.ɵɵtextInterpolate(ctx.isEdit ? "Modifier le devis" : "Nouveau devis");
            i0.ɵɵadvance(6);
            i0.ɵɵproperty("formGroup", ctx.form);
            i0.ɵɵadvance(9);
            i0.ɵɵproperty("ngIf", ctx.numeroConflict);
            i0.ɵɵadvance(9);
            i0.ɵɵtextInterpolate(ctx.isEdit ? "Brouillon" : "Nouveau");
            i0.ɵɵadvance(5);
            i0.ɵɵproperty("formGroup", ctx.clientFormGroup);
            i0.ɵɵadvance(37);
            i0.ɵɵproperty("ngForOf", ctx.lignes.controls);
            i0.ɵɵadvance(37);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(107, 9, ctx.totals.totalHT, "1.2-2"), " DT");
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.totals.remise > 0);
            i0.ɵɵadvance(5);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(114, 12, ctx.totals.totalHTApresRemise, "1.2-2"), " DT");
        } }, dependencies: [CommonModule, i5.NgForOf, i5.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.NgSelectOption, i1.ɵNgSelectMultipleOption, i1.DefaultValueAccessor, i1.NumberValueAccessor, i1.SelectControlValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.MinValidator, i1.FormGroupDirective, i1.FormControlName, i1.FormGroupName, i1.FormArrayName, RouterModule, i4.RouterLink, ClientAutocompleteComponent, i5.DecimalPipe], styles: [".form-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n  margin-bottom: 20px;\n}\n\n.form-grid[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.section-head[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 12px;\n}\n\n.lines[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 10px;\n}\n\n.line-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 2.4fr 0.8fr 0.8fr 0.9fr 0.8fr 0.9fr 0.9fr;\n  gap: 10px;\n  align-items: center;\n}\n\n.line-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.7rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n}\n\n.stack[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\napp-client-autocomplete[_ngcontent-%COMP%] {\n  display: block;\n}\n\n.totals[_ngcontent-%COMP%] {\n  background: linear-gradient(135deg, #f7f6f2, #fff);\n}\n\n.totals-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.totals-grid[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 1.1rem;\n}\n\n.totals-grid[_ngcontent-%COMP%]   .accent[_ngcontent-%COMP%] {\n  color: var(--accent);\n}\n\n.form-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  justify-content: flex-end;\n}\n\n@media (max-width: 980px) {\n  .line-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .totals-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(QuoteFormComponent, [{
        type: Component,
        args: [{ selector: 'app-quote-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule, ClientAutocompleteComponent], template: "<section class=\"form-header\">\n  <div>\n    <h1>{{ isEdit ? 'Modifier le devis' : 'Nouveau devis' }}</h1>\n    <p>Les montants sont recalcules en temps reel.</p>\n  </div>\n  <div class=\"form-header-actions\">\n    <a class=\"btn ghost\" routerLink=\"/quotes\">Retour liste</a>\n  </div>\n</section>\n\n<form class=\"form-grid\" [formGroup]=\"form\" (ngSubmit)=\"save(false)\">\n  <section class=\"card\">\n    <h2>Informations devis</h2>\n    <div class=\"grid-3\">\n      <label class=\"field\">\n        <span>Numero</span>\n        <input class=\"input\" formControlName=\"numero\" type=\"text\">\n        <span class=\"error\" *ngIf=\"numeroConflict\">Ce numero existe deja.</span>\n      </label>\n\n      <label class=\"field\">\n        <span>Date</span>\n        <input class=\"input\" formControlName=\"date\" type=\"date\">\n      </label>\n\n      <div class=\"field\">\n        <span>Statut</span>\n        <div class=\"tag\">{{ isEdit ? 'Brouillon' : 'Nouveau' }}</div>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"card\">\n    <h2>Client</h2>\n    <div formGroupName=\"client\" class=\"grid-2\">\n      <app-client-autocomplete\n        [formGroup]=\"clientFormGroup\"\n        clientControlName=\"nom\"\n        (clientSelected)=\"onClientSelected($event)\"\n      ></app-client-autocomplete>\n\n      <label class=\"field\">\n        <span>Telephone</span>\n        <input class=\"input\" formControlName=\"tel\" type=\"text\">\n      </label>\n\n      <label class=\"field\">\n        <span>Adresse</span>\n        <textarea class=\"input\" formControlName=\"adresse\" rows=\"3\"></textarea>\n      </label>\n\n      <div class=\"stack\">\n        <label class=\"field\">\n          <span>MF</span>\n          <input class=\"input\" formControlName=\"mf\" type=\"text\">\n        </label>\n        <label class=\"field\">\n          <span>Email</span>\n          <input class=\"input\" formControlName=\"email\" type=\"email\">\n        </label>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"card\">\n    <div class=\"section-head\">\n      <h2>Lignes produits</h2>\n      <button type=\"button\" class=\"btn outline\" (click)=\"addLine()\">Ajouter ligne</button>\n    </div>\n\n    <div class=\"lines\" formArrayName=\"lignes\">\n      <div class=\"line-row line-head\">\n        <div>Designation</div>\n        <div>Unite</div>\n        <div>Qte</div>\n        <div>PU</div>\n        <div>HT</div>\n        <div></div>\n      </div>\n\n      <div class=\"line-row\" *ngFor=\"let line of lignes.controls; let i = index\" [formGroupName]=\"i\">\n        <input class=\"input\" formControlName=\"designation\" placeholder=\"Profile aluminium 6063\">\n        <input class=\"input\" formControlName=\"unite\" placeholder=\"m\">\n        <input class=\"input\" formControlName=\"quantite\" type=\"number\" min=\"0\" step=\"0.01\">\n        <input class=\"input\" formControlName=\"prixUnitaire\" type=\"number\" min=\"0\" step=\"0.01\">\n        <div class=\"amount\">{{ lineHT(i) | number:'1.2-2' }}</div>\n        <button type=\"button\" class=\"btn danger\" (click)=\"removeLine(i)\">Supprimer</button>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"card\">\n    <h2>Remise</h2>\n    <div class=\"grid-3\">\n      <label class=\"field\">\n        <span>Type</span>\n        <select class=\"input\" formControlName=\"remiseType\">\n          <option value=\"montant\">Montant</option>\n          <option value=\"pourcentage\">Pourcentage</option>\n        </select>\n      </label>\n\n      <label class=\"field\">\n        <span>Valeur</span>\n        <input class=\"input\" type=\"number\" min=\"0\" step=\"0.01\" formControlName=\"remiseValue\">\n      </label>\n    </div>\n  </section>\n\n  <section class=\"card\">\n    <h2>Notes & Conditions</h2>\n    <div class=\"grid-2\">\n      <label class=\"field\">\n        <span>Notes</span>\n        <textarea class=\"input\" formControlName=\"notes\" rows=\"4\"></textarea>\n      </label>\n      <label class=\"field\">\n        <span>Conditions</span>\n        <textarea class=\"input\" formControlName=\"conditions\" rows=\"4\"></textarea>\n      </label>\n    </div>\n  </section>\n\n  <section class=\"card totals\">\n    <h2>Totaux</h2>\n    <div class=\"totals-grid\">\n      <div>\n        <span>Total Hors taxes</span>\n        <strong>{{ totals.totalHT | number:'1.2-2' }} DT</strong>\n      </div>\n\n      <div *ngIf=\"totals.remise > 0\">\n        <span>Remise</span>\n        <strong>- {{ totals.remise | number:'1.2-2' }} DT</strong>\n      </div>\n\n      <div>\n        <span>Total Net HT</span>\n        <strong class=\"accent\">{{ totals.totalHTApresRemise | number:'1.2-2' }} DT</strong>\n      </div>\n    </div>\n  </section>\n\n  <div class=\"form-actions\">\n    <button class=\"btn ghost\" type=\"button\" (click)=\"cancel()\">Annuler</button>\n    <button class=\"btn outline\" type=\"submit\">Enregistrer</button>\n    <button class=\"btn primary\" type=\"button\" (click)=\"save(true)\">Enregistrer & Apercu</button>\n  </div>\n</form>\n", styles: [".form-header {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n  margin-bottom: 20px;\n}\n\n.form-grid {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.section-head {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 12px;\n}\n\n.lines {\n  display: grid;\n  gap: 10px;\n}\n\n.line-row {\n  display: grid;\n  grid-template-columns: 2.4fr 0.8fr 0.8fr 0.9fr 0.8fr 0.9fr 0.9fr;\n  gap: 10px;\n  align-items: center;\n}\n\n.line-head {\n  text-transform: uppercase;\n  font-size: 0.7rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n}\n\n.stack {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\napp-client-autocomplete {\n  display: block;\n}\n\n.totals {\n  background: linear-gradient(135deg, #f7f6f2, #fff);\n}\n\n.totals-grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.totals-grid strong {\n  display: block;\n  font-size: 1.1rem;\n}\n\n.totals-grid .accent {\n  color: var(--accent);\n}\n\n.form-actions {\n  display: flex;\n  gap: 12px;\n  justify-content: flex-end;\n}\n\n@media (max-width: 980px) {\n  .line-row {\n    grid-template-columns: 1fr;\n  }\n\n  .totals-grid {\n    grid-template-columns: 1fr;\n  }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i2.QuoteStoreService }, { type: i3.QuoteCalcService }, { type: i4.ActivatedRoute }, { type: i4.Router }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(QuoteFormComponent, { className: "QuoteFormComponent", filePath: "src/app/components/quote-form/quote-form.component.ts", lineNumber: 22 }); })();
