import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "@angular/router";
import * as i3 from "../../repositories/employees.repository";
import * as i4 from "../../services/auth.service";
import * as i5 from "@angular/common";
function EmployeeFormComponent_section_10_option_37_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "option", 40);
    i0.ɵɵtext(1, "developer");
    i0.ɵɵelementEnd();
} }
function EmployeeFormComponent_section_10_option_38_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "option", 41);
    i0.ɵɵtext(1, "owner");
    i0.ɵɵelementEnd();
} }
function EmployeeFormComponent_section_10_div_101_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 42);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.error);
} }
function EmployeeFormComponent_section_10_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "section", 5)(1, "form", 6);
    i0.ɵɵlistener("ngSubmit", function EmployeeFormComponent_section_10_Template_form_ngSubmit_1_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.submit()); });
    i0.ɵɵelementStart(2, "div", 7)(3, "label", 8)(4, "span");
    i0.ɵɵtext(5, "Nom");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(6, "input", 9);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "label", 8)(8, "span");
    i0.ɵɵtext(9, "Telephone");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(10, "input", 10);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(11, "label", 8)(12, "span");
    i0.ɵɵtext(13, "Email");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(14, "input", 11);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(15, "div", 7)(16, "label", 8)(17, "span");
    i0.ɵɵtext(18, "Poste");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(19, "input", 12);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(20, "label", 8)(21, "span");
    i0.ɵɵtext(22, "Adresse");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(23, "input", 13);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(24, "label", 8)(25, "span");
    i0.ɵɵtext(26, "Salaire de base");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(27, "input", 14);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(28, "div", 7)(29, "label", 8)(30, "span");
    i0.ɵɵtext(31, "Date embauche");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(32, "input", 15);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(33, "label", 8)(34, "span");
    i0.ɵɵtext(35, "Role");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(36, "select", 16);
    i0.ɵɵtemplate(37, EmployeeFormComponent_section_10_option_37_Template, 2, 0, "option", 17)(38, EmployeeFormComponent_section_10_option_38_Template, 2, 0, "option", 18);
    i0.ɵɵelementStart(39, "option", 19);
    i0.ɵɵtext(40, "admin");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(41, "option", 20);
    i0.ɵɵtext(42, "employee");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(43, "label", 21)(44, "span");
    i0.ɵɵtext(45, "Actif logiciel");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(46, "label");
    i0.ɵɵelement(47, "input", 22);
    i0.ɵɵtext(48, " Actif");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(49, "label", 21)(50, "span");
    i0.ɵɵtext(51, "Actif RH");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(52, "label");
    i0.ɵɵelement(53, "input", 23);
    i0.ɵɵtext(54, " Actif");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(55, "div", 24)(56, "label", 8)(57, "span");
    i0.ɵɵtext(58, "Username");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(59, "input", 25);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(60, "label", 8)(61, "span");
    i0.ɵɵtext(62);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(63, "input", 26);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(64, "div", 24)(65, "label", 21)(66, "span");
    i0.ɵɵtext(67, "Force setup password");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(68, "label");
    i0.ɵɵelement(69, "input", 27);
    i0.ɵɵtext(70, " Oui");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(71, "label", 21)(72, "span");
    i0.ɵɵtext(73, "2FA email");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(74, "label");
    i0.ɵɵelement(75, "input", 28);
    i0.ɵɵtext(76, " Obligatoire");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(77, "fieldset", 29)(78, "legend");
    i0.ɵɵtext(79, "Permissions");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(80, "label");
    i0.ɵɵelement(81, "input", 30);
    i0.ɵɵtext(82, " Voir stock");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(83, "label");
    i0.ɵɵelement(84, "input", 31);
    i0.ɵɵtext(85, " Modifier stock");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(86, "label");
    i0.ɵɵelement(87, "input", 32);
    i0.ɵɵtext(88, " Gerer salaries");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(89, "label");
    i0.ɵɵelement(90, "input", 33);
    i0.ɵɵtext(91, " Gerer factures");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(92, "label");
    i0.ɵɵelement(93, "input", 34);
    i0.ɵɵtext(94, " Gerer devis");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(95, "label");
    i0.ɵɵelement(96, "input", 35);
    i0.ɵɵtext(97, " Gerer clients");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(98, "label");
    i0.ɵɵelement(99, "input", 36);
    i0.ɵɵtext(100, " Gerer salaires");
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(101, EmployeeFormComponent_section_10_div_101_Template, 2, 1, "div", 37);
    i0.ɵɵelementStart(102, "div", 2)(103, "button", 38);
    i0.ɵɵtext(104, "Annuler");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(105, "button", 39);
    i0.ɵɵtext(106);
    i0.ɵɵelementEnd()()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵproperty("formGroup", ctx_r1.form);
    i0.ɵɵadvance(36);
    i0.ɵɵproperty("ngIf", ctx_r1.canAssignSensitiveRoles);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.canAssignSensitiveRoles);
    i0.ɵɵadvance(24);
    i0.ɵɵtextInterpolate(ctx_r1.isEditMode ? "Nouveau mot de passe (optionnel)" : "Mot de passe initial");
    i0.ɵɵadvance(7);
    i0.ɵɵproperty("disabled", !ctx_r1.canManageProtectedFlags);
    i0.ɵɵadvance(6);
    i0.ɵɵproperty("disabled", !ctx_r1.canManageProtectedFlags);
    i0.ɵɵadvance(26);
    i0.ɵɵproperty("ngIf", ctx_r1.error);
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("disabled", ctx_r1.saving);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r1.saving ? "Enregistrement..." : "Enregistrer", " ");
} }
export class EmployeeFormComponent {
    constructor(fb, route, router, employeesRepository, auth) {
        this.fb = fb;
        this.route = route;
        this.router = router;
        this.employeesRepository = employeesRepository;
        this.auth = auth;
        this.employeeId = null;
        this.loading = false;
        this.saving = false;
        this.error = '';
        this.form = this.fb.group({
            nom: ['', [Validators.required, Validators.minLength(2)]],
            telephone: [''],
            email: ['', [Validators.email]],
            adresse: [''],
            poste: [''],
            salaireBase: [0, [Validators.required, Validators.min(0)]],
            dateEmbauche: [''],
            actif: [true],
            isActive: [true],
            username: [''],
            initialPassword: [''],
            mustSetupPassword: [false],
            requiresEmail2fa: [false],
            role: ['employee'],
            canViewStock: [false],
            canManageStock: [false],
            canManageEmployees: [false],
            canManageInvoices: [false],
            canManageQuotes: [false],
            canManageClients: [false],
            canManageSalary: [false]
        });
    }
    get isEditMode() {
        return !!this.employeeId;
    }
    get canAssignSensitiveRoles() {
        return this.auth.role() === 'developer';
    }
    get canManageProtectedFlags() {
        const role = this.auth.role();
        return role === 'developer' || role === 'owner';
    }
    ngOnInit() {
        this.employeeId = this.route.snapshot.paramMap.get('id');
        if (this.employeeId) {
            void this.loadEmployee(this.employeeId);
        }
        this.form.controls.role.valueChanges.subscribe((role) => {
            if (role === 'admin' || role === 'developer' || role === 'owner') {
                this.form.patchValue({
                    canViewStock: true,
                    canManageStock: true,
                    canManageEmployees: true,
                    canManageInvoices: true,
                    canManageQuotes: true,
                    canManageClients: true,
                    canManageSalary: true
                });
            }
        });
    }
    async submit() {
        this.error = '';
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const raw = this.form.getRawValue();
        if (raw.initialPassword && raw.initialPassword.length > 0 && raw.initialPassword.length < 10) {
            this.error = 'Le mot de passe doit contenir au moins 10 caracteres.';
            return;
        }
        const payload = {
            nom: raw.nom?.trim() ?? '',
            telephone: raw.telephone?.trim() ?? '',
            email: raw.email?.trim().toLowerCase() ?? '',
            adresse: raw.adresse?.trim() ?? '',
            poste: raw.poste?.trim() ?? '',
            salaireBase: Number(raw.salaireBase ?? 0),
            dateEmbauche: raw.dateEmbauche ? raw.dateEmbauche : null,
            actif: !!raw.actif,
            isActive: !!raw.isActive,
            username: raw.username?.trim().toLowerCase() ?? '',
            role: raw.role === 'developer'
                ? 'developer'
                : raw.role === 'owner'
                    ? 'owner'
                    : raw.role === 'admin'
                        ? 'admin'
                        : 'employee',
            requiresEmail2fa: !!raw.requiresEmail2fa,
            mustSetupPassword: !!raw.mustSetupPassword,
            canViewStock: !!raw.canViewStock,
            canManageStock: !!raw.canManageStock,
            canManageEmployees: !!raw.canManageEmployees,
            canManageInvoices: !!raw.canManageInvoices,
            canManageQuotes: !!raw.canManageQuotes,
            canManageClients: !!raw.canManageClients,
            canManageSalary: !!raw.canManageSalary
        };
        if (raw.initialPassword?.trim()) {
            payload.initialPassword = raw.initialPassword.trim();
        }
        this.saving = true;
        try {
            const saved = this.employeeId
                ? await this.employeesRepository.update(this.employeeId, payload)
                : await this.employeesRepository.create(payload);
            if (!saved) {
                this.error = 'Enregistrement impossible.';
                return;
            }
            await this.router.navigate(['/employees']);
        }
        catch {
            this.error = 'Une erreur est survenue pendant lenregistrement.';
        }
        finally {
            this.saving = false;
        }
    }
    async loadEmployee(id) {
        this.loading = true;
        this.error = '';
        try {
            const employee = await this.employeesRepository.getById(id);
            if (!employee) {
                this.error = 'Salarie introuvable.';
                return;
            }
            this.patchForm(employee);
        }
        catch {
            this.error = 'Chargement impossible.';
        }
        finally {
            this.loading = false;
        }
    }
    patchForm(employee) {
        this.form.patchValue({
            nom: employee.nom,
            telephone: employee.telephone,
            email: employee.email,
            adresse: employee.adresse,
            poste: employee.poste,
            salaireBase: employee.salaireBase,
            dateEmbauche: employee.dateEmbauche ?? '',
            actif: employee.actif,
            isActive: employee.isActive,
            username: employee.username,
            initialPassword: '',
            mustSetupPassword: employee.mustSetupPassword,
            requiresEmail2fa: employee.requiresEmail2fa,
            role: employee.role,
            canViewStock: employee.canViewStock,
            canManageStock: employee.canManageStock,
            canManageEmployees: employee.canManageEmployees,
            canManageInvoices: employee.canManageInvoices,
            canManageQuotes: employee.canManageQuotes,
            canManageClients: employee.canManageClients,
            canManageSalary: employee.canManageSalary
        });
    }
    static { this.ɵfac = function EmployeeFormComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || EmployeeFormComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i2.ActivatedRoute), i0.ɵɵdirectiveInject(i2.Router), i0.ɵɵdirectiveInject(i3.EmployeesRepository), i0.ɵɵdirectiveInject(i4.AuthService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: EmployeeFormComponent, selectors: [["app-employee-form"]], decls: 11, vars: 2, consts: [[1, "panel"], [1, "panel-header"], [1, "actions"], ["routerLink", "/employees", 1, "btn", "ghost"], ["class", "card", 4, "ngIf"], [1, "card"], [1, "form", 3, "ngSubmit", "formGroup"], [1, "grid-3"], [1, "field"], ["type", "text", "formControlName", "nom", 1, "input"], ["type", "text", "formControlName", "telephone", 1, "input"], ["type", "email", "formControlName", "email", 1, "input"], ["type", "text", "formControlName", "poste", 1, "input"], ["type", "text", "formControlName", "adresse", 1, "input"], ["type", "number", "min", "0", "step", "0.01", "formControlName", "salaireBase", 1, "input"], ["type", "date", "formControlName", "dateEmbauche", 1, "input"], ["formControlName", "role", 1, "input"], ["value", "developer", 4, "ngIf"], ["value", "owner", 4, "ngIf"], ["value", "admin"], ["value", "employee"], [1, "field", "checkbox"], ["type", "checkbox", "formControlName", "isActive"], ["type", "checkbox", "formControlName", "actif"], [1, "grid-2"], ["type", "text", "formControlName", "username", "autocomplete", "username", 1, "input"], ["type", "password", "formControlName", "initialPassword", "autocomplete", "new-password", 1, "input"], ["type", "checkbox", "formControlName", "mustSetupPassword", 3, "disabled"], ["type", "checkbox", "formControlName", "requiresEmail2fa", 3, "disabled"], [1, "permissions"], ["type", "checkbox", "formControlName", "canViewStock"], ["type", "checkbox", "formControlName", "canManageStock"], ["type", "checkbox", "formControlName", "canManageEmployees"], ["type", "checkbox", "formControlName", "canManageInvoices"], ["type", "checkbox", "formControlName", "canManageQuotes"], ["type", "checkbox", "formControlName", "canManageClients"], ["type", "checkbox", "formControlName", "canManageSalary"], ["class", "error", 4, "ngIf"], ["type", "button", "routerLink", "/employees", 1, "btn", "ghost"], ["type", "submit", 1, "btn", "primary", 3, "disabled"], ["value", "developer"], ["value", "owner"], [1, "error"]], template: function EmployeeFormComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "Creation de compte, role et permissions ERP.");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(7, "div", 2)(8, "a", 3);
            i0.ɵɵtext(9, "Retour");
            i0.ɵɵelementEnd()()();
            i0.ɵɵtemplate(10, EmployeeFormComponent_section_10_Template, 107, 9, "section", 4);
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵadvance(4);
            i0.ɵɵtextInterpolate(ctx.isEditMode ? "Modifier salarie" : "Nouveau salarie");
            i0.ɵɵadvance(6);
            i0.ɵɵproperty("ngIf", !ctx.loading);
        } }, dependencies: [CommonModule, i5.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.NgSelectOption, i1.ɵNgSelectMultipleOption, i1.DefaultValueAccessor, i1.NumberValueAccessor, i1.CheckboxControlValueAccessor, i1.SelectControlValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.MinValidator, i1.FormGroupDirective, i1.FormControlName, RouterLink], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 16px;\n}\n\n.form[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}\n\n.permissions[_ngcontent-%COMP%] {\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 12px;\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 10px;\n}\n\n.permissions[_ngcontent-%COMP%]   legend[_ngcontent-%COMP%] {\n  padding: 0 6px;\n  color: var(--muted);\n}\n\n.permissions[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: inline-flex;\n  gap: 8px;\n  align-items: center;\n}\n\n.actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.error[_ngcontent-%COMP%] {\n  color: var(--danger);\n}\n\n@media (max-width: 980px) {\n  .permissions[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(EmployeeFormComponent, [{
        type: Component,
        args: [{ selector: 'app-employee-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: "<section class=\"panel\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>{{ isEditMode ? 'Modifier salarie' : 'Nouveau salarie' }}</h1>\n      <p>Creation de compte, role et permissions ERP.</p>\n    </div>\n    <div class=\"actions\">\n      <a class=\"btn ghost\" routerLink=\"/employees\">Retour</a>\n    </div>\n  </div>\n\n  <section class=\"card\" *ngIf=\"!loading\">\n    <form [formGroup]=\"form\" (ngSubmit)=\"submit()\" class=\"form\">\n      <div class=\"grid-3\">\n        <label class=\"field\">\n          <span>Nom</span>\n          <input class=\"input\" type=\"text\" formControlName=\"nom\" />\n        </label>\n        <label class=\"field\">\n          <span>Telephone</span>\n          <input class=\"input\" type=\"text\" formControlName=\"telephone\" />\n        </label>\n        <label class=\"field\">\n          <span>Email</span>\n          <input class=\"input\" type=\"email\" formControlName=\"email\" />\n        </label>\n      </div>\n\n      <div class=\"grid-3\">\n        <label class=\"field\">\n          <span>Poste</span>\n          <input class=\"input\" type=\"text\" formControlName=\"poste\" />\n        </label>\n        <label class=\"field\">\n          <span>Adresse</span>\n          <input class=\"input\" type=\"text\" formControlName=\"adresse\" />\n        </label>\n        <label class=\"field\">\n          <span>Salaire de base</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"0.01\" formControlName=\"salaireBase\" />\n        </label>\n      </div>\n\n      <div class=\"grid-3\">\n        <label class=\"field\">\n          <span>Date embauche</span>\n          <input class=\"input\" type=\"date\" formControlName=\"dateEmbauche\" />\n        </label>\n        <label class=\"field\">\n          <span>Role</span>\n          <select class=\"input\" formControlName=\"role\">\n            <option value=\"developer\" *ngIf=\"canAssignSensitiveRoles\">developer</option>\n            <option value=\"owner\" *ngIf=\"canAssignSensitiveRoles\">owner</option>\n            <option value=\"admin\">admin</option>\n            <option value=\"employee\">employee</option>\n          </select>\n        </label>\n        <label class=\"field checkbox\">\n          <span>Actif logiciel</span>\n          <label><input type=\"checkbox\" formControlName=\"isActive\" /> Actif</label>\n        </label>\n        <label class=\"field checkbox\">\n          <span>Actif RH</span>\n          <label><input type=\"checkbox\" formControlName=\"actif\" /> Actif</label>\n        </label>\n      </div>\n\n      <div class=\"grid-2\">\n        <label class=\"field\">\n          <span>Username</span>\n          <input class=\"input\" type=\"text\" formControlName=\"username\" autocomplete=\"username\" />\n        </label>\n        <label class=\"field\">\n          <span>{{ isEditMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe initial' }}</span>\n          <input class=\"input\" type=\"password\" formControlName=\"initialPassword\" autocomplete=\"new-password\" />\n        </label>\n      </div>\n\n      <div class=\"grid-2\">\n        <label class=\"field checkbox\">\n          <span>Force setup password</span>\n          <label><input type=\"checkbox\" formControlName=\"mustSetupPassword\" [disabled]=\"!canManageProtectedFlags\" /> Oui</label>\n        </label>\n        <label class=\"field checkbox\">\n          <span>2FA email</span>\n          <label><input type=\"checkbox\" formControlName=\"requiresEmail2fa\" [disabled]=\"!canManageProtectedFlags\" /> Obligatoire</label>\n        </label>\n      </div>\n\n      <fieldset class=\"permissions\">\n        <legend>Permissions</legend>\n        <label><input type=\"checkbox\" formControlName=\"canViewStock\" /> Voir stock</label>\n        <label><input type=\"checkbox\" formControlName=\"canManageStock\" /> Modifier stock</label>\n        <label><input type=\"checkbox\" formControlName=\"canManageEmployees\" /> Gerer salaries</label>\n        <label><input type=\"checkbox\" formControlName=\"canManageInvoices\" /> Gerer factures</label>\n        <label><input type=\"checkbox\" formControlName=\"canManageQuotes\" /> Gerer devis</label>\n        <label><input type=\"checkbox\" formControlName=\"canManageClients\" /> Gerer clients</label>\n        <label><input type=\"checkbox\" formControlName=\"canManageSalary\" /> Gerer salaires</label>\n      </fieldset>\n\n      <div class=\"error\" *ngIf=\"error\">{{ error }}</div>\n\n      <div class=\"actions\">\n        <button class=\"btn ghost\" type=\"button\" routerLink=\"/employees\">Annuler</button>\n        <button class=\"btn primary\" type=\"submit\" [disabled]=\"saving\">\n          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}\n        </button>\n      </div>\n    </form>\n  </section>\n</section>\n", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 16px;\n}\n\n.form {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n}\n\n.permissions {\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 12px;\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 10px;\n}\n\n.permissions legend {\n  padding: 0 6px;\n  color: var(--muted);\n}\n\n.permissions label {\n  display: inline-flex;\n  gap: 8px;\n  align-items: center;\n}\n\n.actions {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.error {\n  color: var(--danger);\n}\n\n@media (max-width: 980px) {\n  .permissions {\n    grid-template-columns: 1fr;\n  }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i2.ActivatedRoute }, { type: i2.Router }, { type: i3.EmployeesRepository }, { type: i4.AuthService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(EmployeeFormComponent, { className: "EmployeeFormComponent", filePath: "src/app/components/employees/employee-form.component.ts", lineNumber: 16 }); })();
