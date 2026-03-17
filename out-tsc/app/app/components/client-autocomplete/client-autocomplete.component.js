import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "../../services/client-store.service";
import * as i3 from "../../services/client-persistence.service";
import * as i4 from "@angular/common";
function ClientAutocompleteComponent_div_11_button_1_ng_container_5_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementContainerStart(0);
    i0.ɵɵtext(1);
    i0.ɵɵelementContainerEnd();
} if (rf & 2) {
    const client_r2 = i0.ɵɵnextContext().$implicit;
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" | ", client_r2.email);
} }
function ClientAutocompleteComponent_div_11_button_1_ng_container_6_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementContainerStart(0);
    i0.ɵɵtext(1);
    i0.ɵɵelementContainerEnd();
} if (rf & 2) {
    const client_r2 = i0.ɵɵnextContext().$implicit;
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" | MF ", client_r2.mf);
} }
function ClientAutocompleteComponent_div_11_button_1_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 12);
    i0.ɵɵlistener("mousedown", function ClientAutocompleteComponent_div_11_button_1_Template_button_mousedown_0_listener() { const client_r2 = i0.ɵɵrestoreView(_r1).$implicit; const ctx_r2 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r2.selectClient(client_r2)); });
    i0.ɵɵelementStart(1, "span", 13);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "span", 14);
    i0.ɵɵtext(4);
    i0.ɵɵtemplate(5, ClientAutocompleteComponent_div_11_button_1_ng_container_5_Template, 2, 1, "ng-container", 15)(6, ClientAutocompleteComponent_div_11_button_1_ng_container_6_Template, 2, 1, "ng-container", 15);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const client_r2 = ctx.$implicit;
    const i_r4 = ctx.index;
    const ctx_r2 = i0.ɵɵnextContext(2);
    i0.ɵɵclassProp("active", ctx_r2.isSuggestionActive(i_r4));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(client_r2.nom);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1(" ", client_r2.tel || client_r2.telephone || "-", " ");
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", client_r2.email);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", client_r2.mf);
} }
function ClientAutocompleteComponent_div_11_button_2_Template(rf, ctx) { if (rf & 1) {
    const _r5 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 16);
    i0.ɵɵlistener("mousedown", function ClientAutocompleteComponent_div_11_button_2_Template_button_mousedown_0_listener() { i0.ɵɵrestoreView(_r5); const ctx_r2 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r2.openCreateModalFromQuery()); });
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r2 = i0.ɵɵnextContext(2);
    i0.ɵɵclassProp("active", ctx_r2.isCreateOptionActive());
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" + Creer un nouveau client \"", ctx_r2.query, "\" ");
} }
function ClientAutocompleteComponent_div_11_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 9);
    i0.ɵɵtemplate(1, ClientAutocompleteComponent_div_11_button_1_Template, 7, 6, "button", 10)(2, ClientAutocompleteComponent_div_11_button_2_Template, 2, 3, "button", 11);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngForOf", ctx_r2.suggestions)("ngForTrackBy", ctx_r2.trackByClient);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r2.canCreateFromQuery);
} }
function ClientAutocompleteComponent_div_12_div_25_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 29);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r2 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r2.createError);
} }
function ClientAutocompleteComponent_div_12_Template(rf, ctx) { if (rf & 1) {
    const _r6 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 17);
    i0.ɵɵlistener("click", function ClientAutocompleteComponent_div_12_Template_div_click_0_listener() { i0.ɵɵrestoreView(_r6); const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.closeCreateModal()); });
    i0.ɵɵelementStart(1, "div", 18);
    i0.ɵɵlistener("click", function ClientAutocompleteComponent_div_12_Template_div_click_1_listener($event) { return $event.stopPropagation(); });
    i0.ɵɵelementStart(2, "h3");
    i0.ɵɵtext(3, "Creer client");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "form", 19);
    i0.ɵɵlistener("ngSubmit", function ClientAutocompleteComponent_div_12_Template_form_ngSubmit_4_listener() { i0.ɵɵrestoreView(_r6); const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.createClient()); });
    i0.ɵɵelementStart(5, "label", 1)(6, "span");
    i0.ɵɵtext(7, "Nom");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(8, "input", 20);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "label", 1)(10, "span");
    i0.ɵɵtext(11, "Telephone");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(12, "input", 21);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(13, "label", 1)(14, "span");
    i0.ɵɵtext(15, "Email");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(16, "input", 22);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(17, "label", 1)(18, "span");
    i0.ɵɵtext(19, "Adresse");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(20, "textarea", 23);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(21, "label", 1)(22, "span");
    i0.ɵɵtext(23, "MF");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(24, "input", 24);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(25, ClientAutocompleteComponent_div_12_div_25_Template, 2, 1, "div", 25);
    i0.ɵɵelementStart(26, "div", 26)(27, "button", 27);
    i0.ɵɵlistener("click", function ClientAutocompleteComponent_div_12_Template_button_click_27_listener() { i0.ɵɵrestoreView(_r6); const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.closeCreateModal()); });
    i0.ɵɵtext(28, "Annuler");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(29, "button", 28);
    i0.ɵɵtext(30);
    i0.ɵɵelementEnd()()()()();
} if (rf & 2) {
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("formGroup", ctx_r2.createForm);
    i0.ɵɵadvance(21);
    i0.ɵɵproperty("ngIf", ctx_r2.createError);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("disabled", ctx_r2.isCreating);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("disabled", ctx_r2.isCreating);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r2.isCreating ? "Creation..." : "Creer", " ");
} }
export class ClientAutocompleteComponent {
    constructor(fb, cdr, clientStore, clientPersistence) {
        this.fb = fb;
        this.cdr = cdr;
        this.clientStore = clientStore;
        this.clientPersistence = clientPersistence;
        this.clientSelected = new EventEmitter();
        this.destroy$ = new Subject();
        this.isPatching = false;
        this.clients = [];
        this.suggestions = [];
        this.dropdownOpen = false;
        this.activeIndex = -1;
        this.query = '';
        this.selectedClient = null;
        this.showCreateModal = false;
        this.isCreating = false;
        this.createError = '';
        this.createForm = this.fb.group({
            nom: ['', Validators.required],
            tel: [''],
            email: ['', Validators.email],
            adresse: [''],
            mf: ['']
        });
        this.trackByClient = (_, client) => client.id ?? `${client.nom}|${client.email ?? ''}|${client.tel || client.telephone || ''}`;
    }
    get nameControl() {
        const control = this.formGroup?.get(this.clientControlName);
        if (!(control instanceof FormControl)) {
            throw new Error(`[ClientAutocomplete] Control "${this.clientControlName}" is missing or invalid`);
        }
        return control;
    }
    get canCreateFromQuery() {
        return this.toKey(this.query).length > 0;
    }
    get createOptionIndex() {
        return this.suggestions.length;
    }
    async ngOnInit() {
        await this.clientStore.load();
        this.clientStore.clients$
            .pipe(takeUntil(this.destroy$))
            .subscribe((clients) => {
            this.clients = clients;
            this.updateSuggestions(this.query);
            this.cdr.markForCheck();
        });
        this.query = this.normalizeText(this.nameControl.value);
        this.nameControl.valueChanges
            .pipe(startWith(this.nameControl.value), debounceTime(120), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((value) => {
            if (this.isPatching)
                return;
            this.query = this.normalizeText(value);
            if (this.selectedClient && this.toKey(this.query) !== this.toKey(this.selectedClient.nom)) {
                this.selectedClient = null;
                this.clientSelected.emit(null);
            }
            this.updateSuggestions(this.query);
            if (this.query || this.dropdownOpen) {
                this.dropdownOpen = true;
            }
            this.cdr.markForCheck();
        });
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.blurTimer) {
            window.clearTimeout(this.blurTimer);
            this.blurTimer = undefined;
        }
    }
    onFocus() {
        if (this.blurTimer) {
            window.clearTimeout(this.blurTimer);
            this.blurTimer = undefined;
        }
        this.dropdownOpen = true;
        this.updateSuggestions(this.query);
    }
    onBlur() {
        this.blurTimer = window.setTimeout(() => {
            this.closeDropdown();
            this.cdr.markForCheck();
        }, 120);
    }
    toggleDropdown(event) {
        event.preventDefault();
        if (this.dropdownOpen) {
            this.closeDropdown();
            return;
        }
        this.dropdownOpen = true;
        this.updateSuggestions(this.query);
    }
    onKeydown(event) {
        if (!this.dropdownOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            this.dropdownOpen = true;
            this.updateSuggestions(this.query);
        }
        const count = this.totalOptionsCount();
        if (!count)
            return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.activeIndex = this.activeIndex < 0 ? 0 : (this.activeIndex + 1) % count;
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.activeIndex = this.activeIndex < 0 ? count - 1 : (this.activeIndex - 1 + count) % count;
            return;
        }
        if (event.key === 'Enter') {
            if (this.activeIndex < 0)
                return;
            event.preventDefault();
            if (this.canCreateFromQuery && this.activeIndex === this.createOptionIndex) {
                this.openCreateModalFromQuery();
                return;
            }
            const client = this.suggestions[this.activeIndex];
            if (client)
                this.selectClient(client);
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.closeDropdown();
        }
    }
    selectClient(client) {
        this.applyClient(client);
        this.closeDropdown();
    }
    isSuggestionActive(index) {
        return this.activeIndex === index;
    }
    isCreateOptionActive() {
        return this.canCreateFromQuery && this.activeIndex === this.createOptionIndex;
    }
    openCreateModalFromQuery() {
        const name = this.query || this.normalizeText(this.nameControl.value);
        this.createForm.reset({
            nom: name,
            tel: '',
            email: '',
            adresse: '',
            mf: ''
        });
        this.createError = '';
        this.showCreateModal = true;
        this.closeDropdown();
        this.cdr.markForCheck();
    }
    closeCreateModal() {
        if (this.isCreating)
            return;
        this.showCreateModal = false;
        this.createError = '';
        this.cdr.markForCheck();
    }
    async createClient() {
        if (this.isCreating)
            return;
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }
        const raw = this.createForm.getRawValue();
        this.isCreating = true;
        this.createError = '';
        this.cdr.markForCheck();
        try {
            const resolved = await this.clientPersistence.findOrCreate({
                nom: this.normalizeText(raw.nom),
                tel: this.normalizeText(raw.tel),
                telephone: this.normalizeText(raw.tel),
                email: this.normalizeText(raw.email).toLowerCase(),
                adresse: this.normalizeText(raw.adresse),
                mf: this.normalizeText(raw.mf)
            });
            if (!resolved) {
                this.createError = 'Impossible de creer ce client.';
                return;
            }
            await this.clientStore.refresh();
            this.applyClient(resolved);
            this.showCreateModal = false;
            this.createForm.reset({
                nom: '',
                tel: '',
                email: '',
                adresse: '',
                mf: ''
            });
        }
        catch {
            this.createError = 'Impossible de creer ce client.';
        }
        finally {
            this.isCreating = false;
            this.cdr.markForCheck();
        }
    }
    applyClient(client) {
        const tel = this.normalizeText(client.tel || client.telephone);
        this.isPatching = true;
        this.selectedClient = client;
        this.query = this.normalizeText(client.nom);
        this.formGroup.patchValue({
            nom: this.normalizeText(client.nom),
            tel,
            email: this.normalizeText(client.email).toLowerCase(),
            adresse: this.normalizeText(client.adresse),
            mf: this.normalizeText(client.mf)
        }, { emitEvent: false });
        this.isPatching = false;
        this.clientSelected.emit(client);
        this.cdr.markForCheck();
    }
    updateSuggestions(query) {
        const key = this.toKey(query);
        const phoneKey = this.normalizePhone(query);
        const results = this.clients.filter((client) => {
            if (!client.nom)
                return false;
            if (!key)
                return true;
            const nom = this.toKey(client.nom);
            const tel = this.normalizePhone(client.tel || client.telephone);
            const email = this.toKey(client.email);
            const mf = this.toKey(client.mf);
            return nom.includes(key) || email.includes(key) || mf.includes(key) || (phoneKey ? tel.includes(phoneKey) : false);
        });
        this.suggestions = results.slice(0, 8);
        const maxIndex = this.totalOptionsCount() - 1;
        if (maxIndex < 0) {
            this.activeIndex = -1;
            return;
        }
        if (this.activeIndex < 0 || this.activeIndex > maxIndex) {
            this.activeIndex = 0;
        }
    }
    closeDropdown() {
        this.dropdownOpen = false;
        this.activeIndex = -1;
    }
    totalOptionsCount() {
        return this.suggestions.length + (this.canCreateFromQuery ? 1 : 0);
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
    normalizePhone(value) {
        return this.normalizeText(value).replace(/[^\d+]/g, '').toLowerCase();
    }
    static { this.ɵfac = function ClientAutocompleteComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ClientAutocompleteComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i0.ChangeDetectorRef), i0.ɵɵdirectiveInject(i2.ClientStoreService), i0.ɵɵdirectiveInject(i3.ClientPersistenceService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: ClientAutocompleteComponent, selectors: [["app-client-autocomplete"]], inputs: { formGroup: "formGroup", clientControlName: "clientControlName" }, outputs: { clientSelected: "clientSelected" }, decls: 13, vars: 4, consts: [[1, "client-picker", 3, "formGroup"], [1, "field"], [1, "picker-row"], [1, "picker-input-wrap"], ["type", "text", "autocomplete", "off", 1, "input", 3, "focus", "blur", "keydown", "formControlName"], ["type", "button", "aria-label", "Afficher les clients", 1, "picker-toggle", 3, "mousedown"], ["type", "button", 1, "btn", "outline", "new-client-btn", 3, "click"], ["class", "picker-dropdown card", 4, "ngIf"], ["class", "modal-overlay", 3, "click", 4, "ngIf"], [1, "picker-dropdown", "card"], ["class", "picker-item", "type", "button", 3, "active", "mousedown", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["class", "picker-item create-item", "type", "button", 3, "active", "mousedown", 4, "ngIf"], ["type", "button", 1, "picker-item", 3, "mousedown"], [1, "picker-title"], [1, "picker-meta"], [4, "ngIf"], ["type", "button", 1, "picker-item", "create-item", 3, "mousedown"], [1, "modal-overlay", 3, "click"], [1, "modal-card", "card", 3, "click"], [1, "modal-form", 3, "ngSubmit", "formGroup"], ["type", "text", "formControlName", "nom", 1, "input"], ["type", "text", "formControlName", "tel", 1, "input"], ["type", "email", "formControlName", "email", 1, "input"], ["rows", "3", "formControlName", "adresse", 1, "input"], ["type", "text", "formControlName", "mf", 1, "input"], ["class", "error", 4, "ngIf"], [1, "modal-actions"], ["type", "button", 1, "btn", "ghost", 3, "click", "disabled"], ["type", "submit", 1, "btn", "primary", 3, "disabled"], [1, "error"]], template: function ClientAutocompleteComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "div", 0)(1, "label", 1)(2, "span");
            i0.ɵɵtext(3, "Client");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(4, "div", 2)(5, "div", 3)(6, "input", 4);
            i0.ɵɵlistener("focus", function ClientAutocompleteComponent_Template_input_focus_6_listener() { return ctx.onFocus(); })("blur", function ClientAutocompleteComponent_Template_input_blur_6_listener() { return ctx.onBlur(); })("keydown", function ClientAutocompleteComponent_Template_input_keydown_6_listener($event) { return ctx.onKeydown($event); });
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(7, "button", 5);
            i0.ɵɵlistener("mousedown", function ClientAutocompleteComponent_Template_button_mousedown_7_listener($event) { return ctx.toggleDropdown($event); });
            i0.ɵɵtext(8, " v ");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(9, "button", 6);
            i0.ɵɵlistener("click", function ClientAutocompleteComponent_Template_button_click_9_listener() { return ctx.openCreateModalFromQuery(); });
            i0.ɵɵtext(10, " + Nouveau client ");
            i0.ɵɵelementEnd()()();
            i0.ɵɵtemplate(11, ClientAutocompleteComponent_div_11_Template, 3, 3, "div", 7);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(12, ClientAutocompleteComponent_div_12_Template, 31, 5, "div", 8);
        } if (rf & 2) {
            i0.ɵɵproperty("formGroup", ctx.formGroup);
            i0.ɵɵadvance(6);
            i0.ɵɵproperty("formControlName", ctx.clientControlName);
            i0.ɵɵadvance(5);
            i0.ɵɵproperty("ngIf", ctx.dropdownOpen);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.showCreateModal);
        } }, dependencies: [CommonModule, i4.NgForOf, i4.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.DefaultValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.FormGroupDirective, i1.FormControlName], styles: [".client-picker[_ngcontent-%COMP%] {\n  position: relative;\n}\n\n.picker-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr auto;\n  gap: 10px;\n  align-items: center;\n}\n\n.picker-input-wrap[_ngcontent-%COMP%] {\n  position: relative;\n}\n\n.picker-toggle[_ngcontent-%COMP%] {\n  position: absolute;\n  right: 8px;\n  top: 50%;\n  transform: translateY(-50%);\n  border: none;\n  background: transparent;\n  color: var(--muted);\n  cursor: pointer;\n  font-size: 0.8rem;\n}\n\n.new-client-btn[_ngcontent-%COMP%] {\n  white-space: nowrap;\n}\n\n.picker-dropdown[_ngcontent-%COMP%] {\n  position: absolute;\n  top: calc(100% + 6px);\n  left: 0;\n  right: 0;\n  z-index: 30;\n  max-height: 260px;\n  overflow-y: auto;\n  padding: 6px;\n}\n\n.picker-item[_ngcontent-%COMP%] {\n  width: 100%;\n  border: none;\n  background: transparent;\n  border-radius: 10px;\n  cursor: pointer;\n  text-align: left;\n  padding: 10px 12px;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n}\n\n.picker-item[_ngcontent-%COMP%]:hover, \n.picker-item.active[_ngcontent-%COMP%] {\n  background: #eef2ff;\n}\n\n.picker-title[_ngcontent-%COMP%] {\n  font-weight: 700;\n  color: var(--ink);\n}\n\n.picker-meta[_ngcontent-%COMP%] {\n  font-size: 0.82rem;\n  color: var(--muted);\n}\n\n.create-item[_ngcontent-%COMP%] {\n  border-top: 1px solid var(--border);\n  margin-top: 6px;\n  padding-top: 12px;\n}\n\n.modal-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  inset: 0;\n  z-index: 1000;\n  background: rgba(15, 23, 42, 0.4);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 18px;\n}\n\n.modal-card[_ngcontent-%COMP%] {\n  width: min(560px, 100%);\n}\n\n.modal-form[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 12px;\n  margin-top: 12px;\n}\n\n.modal-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  gap: 10px;\n}"], changeDetection: 0 }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ClientAutocompleteComponent, [{
        type: Component,
        args: [{ selector: 'app-client-autocomplete', standalone: true, imports: [CommonModule, ReactiveFormsModule], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"client-picker\" [formGroup]=\"formGroup\">\n  <label class=\"field\">\n    <span>Client</span>\n    <div class=\"picker-row\">\n      <div class=\"picker-input-wrap\">\n        <input\n          class=\"input\"\n          [formControlName]=\"clientControlName\"\n          type=\"text\"\n          autocomplete=\"off\"\n          (focus)=\"onFocus()\"\n          (blur)=\"onBlur()\"\n          (keydown)=\"onKeydown($event)\"\n        >\n        <button class=\"picker-toggle\" type=\"button\" (mousedown)=\"toggleDropdown($event)\" aria-label=\"Afficher les clients\">\n          v\n        </button>\n      </div>\n      <button class=\"btn outline new-client-btn\" type=\"button\" (click)=\"openCreateModalFromQuery()\">\n        + Nouveau client\n      </button>\n    </div>\n  </label>\n\n  <div class=\"picker-dropdown card\" *ngIf=\"dropdownOpen\">\n    <button\n      class=\"picker-item\"\n      type=\"button\"\n      *ngFor=\"let client of suggestions; let i = index; trackBy: trackByClient\"\n      [class.active]=\"isSuggestionActive(i)\"\n      (mousedown)=\"selectClient(client)\"\n    >\n      <span class=\"picker-title\">{{ client.nom }}</span>\n      <span class=\"picker-meta\">\n        {{ client.tel || client.telephone || '-' }}\n        <ng-container *ngIf=\"client.email\"> | {{ client.email }}</ng-container>\n        <ng-container *ngIf=\"client.mf\"> | MF {{ client.mf }}</ng-container>\n      </span>\n    </button>\n\n    <button\n      class=\"picker-item create-item\"\n      type=\"button\"\n      *ngIf=\"canCreateFromQuery\"\n      [class.active]=\"isCreateOptionActive()\"\n      (mousedown)=\"openCreateModalFromQuery()\"\n    >\n      + Creer un nouveau client \"{{ query }}\"\n    </button>\n  </div>\n</div>\n\n<div class=\"modal-overlay\" *ngIf=\"showCreateModal\" (click)=\"closeCreateModal()\">\n  <div class=\"modal-card card\" (click)=\"$event.stopPropagation()\">\n    <h3>Creer client</h3>\n\n    <form class=\"modal-form\" [formGroup]=\"createForm\" (ngSubmit)=\"createClient()\">\n      <label class=\"field\">\n        <span>Nom</span>\n        <input class=\"input\" type=\"text\" formControlName=\"nom\">\n      </label>\n\n      <label class=\"field\">\n        <span>Telephone</span>\n        <input class=\"input\" type=\"text\" formControlName=\"tel\">\n      </label>\n\n      <label class=\"field\">\n        <span>Email</span>\n        <input class=\"input\" type=\"email\" formControlName=\"email\">\n      </label>\n\n      <label class=\"field\">\n        <span>Adresse</span>\n        <textarea class=\"input\" rows=\"3\" formControlName=\"adresse\"></textarea>\n      </label>\n\n      <label class=\"field\">\n        <span>MF</span>\n        <input class=\"input\" type=\"text\" formControlName=\"mf\">\n      </label>\n\n      <div class=\"error\" *ngIf=\"createError\">{{ createError }}</div>\n\n      <div class=\"modal-actions\">\n        <button class=\"btn ghost\" type=\"button\" (click)=\"closeCreateModal()\" [disabled]=\"isCreating\">Annuler</button>\n        <button class=\"btn primary\" type=\"submit\" [disabled]=\"isCreating\">\n          {{ isCreating ? 'Creation...' : 'Creer' }}\n        </button>\n      </div>\n    </form>\n  </div>\n</div>\n", styles: [".client-picker {\n  position: relative;\n}\n\n.picker-row {\n  display: grid;\n  grid-template-columns: 1fr auto;\n  gap: 10px;\n  align-items: center;\n}\n\n.picker-input-wrap {\n  position: relative;\n}\n\n.picker-toggle {\n  position: absolute;\n  right: 8px;\n  top: 50%;\n  transform: translateY(-50%);\n  border: none;\n  background: transparent;\n  color: var(--muted);\n  cursor: pointer;\n  font-size: 0.8rem;\n}\n\n.new-client-btn {\n  white-space: nowrap;\n}\n\n.picker-dropdown {\n  position: absolute;\n  top: calc(100% + 6px);\n  left: 0;\n  right: 0;\n  z-index: 30;\n  max-height: 260px;\n  overflow-y: auto;\n  padding: 6px;\n}\n\n.picker-item {\n  width: 100%;\n  border: none;\n  background: transparent;\n  border-radius: 10px;\n  cursor: pointer;\n  text-align: left;\n  padding: 10px 12px;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n}\n\n.picker-item:hover,\n.picker-item.active {\n  background: #eef2ff;\n}\n\n.picker-title {\n  font-weight: 700;\n  color: var(--ink);\n}\n\n.picker-meta {\n  font-size: 0.82rem;\n  color: var(--muted);\n}\n\n.create-item {\n  border-top: 1px solid var(--border);\n  margin-top: 6px;\n  padding-top: 12px;\n}\n\n.modal-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 1000;\n  background: rgba(15, 23, 42, 0.4);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 18px;\n}\n\n.modal-card {\n  width: min(560px, 100%);\n}\n\n.modal-form {\n  display: grid;\n  gap: 12px;\n  margin-top: 12px;\n}\n\n.modal-actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 10px;\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i0.ChangeDetectorRef }, { type: i2.ClientStoreService }, { type: i3.ClientPersistenceService }], { formGroup: [{
            type: Input,
            args: [{ required: true }]
        }], clientControlName: [{
            type: Input,
            args: [{ required: true }]
        }], clientSelected: [{
            type: Output
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(ClientAutocompleteComponent, { className: "ClientAutocompleteComponent", filePath: "src/app/components/client-autocomplete/client-autocomplete.component.ts", lineNumber: 26 }); })();
