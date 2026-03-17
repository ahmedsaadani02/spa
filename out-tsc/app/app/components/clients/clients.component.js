import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "../../services/client-store.service";
import * as i3 from "../../services/client-persistence.service";
import * as i4 from "@angular/common";
function ClientsComponent_div_24_span_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 26);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const client_r2 = i0.ɵɵnextContext().$implicit;
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(client_r2.adresse);
} }
function ClientsComponent_div_24_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 21)(1, "div", 22)(2, "strong");
    i0.ɵɵtext(3);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(4, ClientsComponent_div_24_span_4_Template, 2, 1, "span", 23);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "div");
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "div");
    i0.ɵɵtext(8);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "div");
    i0.ɵɵtext(10);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "div", 24)(12, "button", 19);
    i0.ɵɵlistener("click", function ClientsComponent_div_24_Template_button_click_12_listener() { const client_r2 = i0.ɵɵrestoreView(_r1).$implicit; const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.editClient(client_r2)); });
    i0.ɵɵtext(13, "Modifier");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "button", 25);
    i0.ɵɵlistener("click", function ClientsComponent_div_24_Template_button_click_14_listener() { const client_r2 = i0.ɵɵrestoreView(_r1).$implicit; const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.deleteClient(client_r2)); });
    i0.ɵɵtext(15, "Supprimer");
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const client_r2 = ctx.$implicit;
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(client_r2.nom);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", client_r2.adresse);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(client_r2.tel || client_r2.telephone || "-");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(client_r2.email || "-");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(client_r2.mf || "-");
} }
function ClientsComponent_div_25_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 27);
    i0.ɵɵtext(1, " Aucun client trouv\u00E9. ");
    i0.ɵɵelementEnd();
} }
function ClientsComponent_div_49_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 28);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵclassProp("error", ctx_r2.notice.type === "error");
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r2.notice.message, " ");
} }
export class ClientsComponent {
    constructor(fb, cdr, clientStore, clientPersistence) {
        this.fb = fb;
        this.cdr = cdr;
        this.clientStore = clientStore;
        this.clientPersistence = clientPersistence;
        this.destroy$ = new Subject();
        this.currentQuery = '';
        this.searchControl = new FormControl('', { nonNullable: true });
        this.form = this.fb.group({
            id: [''],
            nom: ['', Validators.required],
            tel: [''],
            adresse: [''],
            mf: [''],
            email: ['', Validators.email]
        });
        this.clients = [];
        this.filteredClients = [];
        this.isSaving = false;
        this.editingId = null;
        this.notice = {
            open: false,
            type: 'info',
            message: ''
        };
        this.trackByClientId = (_, client) => client.id ?? `${client.nom}|${client.email ?? ''}|${client.tel || client.telephone || ''}`;
    }
    async ngOnInit() {
        await this.clientStore.load();
        this.clientStore.clients$
            .pipe(takeUntil(this.destroy$))
            .subscribe((clients) => {
            this.clients = clients;
            this.applyFilter(this.currentQuery);
            this.cdr.markForCheck();
        });
        this.searchControl.valueChanges
            .pipe(startWith(this.searchControl.value), debounceTime(180), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((query) => {
            this.currentQuery = query;
            this.applyFilter(query);
            this.cdr.markForCheck();
        });
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    startCreate() {
        this.editingId = null;
        this.form.reset({
            id: null,
            nom: '',
            tel: '',
            adresse: '',
            mf: '',
            email: ''
        });
    }
    editClient(client) {
        this.editingId = client.id ?? null;
        this.form.patchValue({
            id: client.id ?? null,
            nom: client.nom ?? '',
            tel: client.tel || client.telephone || '',
            adresse: client.adresse ?? '',
            mf: client.mf ?? '',
            email: client.email ?? ''
        });
    }
    async saveClient() {
        if (this.isSaving)
            return;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        this.hideNotice();
        this.cdr.markForCheck();
        const wasEdit = !!this.editingId;
        try {
            const raw = this.form.getRawValue();
            const payload = {
                id: this.normalizeText(raw.id) || null,
                nom: this.normalizeText(raw.nom),
                tel: this.normalizeText(raw.tel),
                telephone: this.normalizeText(raw.tel),
                adresse: this.normalizeText(raw.adresse),
                mf: this.normalizeText(raw.mf),
                email: this.normalizeText(raw.email).toLowerCase()
            };
            const saved = this.editingId
                ? await this.clientPersistence.upsert(payload)
                : await this.clientPersistence.findOrCreate(payload);
            await this.clientStore.refresh();
            if (saved) {
                this.editClient(saved);
            }
            else {
                this.startCreate();
            }
            this.showNotice('success', wasEdit ? 'Client mis a jour.' : 'Client enregistre.');
        }
        catch {
            this.showNotice('error', 'Impossible d enregistrer le client.');
        }
        finally {
            this.isSaving = false;
            this.cdr.markForCheck();
        }
    }
    async deleteClient(client) {
        if (!client.id)
            return;
        const ok = confirm(`Supprimer le client "${client.nom}" ?`);
        if (!ok)
            return;
        const deleted = await this.clientPersistence.delete(client.id);
        if (!deleted) {
            this.showNotice('error', 'Suppression impossible.');
            this.cdr.markForCheck();
            return;
        }
        await this.clientStore.refresh();
        if (this.editingId === client.id) {
            this.startCreate();
        }
        this.showNotice('success', 'Client supprime.');
        this.cdr.markForCheck();
    }
    applyFilter(query) {
        const key = this.toKey(query);
        const phoneKey = this.normalizePhone(query);
        if (!key) {
            this.filteredClients = [...this.clients];
            return;
        }
        this.filteredClients = this.clients.filter((client) => {
            const nom = this.toKey(client.nom);
            const tel = this.normalizePhone(client.tel || client.telephone);
            const email = this.toKey(client.email);
            const mf = this.toKey(client.mf);
            return nom.includes(key) || email.includes(key) || mf.includes(key) || (phoneKey ? tel.includes(phoneKey) : false);
        });
    }
    showNotice(type, message) {
        this.notice = { open: true, type, message };
    }
    hideNotice() {
        this.notice = { ...this.notice, open: false };
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
    static { this.ɵfac = function ClientsComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ClientsComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i0.ChangeDetectorRef), i0.ɵɵdirectiveInject(i2.ClientStoreService), i0.ɵɵdirectiveInject(i3.ClientPersistenceService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: ClientsComponent, selectors: [["app-clients"]], decls: 55, vars: 9, consts: [[1, "panel", "card"], [1, "panel-header"], [1, "panel-actions"], ["type", "search", "placeholder", "Rechercher nom, t\u00E9l., email, MF", 1, "input", 3, "formControl"], ["type", "button", 1, "btn", "outline", 3, "click"], [1, "layout"], [1, "table"], [1, "table-row", "table-head"], ["class", "table-row", 4, "ngFor", "ngForOf", "ngForTrackBy"], ["class", "empty", 4, "ngIf"], [1, "editor", "card", 3, "ngSubmit", "formGroup"], [1, "field"], ["type", "text", "formControlName", "nom", 1, "input"], ["type", "text", "formControlName", "tel", 1, "input"], ["rows", "3", "formControlName", "adresse", 1, "input"], ["type", "text", "formControlName", "mf", 1, "input"], ["type", "email", "formControlName", "email", 1, "input"], ["class", "notice", 3, "error", 4, "ngIf"], [1, "editor-actions"], ["type", "button", 1, "btn", "ghost", 3, "click"], ["type", "submit", 1, "btn", "primary", 3, "disabled"], [1, "table-row"], [1, "name"], ["class", "muted", 4, "ngIf"], [1, "actions"], ["type", "button", 1, "btn", "danger", 3, "click"], [1, "muted"], [1, "empty"], [1, "notice"]], template: function ClientsComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4, "Clients");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "Base clients r\u00E9utilisable pour les factures et les devis.");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(7, "div", 2);
            i0.ɵɵelement(8, "input", 3);
            i0.ɵɵelementStart(9, "button", 4);
            i0.ɵɵlistener("click", function ClientsComponent_Template_button_click_9_listener() { return ctx.startCreate(); });
            i0.ɵɵtext(10, "Nouveau client");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(11, "div", 5)(12, "div", 6)(13, "div", 7)(14, "div");
            i0.ɵɵtext(15, "Nom");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(16, "div");
            i0.ɵɵtext(17, "T\u00E9l\u00E9phone");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(18, "div");
            i0.ɵɵtext(19, "Email");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(20, "div");
            i0.ɵɵtext(21, "MF");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(22, "div");
            i0.ɵɵtext(23, "Actions");
            i0.ɵɵelementEnd()();
            i0.ɵɵtemplate(24, ClientsComponent_div_24_Template, 16, 5, "div", 8)(25, ClientsComponent_div_25_Template, 2, 0, "div", 9);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(26, "form", 10);
            i0.ɵɵlistener("ngSubmit", function ClientsComponent_Template_form_ngSubmit_26_listener() { return ctx.saveClient(); });
            i0.ɵɵelementStart(27, "h2");
            i0.ɵɵtext(28);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(29, "label", 11)(30, "span");
            i0.ɵɵtext(31, "Nom");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(32, "input", 12);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(33, "label", 11)(34, "span");
            i0.ɵɵtext(35, "T\u00E9l\u00E9phone");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(36, "input", 13);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(37, "label", 11)(38, "span");
            i0.ɵɵtext(39, "Adresse");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(40, "textarea", 14);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(41, "label", 11)(42, "span");
            i0.ɵɵtext(43, "MF");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(44, "input", 15);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(45, "label", 11)(46, "span");
            i0.ɵɵtext(47, "Email");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(48, "input", 16);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(49, ClientsComponent_div_49_Template, 2, 3, "div", 17);
            i0.ɵɵelementStart(50, "div", 18)(51, "button", 19);
            i0.ɵɵlistener("click", function ClientsComponent_Template_button_click_51_listener() { return ctx.startCreate(); });
            i0.ɵɵtext(52, "Vider");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(53, "button", 20);
            i0.ɵɵtext(54);
            i0.ɵɵelementEnd()()()()();
        } if (rf & 2) {
            i0.ɵɵadvance(8);
            i0.ɵɵproperty("formControl", ctx.searchControl);
            i0.ɵɵadvance(16);
            i0.ɵɵproperty("ngForOf", ctx.filteredClients)("ngForTrackBy", ctx.trackByClientId);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.filteredClients.length === 0);
            i0.ɵɵadvance();
            i0.ɵɵproperty("formGroup", ctx.form);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.editingId ? "Modifier client" : "Ajouter client");
            i0.ɵɵadvance(21);
            i0.ɵɵproperty("ngIf", ctx.notice.open);
            i0.ɵɵadvance(4);
            i0.ɵɵproperty("disabled", ctx.isSaving);
            i0.ɵɵadvance();
            i0.ɵɵtextInterpolate1(" ", ctx.isSaving ? "Enregistrement..." : "Enregistrer", " ");
        } }, dependencies: [CommonModule, i4.NgForOf, i4.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.DefaultValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.FormControlDirective, i1.FormGroupDirective, i1.FormControlName], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.panel-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.layout[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.7fr 1fr;\n  gap: 16px;\n}\n\n.table[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.table-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.2fr 0.9fr 1fr 0.8fr 1.1fr;\n  gap: 10px;\n  align-items: center;\n  border-bottom: 1px solid var(--border);\n  padding: 10px 0;\n}\n\n.table-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom-width: 2px;\n}\n\n.name[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.muted[_ngcontent-%COMP%] {\n  color: var(--muted);\n  font-size: 0.85rem;\n}\n\n.actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n}\n\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted);\n  padding: 14px 0 6px;\n}\n\n.editor[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.editor-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 10px;\n  justify-content: flex-end;\n}\n\n.notice[_ngcontent-%COMP%] {\n  border-radius: 10px;\n  padding: 8px 10px;\n  background: #eaf8f5;\n  color: #0f766e;\n  font-size: 0.86rem;\n}\n\n.notice.error[_ngcontent-%COMP%] {\n  background: #fce9e9;\n  color: #b42318;\n}\n\n@media (max-width: 1100px) {\n  .layout[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .table-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n    gap: 6px;\n  }\n\n  .actions[_ngcontent-%COMP%] {\n    justify-content: flex-start;\n  }\n}"], changeDetection: 0 }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ClientsComponent, [{
        type: Component,
        args: [{ selector: 'app-clients', standalone: true, imports: [CommonModule, ReactiveFormsModule], changeDetection: ChangeDetectionStrategy.OnPush, template: "<section class=\"panel card\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Clients</h1>\n      <p>Base clients r&eacute;utilisable pour les factures et les devis.</p>\n    </div>\n    <div class=\"panel-actions\">\n      <input\n        class=\"input\"\n        type=\"search\"\n        [formControl]=\"searchControl\"\n        placeholder=\"Rechercher nom, t&eacute;l., email, MF\"\n      >\n      <button class=\"btn outline\" type=\"button\" (click)=\"startCreate()\">Nouveau client</button>\n    </div>\n  </div>\n\n  <div class=\"layout\">\n    <div class=\"table\">\n      <div class=\"table-row table-head\">\n        <div>Nom</div>\n        <div>T&eacute;l&eacute;phone</div>\n        <div>Email</div>\n        <div>MF</div>\n        <div>Actions</div>\n      </div>\n\n      <div class=\"table-row\" *ngFor=\"let client of filteredClients; trackBy: trackByClientId\">\n        <div class=\"name\">\n          <strong>{{ client.nom }}</strong>\n          <span class=\"muted\" *ngIf=\"client.adresse\">{{ client.adresse }}</span>\n        </div>\n        <div>{{ client.tel || client.telephone || '-' }}</div>\n        <div>{{ client.email || '-' }}</div>\n        <div>{{ client.mf || '-' }}</div>\n        <div class=\"actions\">\n          <button class=\"btn ghost\" type=\"button\" (click)=\"editClient(client)\">Modifier</button>\n          <button class=\"btn danger\" type=\"button\" (click)=\"deleteClient(client)\">Supprimer</button>\n        </div>\n      </div>\n\n      <div class=\"empty\" *ngIf=\"filteredClients.length === 0\">\n        Aucun client trouv&eacute;.\n      </div>\n    </div>\n\n    <form class=\"editor card\" [formGroup]=\"form\" (ngSubmit)=\"saveClient()\">\n      <h2>{{ editingId ? 'Modifier client' : 'Ajouter client' }}</h2>\n\n      <label class=\"field\">\n        <span>Nom</span>\n        <input class=\"input\" type=\"text\" formControlName=\"nom\">\n      </label>\n\n      <label class=\"field\">\n        <span>T&eacute;l&eacute;phone</span>\n        <input class=\"input\" type=\"text\" formControlName=\"tel\">\n      </label>\n\n      <label class=\"field\">\n        <span>Adresse</span>\n        <textarea class=\"input\" rows=\"3\" formControlName=\"adresse\"></textarea>\n      </label>\n\n      <label class=\"field\">\n        <span>MF</span>\n        <input class=\"input\" type=\"text\" formControlName=\"mf\">\n      </label>\n\n      <label class=\"field\">\n        <span>Email</span>\n        <input class=\"input\" type=\"email\" formControlName=\"email\">\n      </label>\n\n      <div class=\"notice\" *ngIf=\"notice.open\" [class.error]=\"notice.type === 'error'\">\n        {{ notice.message }}\n      </div>\n\n      <div class=\"editor-actions\">\n        <button class=\"btn ghost\" type=\"button\" (click)=\"startCreate()\">Vider</button>\n        <button class=\"btn primary\" type=\"submit\" [disabled]=\"isSaving\">\n          {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}\n        </button>\n      </div>\n    </form>\n  </div>\n</section>\n", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.panel-actions {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.layout {\n  display: grid;\n  grid-template-columns: 1.7fr 1fr;\n  gap: 16px;\n}\n\n.table {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.table-row {\n  display: grid;\n  grid-template-columns: 1.2fr 0.9fr 1fr 0.8fr 1.1fr;\n  gap: 10px;\n  align-items: center;\n  border-bottom: 1px solid var(--border);\n  padding: 10px 0;\n}\n\n.table-head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom-width: 2px;\n}\n\n.name {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.muted {\n  color: var(--muted);\n  font-size: 0.85rem;\n}\n\n.actions {\n  display: flex;\n  gap: 8px;\n  justify-content: flex-end;\n}\n\n.empty {\n  text-align: center;\n  color: var(--muted);\n  padding: 14px 0 6px;\n}\n\n.editor {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.editor-actions {\n  display: flex;\n  gap: 10px;\n  justify-content: flex-end;\n}\n\n.notice {\n  border-radius: 10px;\n  padding: 8px 10px;\n  background: #eaf8f5;\n  color: #0f766e;\n  font-size: 0.86rem;\n}\n\n.notice.error {\n  background: #fce9e9;\n  color: #b42318;\n}\n\n@media (max-width: 1100px) {\n  .layout {\n    grid-template-columns: 1fr;\n  }\n\n  .table-row {\n    grid-template-columns: 1fr;\n    gap: 6px;\n  }\n\n  .actions {\n    justify-content: flex-start;\n  }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i0.ChangeDetectorRef }, { type: i2.ClientStoreService }, { type: i3.ClientPersistenceService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(ClientsComponent, { className: "ClientsComponent", filePath: "src/app/components/clients/clients.component.ts", lineNumber: 19 }); })();
