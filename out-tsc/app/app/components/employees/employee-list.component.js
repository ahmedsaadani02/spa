import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "../../repositories/employees.repository";
import * as i2 from "../../services/auth.service";
import * as i3 from "@angular/common";
import * as i4 from "@angular/forms";
const _c0 = a0 => ["/employees", a0];
const _c1 = a0 => ["/employees", a0, "edit"];
function EmployeeListComponent_a_8_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 11);
    i0.ɵɵtext(1, "Nouveau salarie");
    i0.ɵɵelementEnd();
} }
function EmployeeListComponent_div_16_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 12);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.error);
} }
function EmployeeListComponent_div_17_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 13);
    i0.ɵɵtext(1, "Aucun salarie.");
    i0.ɵɵelementEnd();
} }
function EmployeeListComponent_div_18_div_22_a_30_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 26);
    i0.ɵɵtext(1, "Modifier");
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const employee_r3 = i0.ɵɵnextContext().$implicit;
    i0.ɵɵproperty("routerLink", i0.ɵɵpureFunction1(1, _c1, employee_r3.id));
} }
function EmployeeListComponent_div_18_div_22_button_31_Template(rf, ctx) { if (rf & 1) {
    const _r4 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 27);
    i0.ɵɵlistener("click", function EmployeeListComponent_div_18_div_22_button_31_Template_button_click_0_listener() { i0.ɵɵrestoreView(_r4); const employee_r3 = i0.ɵɵnextContext().$implicit; const ctx_r0 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r0.deleteEmployee(employee_r3)); });
    i0.ɵɵtext(1, "Supprimer");
    i0.ɵɵelementEnd();
} }
function EmployeeListComponent_div_18_div_22_Template(rf, ctx) { if (rf & 1) {
    const _r2 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 17)(1, "div");
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "div");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "div");
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "div");
    i0.ɵɵtext(8);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "div", 18);
    i0.ɵɵtext(10);
    i0.ɵɵpipe(11, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(12, "div", 18);
    i0.ɵɵtext(13);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "div")(15, "span", 19);
    i0.ɵɵtext(16);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(17, "div")(18, "button", 20);
    i0.ɵɵlistener("click", function EmployeeListComponent_div_18_div_22_Template_button_click_18_listener() { const employee_r3 = i0.ɵɵrestoreView(_r2).$implicit; const ctx_r0 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r0.toggleActive(employee_r3)); });
    i0.ɵɵtext(19);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(20, "div")(21, "span", 21);
    i0.ɵɵtext(22, "Voir");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(23, "span", 21);
    i0.ɵɵtext(24, "Modifier");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(25, "span", 21);
    i0.ɵɵtext(26, "Protege");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(27, "div", 22)(28, "a", 23);
    i0.ɵɵtext(29, "Voir");
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(30, EmployeeListComponent_div_18_div_22_a_30_Template, 2, 3, "a", 24)(31, EmployeeListComponent_div_18_div_22_button_31_Template, 2, 0, "button", 25);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const employee_r3 = ctx.$implicit;
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(employee_r3.nom);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(employee_r3.email || "-");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(employee_r3.telephone || "-");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(employee_r3.poste || "-");
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(11, 20, employee_r3.salaireBase, "1.2-2"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(employee_r3.username || "-");
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(employee_r3.role);
    i0.ɵɵadvance(2);
    i0.ɵɵclassProp("chip-off", !employee_r3.actif);
    i0.ɵɵproperty("disabled", !ctx_r0.canManageEmployees);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", employee_r3.actif ? "Actif" : "Inactif", " ");
    i0.ɵɵadvance(2);
    i0.ɵɵclassProp("ok", employee_r3.canViewStock);
    i0.ɵɵadvance(2);
    i0.ɵɵclassProp("ok", employee_r3.canManageStock);
    i0.ɵɵadvance(2);
    i0.ɵɵclassProp("ok", employee_r3.isProtectedAccount);
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("routerLink", i0.ɵɵpureFunction1(23, _c0, employee_r3.id));
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngIf", ctx_r0.canManageEmployees);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canManageEmployees);
} }
function EmployeeListComponent_div_18_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 14)(1, "div", 15)(2, "div");
    i0.ɵɵtext(3, "Nom");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "div");
    i0.ɵɵtext(5, "Email");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "div");
    i0.ɵɵtext(7, "Telephone");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "div");
    i0.ɵɵtext(9, "Poste");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "div");
    i0.ɵɵtext(11, "Salaire");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(12, "div");
    i0.ɵɵtext(13, "Username");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "div");
    i0.ɵɵtext(15, "Role");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(16, "div");
    i0.ɵɵtext(17, "Actif");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(18, "div");
    i0.ɵɵtext(19, "Stock");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(20, "div");
    i0.ɵɵtext(21, "Actions");
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(22, EmployeeListComponent_div_18_div_22_Template, 32, 25, "div", 16);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(22);
    i0.ɵɵproperty("ngForOf", ctx_r0.employees)("ngForTrackBy", ctx_r0.trackByEmployee);
} }
export class EmployeeListComponent {
    constructor(employeesRepository, auth) {
        this.employeesRepository = employeesRepository;
        this.auth = auth;
        this.destroy$ = new Subject();
        this.searchControl = new FormControl('', { nonNullable: true });
        this.employees = [];
        this.loading = false;
        this.error = '';
        this.trackByEmployee = (_index, employee) => employee.id;
    }
    get canManageEmployees() {
        return this.auth.hasPermission('manageEmployees');
    }
    ngOnInit() {
        this.searchControl.valueChanges
            .pipe(startWith(this.searchControl.getRawValue()), debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((query) => {
            void this.search(query);
        });
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    async toggleActive(employee) {
        if (!this.canManageEmployees)
            return;
        this.error = '';
        const ok = await this.employeesRepository.setActive(employee.id, !employee.actif);
        if (!ok) {
            this.error = "Impossible de modifier le statut du salarie.";
            return;
        }
        await this.search(this.searchControl.getRawValue());
    }
    async deleteEmployee(employee) {
        if (!this.canManageEmployees)
            return;
        this.error = '';
        const confirmed = window.confirm(`Supprimer le salarie ${employee.nom} ?`);
        if (!confirmed)
            return;
        const ok = await this.employeesRepository.delete(employee.id);
        if (!ok) {
            this.error = 'Suppression impossible.';
            return;
        }
        await this.search(this.searchControl.getRawValue());
    }
    async search(query) {
        this.loading = true;
        this.error = '';
        try {
            const text = query.trim();
            this.employees = text
                ? await this.employeesRepository.search(text)
                : await this.employeesRepository.list();
        }
        catch {
            this.error = 'Chargement impossible.';
            this.employees = [];
        }
        finally {
            this.loading = false;
        }
    }
    static { this.ɵfac = function EmployeeListComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || EmployeeListComponent)(i0.ɵɵdirectiveInject(i1.EmployeesRepository), i0.ɵɵdirectiveInject(i2.AuthService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: EmployeeListComponent, selectors: [["app-employee-list"]], decls: 19, vars: 5, consts: [[1, "panel"], [1, "panel-header"], [1, "actions"], ["class", "btn primary", "routerLink", "/employees/new", 4, "ngIf"], [1, "card"], [1, "toolbar"], [1, "field", "search"], ["type", "search", "placeholder", "Nom, username, telephone...", 1, "input", 3, "formControl"], ["class", "error", 4, "ngIf"], ["class", "empty", 4, "ngIf"], ["class", "table", 4, "ngIf"], ["routerLink", "/employees/new", 1, "btn", "primary"], [1, "error"], [1, "empty"], [1, "table"], [1, "row", "head"], ["class", "row", 4, "ngFor", "ngForOf", "ngForTrackBy"], [1, "row"], [1, "mono"], [1, "tag"], ["type", "button", 1, "chip", 3, "click", "disabled"], [1, "stock-perm"], [1, "row-actions"], [1, "btn", "ghost", 3, "routerLink"], ["class", "btn outline", 3, "routerLink", 4, "ngIf"], ["class", "btn danger", "type", "button", 3, "click", 4, "ngIf"], [1, "btn", "outline", 3, "routerLink"], ["type", "button", 1, "btn", "danger", 3, "click"]], template: function EmployeeListComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4, "Salaries");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "Gestion des comptes, roles et permissions.");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(7, "div", 2);
            i0.ɵɵtemplate(8, EmployeeListComponent_a_8_Template, 2, 0, "a", 3);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(9, "section", 4)(10, "div", 5)(11, "label", 6)(12, "span");
            i0.ɵɵtext(13, "Recherche");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(14, "input", 7);
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(15, "section", 4);
            i0.ɵɵtemplate(16, EmployeeListComponent_div_16_Template, 2, 1, "div", 8)(17, EmployeeListComponent_div_17_Template, 2, 0, "div", 9)(18, EmployeeListComponent_div_18_Template, 23, 2, "div", 10);
            i0.ɵɵelementEnd()();
        } if (rf & 2) {
            i0.ɵɵadvance(8);
            i0.ɵɵproperty("ngIf", ctx.canManageEmployees);
            i0.ɵɵadvance(6);
            i0.ɵɵproperty("formControl", ctx.searchControl);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.error);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", !ctx.loading && ctx.employees.length === 0);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.employees.length > 0);
        } }, dependencies: [CommonModule, i3.NgForOf, i3.NgIf, ReactiveFormsModule, i4.DefaultValueAccessor, i4.NgControlStatus, i4.FormControlDirective, RouterLink, i3.DecimalPipe], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 16px;\n}\n\n.toolbar[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n}\n\n.search[_ngcontent-%COMP%] {\n  min-width: 360px;\n}\n\n.table[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.1fr 1.2fr 0.9fr 0.9fr 0.8fr 0.9fr 0.8fr 0.8fr 1fr 1.5fr;\n  gap: 10px;\n  align-items: center;\n  padding: 10px 0;\n  border-bottom: 1px solid var(--border);\n}\n\n.head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.06em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n}\n\n.row-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.chip[_ngcontent-%COMP%] {\n  border: 1px solid var(--accent);\n  color: var(--accent);\n  background: #fff;\n  border-radius: 999px;\n  padding: 5px 10px;\n  cursor: pointer;\n}\n\n.chip-off[_ngcontent-%COMP%] {\n  border-color: var(--danger);\n  color: var(--danger);\n}\n\n.stock-perm[_ngcontent-%COMP%] {\n  display: inline-block;\n  margin-right: 8px;\n  color: var(--muted);\n}\n\n.stock-perm.ok[_ngcontent-%COMP%] {\n  color: var(--accent);\n  font-weight: 600;\n}\n\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted);\n  padding: 20px 0;\n}\n\n.error[_ngcontent-%COMP%] {\n  color: var(--danger);\n}\n\n@media (max-width: 1100px) {\n  .search[_ngcontent-%COMP%] {\n    min-width: 0;\n    width: 100%;\n  }\n\n  .row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n    gap: 6px;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(EmployeeListComponent, [{
        type: Component,
        args: [{ selector: 'app-employee-list', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: "<section class=\"panel\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Salaries</h1>\n      <p>Gestion des comptes, roles et permissions.</p>\n    </div>\n    <div class=\"actions\">\n      <a class=\"btn primary\" routerLink=\"/employees/new\" *ngIf=\"canManageEmployees\">Nouveau salarie</a>\n    </div>\n  </div>\n\n  <section class=\"card\">\n    <div class=\"toolbar\">\n      <label class=\"field search\">\n        <span>Recherche</span>\n        <input class=\"input\" type=\"search\" [formControl]=\"searchControl\" placeholder=\"Nom, username, telephone...\" />\n      </label>\n    </div>\n  </section>\n\n  <section class=\"card\">\n    <div class=\"error\" *ngIf=\"error\">{{ error }}</div>\n    <div class=\"empty\" *ngIf=\"!loading && employees.length === 0\">Aucun salarie.</div>\n\n    <div class=\"table\" *ngIf=\"employees.length > 0\">\n      <div class=\"row head\">\n        <div>Nom</div>\n        <div>Email</div>\n        <div>Telephone</div>\n        <div>Poste</div>\n        <div>Salaire</div>\n        <div>Username</div>\n        <div>Role</div>\n        <div>Actif</div>\n        <div>Stock</div>\n        <div>Actions</div>\n      </div>\n\n      <div class=\"row\" *ngFor=\"let employee of employees; trackBy: trackByEmployee\">\n        <div>{{ employee.nom }}</div>\n        <div>{{ employee.email || '-' }}</div>\n        <div>{{ employee.telephone || '-' }}</div>\n        <div>{{ employee.poste || '-' }}</div>\n        <div class=\"mono\">{{ employee.salaireBase | number:'1.2-2' }}</div>\n        <div class=\"mono\">{{ employee.username || '-' }}</div>\n        <div><span class=\"tag\">{{ employee.role }}</span></div>\n        <div>\n          <button class=\"chip\" type=\"button\" [class.chip-off]=\"!employee.actif\" (click)=\"toggleActive(employee)\" [disabled]=\"!canManageEmployees\">\n            {{ employee.actif ? 'Actif' : 'Inactif' }}\n          </button>\n        </div>\n        <div>\n          <span class=\"stock-perm\" [class.ok]=\"employee.canViewStock\">Voir</span>\n          <span class=\"stock-perm\" [class.ok]=\"employee.canManageStock\">Modifier</span>\n          <span class=\"stock-perm\" [class.ok]=\"employee.isProtectedAccount\">Protege</span>\n        </div>\n        <div class=\"row-actions\">\n          <a class=\"btn ghost\" [routerLink]=\"['/employees', employee.id]\">Voir</a>\n          <a class=\"btn outline\" [routerLink]=\"['/employees', employee.id, 'edit']\" *ngIf=\"canManageEmployees\">Modifier</a>\n          <button class=\"btn danger\" type=\"button\" (click)=\"deleteEmployee(employee)\" *ngIf=\"canManageEmployees\">Supprimer</button>\n        </div>\n      </div>\n    </div>\n  </section>\n</section>\n", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  gap: 16px;\n}\n\n.toolbar {\n  display: flex;\n  gap: 12px;\n}\n\n.search {\n  min-width: 360px;\n}\n\n.table {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.row {\n  display: grid;\n  grid-template-columns: 1.1fr 1.2fr 0.9fr 0.9fr 0.8fr 0.9fr 0.8fr 0.8fr 1fr 1.5fr;\n  gap: 10px;\n  align-items: center;\n  padding: 10px 0;\n  border-bottom: 1px solid var(--border);\n}\n\n.head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.06em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n}\n\n.row-actions {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.chip {\n  border: 1px solid var(--accent);\n  color: var(--accent);\n  background: #fff;\n  border-radius: 999px;\n  padding: 5px 10px;\n  cursor: pointer;\n}\n\n.chip-off {\n  border-color: var(--danger);\n  color: var(--danger);\n}\n\n.stock-perm {\n  display: inline-block;\n  margin-right: 8px;\n  color: var(--muted);\n}\n\n.stock-perm.ok {\n  color: var(--accent);\n  font-weight: 600;\n}\n\n.empty {\n  text-align: center;\n  color: var(--muted);\n  padding: 20px 0;\n}\n\n.error {\n  color: var(--danger);\n}\n\n@media (max-width: 1100px) {\n  .search {\n    min-width: 0;\n    width: 100%;\n  }\n\n  .row {\n    grid-template-columns: 1fr;\n    gap: 6px;\n  }\n}\n"] }]
    }], () => [{ type: i1.EmployeesRepository }, { type: i2.AuthService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(EmployeeListComponent, { className: "EmployeeListComponent", filePath: "src/app/components/employees/employee-list.component.ts", lineNumber: 17 }); })();
