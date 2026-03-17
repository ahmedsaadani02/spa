import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "@angular/router";
import * as i3 from "../../repositories/employees.repository";
import * as i4 from "../../repositories/salary-advances.repository";
import * as i5 from "../../repositories/salary-bonuses.repository";
import * as i6 from "../../services/salary-summary.service";
import * as i7 from "../../services/auth.service";
import * as i8 from "@angular/common";
const _c0 = a0 => ["/employees", a0, "edit"];
function EmployeeDetailComponent_section_0_p_5_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate2("", ctx_r1.employee.nom, " - ", ctx_r1.employee.poste || "N/A");
} }
function EmployeeDetailComponent_section_0_a_9_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 27);
    i0.ɵɵtext(1, "Modifier");
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵproperty("routerLink", i0.ɵɵpureFunction1(1, _c0, ctx_r1.employee.id));
} }
function EmployeeDetailComponent_section_0_div_10_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 28);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.error);
} }
function EmployeeDetailComponent_section_0_section_11_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "section", 9)(1, "div", 29)(2, "div")(3, "strong");
    i0.ɵɵtext(4, "Username:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "div")(7, "strong");
    i0.ɵɵtext(8, "Email:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(9);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "div")(11, "strong");
    i0.ɵɵtext(12, "Role:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(13);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "div")(15, "strong");
    i0.ɵɵtext(16, "Actif:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(17);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(18, "div")(19, "strong");
    i0.ɵɵtext(20, "Actif logiciel:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(21);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(22, "div")(23, "strong");
    i0.ɵɵtext(24, "Compte protege:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(25);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(26, "div")(27, "strong");
    i0.ɵɵtext(28, "Salaire base:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(29);
    i0.ɵɵpipe(30, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(31, "div")(32, "strong");
    i0.ɵɵtext(33, "Stock view:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(34);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(35, "div")(36, "strong");
    i0.ɵɵtext(37, "Stock manage:");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(38);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.username || "-");
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.email || "-");
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.role);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.actif ? "Oui" : "Non");
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.isActive ? "Oui" : "Non");
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.isProtectedAccount ? "Oui" : "Non");
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", i0.ɵɵpipeBind2(30, 9, ctx_r1.employee.salaireBase, "1.2-2"));
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.canViewStock ? "Oui" : "Non");
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.employee.canManageStock ? "Oui" : "Non");
} }
function EmployeeDetailComponent_section_0_section_24_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "section", 30)(1, "div", 31)(2, "span");
    i0.ɵɵtext(3, "Salaire base");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "strong");
    i0.ɵɵtext(5);
    i0.ɵɵpipe(6, "number");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(7, "div", 31)(8, "span");
    i0.ɵɵtext(9, "Total avances");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "strong");
    i0.ɵɵtext(11);
    i0.ɵɵpipe(12, "number");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(13, "div", 31)(14, "span");
    i0.ɵɵtext(15, "Total primes");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(16, "strong");
    i0.ɵɵtext(17);
    i0.ɵɵpipe(18, "number");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(19, "div", 32)(20, "span");
    i0.ɵɵtext(21, "Reste a payer");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(22, "strong");
    i0.ɵɵtext(23);
    i0.ɵɵpipe(24, "number");
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(6, 4, ctx_r1.summary.salaireBase, "1.2-2"));
    i0.ɵɵadvance(6);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(12, 7, ctx_r1.summary.totalAdvances, "1.2-2"));
    i0.ɵɵadvance(6);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(18, 10, ctx_r1.summary.totalBonuses, "1.2-2"));
    i0.ɵɵadvance(6);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(24, 13, ctx_r1.summary.resteAPayer, "1.2-2"));
} }
function EmployeeDetailComponent_section_0_div_36_Template(rf, ctx) { if (rf & 1) {
    const _r3 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 33)(1, "span");
    i0.ɵɵtext(2);
    i0.ɵɵpipe(3, "date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "span");
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "span", 34);
    i0.ɵɵtext(7);
    i0.ɵɵpipe(8, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "button", 35);
    i0.ɵɵlistener("click", function EmployeeDetailComponent_section_0_div_36_Template_button_click_9_listener() { const item_r4 = i0.ɵɵrestoreView(_r3).$implicit; const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.deleteAdvance(item_r4)); });
    i0.ɵɵtext(10, "Supprimer");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const item_r4 = ctx.$implicit;
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(3, 3, item_r4.dateAvance, "dd/MM/yyyy"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(item_r4.note || "-");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(8, 6, item_r4.montant, "1.2-2"));
} }
function EmployeeDetailComponent_section_0_div_37_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 36);
    i0.ɵɵtext(1, "Aucune avance pour cette periode.");
    i0.ɵɵelementEnd();
} }
function EmployeeDetailComponent_section_0_div_48_Template(rf, ctx) { if (rf & 1) {
    const _r5 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 33)(1, "span");
    i0.ɵɵtext(2);
    i0.ɵɵpipe(3, "date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "span");
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "span", 34);
    i0.ɵɵtext(7);
    i0.ɵɵpipe(8, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "button", 35);
    i0.ɵɵlistener("click", function EmployeeDetailComponent_section_0_div_48_Template_button_click_9_listener() { const item_r6 = i0.ɵɵrestoreView(_r5).$implicit; const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.deleteBonus(item_r6)); });
    i0.ɵɵtext(10, "Supprimer");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const item_r6 = ctx.$implicit;
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(3, 3, item_r6.datePrime, "dd/MM/yyyy"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(item_r6.motif || "-");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(8, 6, item_r6.montant, "1.2-2"));
} }
function EmployeeDetailComponent_section_0_div_49_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 36);
    i0.ɵɵtext(1, "Aucune prime pour cette periode.");
    i0.ɵɵelementEnd();
} }
function EmployeeDetailComponent_section_0_section_50_div_7_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 28);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.resetPasswordError);
} }
function EmployeeDetailComponent_section_0_section_50_div_8_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 41);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.resetPasswordSuccess);
} }
function EmployeeDetailComponent_section_0_section_50_Template(rf, ctx) { if (rf & 1) {
    const _r7 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "section", 9)(1, "h2");
    i0.ɵɵtext(2, "Reinitialiser mot de passe");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "form", 37);
    i0.ɵɵlistener("ngSubmit", function EmployeeDetailComponent_section_0_section_50_Template_form_ngSubmit_3_listener() { i0.ɵɵrestoreView(_r7); const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.resetPassword()); });
    i0.ɵɵelement(4, "input", 38);
    i0.ɵɵelementStart(5, "button", 39);
    i0.ɵɵtext(6, "Reinitialiser");
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(7, EmployeeDetailComponent_section_0_section_50_div_7_Template, 2, 1, "div", 7)(8, EmployeeDetailComponent_section_0_section_50_div_8_Template, 2, 1, "div", 40);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("formGroup", ctx_r1.resetPasswordForm);
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("ngIf", ctx_r1.resetPasswordError);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.resetPasswordSuccess);
} }
function EmployeeDetailComponent_section_0_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "section", 1)(1, "div", 2)(2, "div")(3, "h1");
    i0.ɵɵtext(4, "Detail salarie");
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(5, EmployeeDetailComponent_section_0_p_5_Template, 2, 2, "p", 3);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "div", 4)(7, "a", 5);
    i0.ɵɵtext(8, "Retour");
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(9, EmployeeDetailComponent_section_0_a_9_Template, 2, 3, "a", 6);
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(10, EmployeeDetailComponent_section_0_div_10_Template, 2, 1, "div", 7)(11, EmployeeDetailComponent_section_0_section_11_Template, 39, 12, "section", 8);
    i0.ɵɵelementStart(12, "section", 9)(13, "form", 10)(14, "label", 11)(15, "span");
    i0.ɵɵtext(16, "Mois");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(17, "input", 12);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(18, "label", 11)(19, "span");
    i0.ɵɵtext(20, "Annee");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(21, "input", 13);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(22, "button", 14);
    i0.ɵɵlistener("click", function EmployeeDetailComponent_section_0_Template_button_click_22_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.reloadPeriod()); });
    i0.ɵɵtext(23, "Recharger");
    i0.ɵɵelementEnd()()();
    i0.ɵɵtemplate(24, EmployeeDetailComponent_section_0_section_24_Template, 25, 16, "section", 15);
    i0.ɵɵelementStart(25, "section", 16)(26, "div", 9)(27, "h2");
    i0.ɵɵtext(28, "Avances");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(29, "form", 17);
    i0.ɵɵlistener("ngSubmit", function EmployeeDetailComponent_section_0_Template_form_ngSubmit_29_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.addAdvance()); });
    i0.ɵɵelement(30, "input", 18)(31, "input", 19)(32, "input", 20);
    i0.ɵɵelementStart(33, "button", 21);
    i0.ɵɵtext(34, "Ajouter avance");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(35, "div", 22);
    i0.ɵɵtemplate(36, EmployeeDetailComponent_section_0_div_36_Template, 11, 9, "div", 23)(37, EmployeeDetailComponent_section_0_div_37_Template, 2, 0, "div", 24);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(38, "div", 9)(39, "h2");
    i0.ɵɵtext(40, "Primes");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(41, "form", 17);
    i0.ɵɵlistener("ngSubmit", function EmployeeDetailComponent_section_0_Template_form_ngSubmit_41_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.addBonus()); });
    i0.ɵɵelement(42, "input", 18)(43, "input", 25)(44, "input", 26);
    i0.ɵɵelementStart(45, "button", 21);
    i0.ɵɵtext(46, "Ajouter prime");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(47, "div", 22);
    i0.ɵɵtemplate(48, EmployeeDetailComponent_section_0_div_48_Template, 11, 9, "div", 23)(49, EmployeeDetailComponent_section_0_div_49_Template, 2, 0, "div", 24);
    i0.ɵɵelementEnd()()();
    i0.ɵɵtemplate(50, EmployeeDetailComponent_section_0_section_50_Template, 9, 3, "section", 8);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance(5);
    i0.ɵɵproperty("ngIf", ctx_r1.employee);
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("ngIf", ctx_r1.employee && ctx_r1.canManageEmployees);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.error);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.employee);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("formGroup", ctx_r1.periodForm);
    i0.ɵɵadvance(11);
    i0.ɵɵproperty("ngIf", ctx_r1.summary);
    i0.ɵɵadvance(5);
    i0.ɵɵproperty("formGroup", ctx_r1.advanceForm);
    i0.ɵɵadvance(7);
    i0.ɵɵproperty("ngForOf", ctx_r1.advances);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.advances.length === 0);
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("formGroup", ctx_r1.bonusForm);
    i0.ɵɵadvance(7);
    i0.ɵɵproperty("ngForOf", ctx_r1.bonuses);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.bonuses.length === 0);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.canManageEmployees);
} }
export class EmployeeDetailComponent {
    constructor(fb, route, employeesRepository, salaryAdvancesRepository, salaryBonusesRepository, salarySummaryService, authService) {
        this.fb = fb;
        this.route = route;
        this.employeesRepository = employeesRepository;
        this.salaryAdvancesRepository = salaryAdvancesRepository;
        this.salaryBonusesRepository = salaryBonusesRepository;
        this.salarySummaryService = salarySummaryService;
        this.authService = authService;
        this.employeeId = '';
        this.employee = null;
        this.summary = null;
        this.advances = [];
        this.bonuses = [];
        this.loading = false;
        this.error = '';
        this.resetPasswordError = '';
        this.resetPasswordSuccess = '';
        this.periodForm = this.fb.group({
            month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
            year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]]
        });
        this.advanceForm = this.fb.group({
            montant: [0, [Validators.required, Validators.min(0.01)]],
            note: [''],
            dateAvance: [new Date().toISOString().slice(0, 10), Validators.required]
        });
        this.bonusForm = this.fb.group({
            montant: [0, [Validators.required, Validators.min(0.01)]],
            motif: [''],
            datePrime: [new Date().toISOString().slice(0, 10), Validators.required]
        });
        this.resetPasswordForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(10)]]
        });
    }
    get canManageEmployees() {
        return this.authService.hasPermission('manageEmployees');
    }
    get month() {
        return Number(this.periodForm.controls.month.value ?? new Date().getMonth() + 1);
    }
    get year() {
        return Number(this.periodForm.controls.year.value ?? new Date().getFullYear());
    }
    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.error = 'Identifiant salarie manquant.';
            return;
        }
        this.employeeId = id;
        await this.loadAll();
    }
    async reloadPeriod() {
        await this.loadFinanceData();
    }
    async addAdvance() {
        if (!this.employeeId || this.advanceForm.invalid) {
            this.advanceForm.markAllAsTouched();
            return;
        }
        const raw = this.advanceForm.getRawValue();
        await this.salaryAdvancesRepository.create({
            employeeId: this.employeeId,
            montant: Number(raw.montant ?? 0),
            note: raw.note ?? '',
            dateAvance: raw.dateAvance ?? undefined,
            moisReference: this.month,
            anneeReference: this.year
        });
        this.advanceForm.patchValue({ montant: 0, note: '' });
        await this.loadFinanceData();
    }
    async deleteAdvance(advance) {
        await this.salaryAdvancesRepository.delete(advance.id);
        await this.loadFinanceData();
    }
    async addBonus() {
        if (!this.employeeId || this.bonusForm.invalid) {
            this.bonusForm.markAllAsTouched();
            return;
        }
        const raw = this.bonusForm.getRawValue();
        await this.salaryBonusesRepository.create({
            employeeId: this.employeeId,
            montant: Number(raw.montant ?? 0),
            motif: raw.motif ?? '',
            datePrime: raw.datePrime ?? undefined,
            moisReference: this.month,
            anneeReference: this.year
        });
        this.bonusForm.patchValue({ montant: 0, motif: '' });
        await this.loadFinanceData();
    }
    async deleteBonus(bonus) {
        await this.salaryBonusesRepository.delete(bonus.id);
        await this.loadFinanceData();
    }
    async resetPassword() {
        this.resetPasswordError = '';
        this.resetPasswordSuccess = '';
        if (!this.employeeId || this.resetPasswordForm.invalid) {
            this.resetPasswordForm.markAllAsTouched();
            return;
        }
        const raw = this.resetPasswordForm.getRawValue();
        const ok = await this.authService.resetPassword(this.employeeId, raw.newPassword ?? '');
        if (!ok) {
            this.resetPasswordError = 'Reinitialisation impossible.';
            return;
        }
        this.resetPasswordForm.reset({ newPassword: '' });
        this.resetPasswordSuccess = 'Mot de passe reinitialise.';
    }
    async loadAll() {
        this.loading = true;
        this.error = '';
        try {
            this.employee = await this.employeesRepository.getById(this.employeeId);
            if (!this.employee) {
                this.error = 'Salarie introuvable.';
                return;
            }
            await this.loadFinanceData();
        }
        catch {
            this.error = 'Chargement impossible.';
        }
        finally {
            this.loading = false;
        }
    }
    async loadFinanceData() {
        this.advances = await this.salaryAdvancesRepository.listByEmployee(this.employeeId, this.month, this.year);
        this.bonuses = await this.salaryBonusesRepository.listByEmployee(this.employeeId, this.month, this.year);
        this.summary = await this.salarySummaryService.getEmployeeSalarySummary(this.employeeId, this.month, this.year);
    }
    static { this.ɵfac = function EmployeeDetailComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || EmployeeDetailComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i2.ActivatedRoute), i0.ɵɵdirectiveInject(i3.EmployeesRepository), i0.ɵɵdirectiveInject(i4.SalaryAdvancesRepository), i0.ɵɵdirectiveInject(i5.SalaryBonusesRepository), i0.ɵɵdirectiveInject(i6.SalarySummaryService), i0.ɵɵdirectiveInject(i7.AuthService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: EmployeeDetailComponent, selectors: [["app-employee-detail"]], decls: 1, vars: 1, consts: [["class", "panel", 4, "ngIf"], [1, "panel"], [1, "panel-header"], [4, "ngIf"], [1, "actions"], ["routerLink", "/employees", 1, "btn", "ghost"], ["class", "btn outline", 3, "routerLink", 4, "ngIf"], ["class", "error", 4, "ngIf"], ["class", "card", 4, "ngIf"], [1, "card"], [1, "period", 3, "formGroup"], [1, "field"], ["type", "number", "min", "1", "max", "12", "formControlName", "month", 1, "input"], ["type", "number", "min", "2020", "formControlName", "year", 1, "input"], ["type", "button", 1, "btn", "outline", 3, "click"], ["class", "cards-4", 4, "ngIf"], [1, "grid-2"], [1, "inline-form", 3, "ngSubmit", "formGroup"], ["type", "number", "min", "0.01", "step", "0.01", "formControlName", "montant", "placeholder", "Montant", 1, "input"], ["type", "date", "formControlName", "dateAvance", 1, "input"], ["type", "text", "formControlName", "note", "placeholder", "Note", 1, "input"], ["type", "submit", 1, "btn", "primary"], [1, "list"], ["class", "list-row", 4, "ngFor", "ngForOf"], ["class", "empty", 4, "ngIf"], ["type", "date", "formControlName", "datePrime", 1, "input"], ["type", "text", "formControlName", "motif", "placeholder", "Motif", 1, "input"], [1, "btn", "outline", 3, "routerLink"], [1, "error"], [1, "grid-3", "identity"], [1, "cards-4"], [1, "card", "metric"], [1, "card", "metric", "rest"], [1, "list-row"], [1, "mono"], ["type", "button", 1, "btn", "danger", 3, "click"], [1, "empty"], [1, "reset-row", 3, "ngSubmit", "formGroup"], ["type", "password", "formControlName", "newPassword", "placeholder", "Nouveau mot de passe (min 10)", 1, "input"], ["type", "submit", 1, "btn", "outline"], ["class", "success", 4, "ngIf"], [1, "success"]], template: function EmployeeDetailComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵtemplate(0, EmployeeDetailComponent_section_0_Template, 51, 13, "section", 0);
        } if (rf & 2) {
            i0.ɵɵproperty("ngIf", !ctx.loading);
        } }, dependencies: [CommonModule, i8.NgForOf, i8.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.DefaultValueAccessor, i1.NumberValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.MinValidator, i1.MaxValidator, i1.FormGroupDirective, i1.FormControlName, RouterLink, i8.DecimalPipe, i8.DatePipe], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 16px;\n}\n\n.actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.period[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: flex-end;\n  flex-wrap: wrap;\n}\n\n.cards-4[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 12px;\n}\n\n.metric[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.metric.rest[_ngcontent-%COMP%] {\n  border-color: var(--accent);\n  background: var(--accent-soft);\n}\n\n.inline-form[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr 0.9fr 1.2fr auto;\n  gap: 8px;\n  margin-bottom: 10px;\n}\n\n.list[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.list-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr 1.2fr 0.8fr auto;\n  align-items: center;\n  gap: 8px;\n  border-bottom: 1px solid var(--border);\n  padding: 8px 0;\n}\n\n.reset-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr auto;\n  gap: 8px;\n}\n\n.error[_ngcontent-%COMP%] {\n  color: var(--danger);\n}\n\n.success[_ngcontent-%COMP%] {\n  color: var(--accent);\n}\n\n.empty[_ngcontent-%COMP%] {\n  color: var(--muted);\n  padding: 6px 0;\n}\n\n@media (max-width: 1100px) {\n  .cards-4[_ngcontent-%COMP%] {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .inline-form[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .list-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(EmployeeDetailComponent, [{
        type: Component,
        args: [{ selector: 'app-employee-detail', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: "<section class=\"panel\" *ngIf=\"!loading\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Detail salarie</h1>\n      <p *ngIf=\"employee\">{{ employee.nom }} - {{ employee.poste || 'N/A' }}</p>\n    </div>\n    <div class=\"actions\">\n      <a class=\"btn ghost\" routerLink=\"/employees\">Retour</a>\n      <a class=\"btn outline\" *ngIf=\"employee && canManageEmployees\" [routerLink]=\"['/employees', employee.id, 'edit']\">Modifier</a>\n    </div>\n  </div>\n\n  <div class=\"error\" *ngIf=\"error\">{{ error }}</div>\n\n  <section class=\"card\" *ngIf=\"employee\">\n    <div class=\"grid-3 identity\">\n      <div><strong>Username:</strong> {{ employee.username || '-' }}</div>\n      <div><strong>Email:</strong> {{ employee.email || '-' }}</div>\n      <div><strong>Role:</strong> {{ employee.role }}</div>\n      <div><strong>Actif:</strong> {{ employee.actif ? 'Oui' : 'Non' }}</div>\n      <div><strong>Actif logiciel:</strong> {{ employee.isActive ? 'Oui' : 'Non' }}</div>\n      <div><strong>Compte protege:</strong> {{ employee.isProtectedAccount ? 'Oui' : 'Non' }}</div>\n      <div><strong>Salaire base:</strong> {{ employee.salaireBase | number:'1.2-2' }}</div>\n      <div><strong>Stock view:</strong> {{ employee.canViewStock ? 'Oui' : 'Non' }}</div>\n      <div><strong>Stock manage:</strong> {{ employee.canManageStock ? 'Oui' : 'Non' }}</div>\n    </div>\n  </section>\n\n  <section class=\"card\">\n    <form [formGroup]=\"periodForm\" class=\"period\">\n      <label class=\"field\">\n        <span>Mois</span>\n        <input class=\"input\" type=\"number\" min=\"1\" max=\"12\" formControlName=\"month\" />\n      </label>\n      <label class=\"field\">\n        <span>Annee</span>\n        <input class=\"input\" type=\"number\" min=\"2020\" formControlName=\"year\" />\n      </label>\n      <button class=\"btn outline\" type=\"button\" (click)=\"reloadPeriod()\">Recharger</button>\n    </form>\n  </section>\n\n  <section class=\"cards-4\" *ngIf=\"summary\">\n    <div class=\"card metric\">\n      <span>Salaire base</span>\n      <strong>{{ summary.salaireBase | number:'1.2-2' }}</strong>\n    </div>\n    <div class=\"card metric\">\n      <span>Total avances</span>\n      <strong>{{ summary.totalAdvances | number:'1.2-2' }}</strong>\n    </div>\n    <div class=\"card metric\">\n      <span>Total primes</span>\n      <strong>{{ summary.totalBonuses | number:'1.2-2' }}</strong>\n    </div>\n    <div class=\"card metric rest\">\n      <span>Reste a payer</span>\n      <strong>{{ summary.resteAPayer | number:'1.2-2' }}</strong>\n    </div>\n  </section>\n\n  <section class=\"grid-2\">\n    <div class=\"card\">\n      <h2>Avances</h2>\n      <form [formGroup]=\"advanceForm\" (ngSubmit)=\"addAdvance()\" class=\"inline-form\">\n        <input class=\"input\" type=\"number\" min=\"0.01\" step=\"0.01\" formControlName=\"montant\" placeholder=\"Montant\" />\n        <input class=\"input\" type=\"date\" formControlName=\"dateAvance\" />\n        <input class=\"input\" type=\"text\" formControlName=\"note\" placeholder=\"Note\" />\n        <button class=\"btn primary\" type=\"submit\">Ajouter avance</button>\n      </form>\n\n      <div class=\"list\">\n        <div class=\"list-row\" *ngFor=\"let item of advances\">\n          <span>{{ item.dateAvance | date:'dd/MM/yyyy' }}</span>\n          <span>{{ item.note || '-' }}</span>\n          <span class=\"mono\">{{ item.montant | number:'1.2-2' }}</span>\n          <button class=\"btn danger\" type=\"button\" (click)=\"deleteAdvance(item)\">Supprimer</button>\n        </div>\n        <div class=\"empty\" *ngIf=\"advances.length === 0\">Aucune avance pour cette periode.</div>\n      </div>\n    </div>\n\n    <div class=\"card\">\n      <h2>Primes</h2>\n      <form [formGroup]=\"bonusForm\" (ngSubmit)=\"addBonus()\" class=\"inline-form\">\n        <input class=\"input\" type=\"number\" min=\"0.01\" step=\"0.01\" formControlName=\"montant\" placeholder=\"Montant\" />\n        <input class=\"input\" type=\"date\" formControlName=\"datePrime\" />\n        <input class=\"input\" type=\"text\" formControlName=\"motif\" placeholder=\"Motif\" />\n        <button class=\"btn primary\" type=\"submit\">Ajouter prime</button>\n      </form>\n\n      <div class=\"list\">\n        <div class=\"list-row\" *ngFor=\"let item of bonuses\">\n          <span>{{ item.datePrime | date:'dd/MM/yyyy' }}</span>\n          <span>{{ item.motif || '-' }}</span>\n          <span class=\"mono\">{{ item.montant | number:'1.2-2' }}</span>\n          <button class=\"btn danger\" type=\"button\" (click)=\"deleteBonus(item)\">Supprimer</button>\n        </div>\n        <div class=\"empty\" *ngIf=\"bonuses.length === 0\">Aucune prime pour cette periode.</div>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"card\" *ngIf=\"canManageEmployees\">\n    <h2>Reinitialiser mot de passe</h2>\n    <form [formGroup]=\"resetPasswordForm\" (ngSubmit)=\"resetPassword()\" class=\"reset-row\">\n      <input class=\"input\" type=\"password\" formControlName=\"newPassword\" placeholder=\"Nouveau mot de passe (min 10)\" />\n      <button class=\"btn outline\" type=\"submit\">Reinitialiser</button>\n    </form>\n    <div class=\"error\" *ngIf=\"resetPasswordError\">{{ resetPasswordError }}</div>\n    <div class=\"success\" *ngIf=\"resetPasswordSuccess\">{{ resetPasswordSuccess }}</div>\n  </section>\n</section>\n", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 16px;\n}\n\n.actions {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.period {\n  display: flex;\n  gap: 12px;\n  align-items: flex-end;\n  flex-wrap: wrap;\n}\n\n.cards-4 {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 12px;\n}\n\n.metric {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.metric.rest {\n  border-color: var(--accent);\n  background: var(--accent-soft);\n}\n\n.inline-form {\n  display: grid;\n  grid-template-columns: 1fr 0.9fr 1.2fr auto;\n  gap: 8px;\n  margin-bottom: 10px;\n}\n\n.list {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.list-row {\n  display: grid;\n  grid-template-columns: 1fr 1.2fr 0.8fr auto;\n  align-items: center;\n  gap: 8px;\n  border-bottom: 1px solid var(--border);\n  padding: 8px 0;\n}\n\n.reset-row {\n  display: grid;\n  grid-template-columns: 1fr auto;\n  gap: 8px;\n}\n\n.error {\n  color: var(--danger);\n}\n\n.success {\n  color: var(--accent);\n}\n\n.empty {\n  color: var(--muted);\n  padding: 6px 0;\n}\n\n@media (max-width: 1100px) {\n  .cards-4 {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .inline-form {\n    grid-template-columns: 1fr;\n  }\n\n  .list-row {\n    grid-template-columns: 1fr;\n  }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i2.ActivatedRoute }, { type: i3.EmployeesRepository }, { type: i4.SalaryAdvancesRepository }, { type: i5.SalaryBonusesRepository }, { type: i6.SalarySummaryService }, { type: i7.AuthService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(EmployeeDetailComponent, { className: "EmployeeDetailComponent", filePath: "src/app/components/employees/employee-detail.component.ts", lineNumber: 19 }); })();
