import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/router";
function AppComponent_header_0_nav_10_a_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 22)(1, "span", 23);
    i0.ɵɵtext(2, "FC");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Factures ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_a_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 24)(1, "span", 23);
    i0.ɵɵtext(2, "DV");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Devis ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_a_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 25)(1, "span", 23);
    i0.ɵɵtext(2, "CL");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Clients ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_a_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 26)(1, "span", 23);
    i0.ɵɵtext(2, "ST");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Stock ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_a_5_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 27)(1, "span", 23);
    i0.ɵɵtext(2, "IN");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Inventaire ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_a_6_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 28)(1, "span", 23);
    i0.ɵɵtext(2, "HS");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Historique ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_a_7_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 29)(1, "span", 23);
    i0.ɵɵtext(2, "ES");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Estimation ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_a_8_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 30)(1, "span", 23);
    i0.ɵɵtext(2, "RH");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(3, " Salaries ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_nav_10_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "nav", 13);
    i0.ɵɵtemplate(1, AppComponent_header_0_nav_10_a_1_Template, 4, 0, "a", 14)(2, AppComponent_header_0_nav_10_a_2_Template, 4, 0, "a", 15)(3, AppComponent_header_0_nav_10_a_3_Template, 4, 0, "a", 16)(4, AppComponent_header_0_nav_10_a_4_Template, 4, 0, "a", 17)(5, AppComponent_header_0_nav_10_a_5_Template, 4, 0, "a", 18)(6, AppComponent_header_0_nav_10_a_6_Template, 4, 0, "a", 19)(7, AppComponent_header_0_nav_10_a_7_Template, 4, 0, "a", 20)(8, AppComponent_header_0_nav_10_a_8_Template, 4, 0, "a", 21);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canManageInvoices);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canManageQuotes);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canManageClients);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canViewStock);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canOpenInventoryModules);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canOpenInventoryModules);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canManageQuotes);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canOpenEmployees);
} }
function AppComponent_header_0_div_11_a_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "a", 40);
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(1, "svg", 41);
    i0.ɵɵelement(2, "line", 42)(3, "line", 43);
    i0.ɵɵelementEnd();
    i0.ɵɵtext(4, " Nouvelle facture ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_div_11_div_8_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 44)(1, "span", 45);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "span", 46);
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r0.displayName || ctx_r0.username);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r0.role);
} }
function AppComponent_header_0_div_11_div_11_button_20_Template(rf, ctx) { if (rf & 1) {
    const _r4 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 65);
    i0.ɵɵlistener("click", function AppComponent_header_0_div_11_div_11_button_20_Template_button_click_0_listener() { i0.ɵɵrestoreView(_r4); const ctx_r0 = i0.ɵɵnextContext(4); return i0.ɵɵresetView(ctx_r0.openSettings()); });
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(1, "svg", 56);
    i0.ɵɵelement(2, "circle", 66)(3, "path", 67);
    i0.ɵɵelementEnd();
    i0.ɵɵtext(4, " Parametres ");
    i0.ɵɵelementEnd();
} }
function AppComponent_header_0_div_11_div_11_Template(rf, ctx) { if (rf & 1) {
    const _r3 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 47)(1, "div", 48)(2, "div", 49);
    i0.ɵɵtext(3);
    i0.ɵɵpipe(4, "uppercase");
    i0.ɵɵpipe(5, "uppercase");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "div", 50)(7, "span", 51);
    i0.ɵɵtext(8);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "span", 52);
    i0.ɵɵtext(10);
    i0.ɵɵelementEnd()()();
    i0.ɵɵelement(11, "div", 53);
    i0.ɵɵelementStart(12, "div", 54)(13, "button", 55);
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(14, "svg", 56);
    i0.ɵɵelement(15, "path", 57)(16, "circle", 58);
    i0.ɵɵelementEnd();
    i0.ɵɵtext(17, " Mon profil ");
    i0.ɵɵnamespaceHTML();
    i0.ɵɵelementStart(18, "span", 59);
    i0.ɵɵtext(19, "Bientot");
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(20, AppComponent_header_0_div_11_div_11_button_20_Template, 5, 0, "button", 60);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(21, "div", 53);
    i0.ɵɵelementStart(22, "div", 54)(23, "button", 61);
    i0.ɵɵlistener("click", function AppComponent_header_0_div_11_div_11_Template_button_click_23_listener() { i0.ɵɵrestoreView(_r3); const ctx_r0 = i0.ɵɵnextContext(3); return i0.ɵɵresetView(ctx_r0.logout()); });
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(24, "svg", 56);
    i0.ɵɵelement(25, "path", 62)(26, "polyline", 63)(27, "line", 64);
    i0.ɵɵelementEnd();
    i0.ɵɵtext(28, " Se deconnecter ");
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(3);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate2(" ", i0.ɵɵpipeBind1(4, 5, (ctx_r0.username == null ? null : ctx_r0.username[0]) || "A"), "", i0.ɵɵpipeBind1(5, 7, (ctx_r0.username == null ? null : ctx_r0.username[1]) || "U"), " ");
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate(ctx_r0.displayName || ctx_r0.username);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r0.role);
    i0.ɵɵadvance(10);
    i0.ɵɵproperty("ngIf", ctx_r0.canOpenSettings);
} }
function AppComponent_header_0_div_11_Template(rf, ctx) { if (rf & 1) {
    const _r2 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 31);
    i0.ɵɵtemplate(1, AppComponent_header_0_div_11_a_1_Template, 5, 0, "a", 32);
    i0.ɵɵelementStart(2, "div", 33)(3, "button", 34);
    i0.ɵɵlistener("click", function AppComponent_header_0_div_11_Template_button_click_3_listener() { i0.ɵɵrestoreView(_r2); const ctx_r0 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r0.toggleDropdown()); });
    i0.ɵɵelementStart(4, "div", 35);
    i0.ɵɵtext(5);
    i0.ɵɵpipe(6, "uppercase");
    i0.ɵɵpipe(7, "uppercase");
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(8, AppComponent_header_0_div_11_div_8_Template, 5, 2, "div", 36);
    i0.ɵɵnamespaceSVG();
    i0.ɵɵelementStart(9, "svg", 37);
    i0.ɵɵelement(10, "polyline", 38);
    i0.ɵɵelementEnd()();
    i0.ɵɵtemplate(11, AppComponent_header_0_div_11_div_11_Template, 29, 9, "div", 39);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.canManageInvoices);
    i0.ɵɵadvance();
    i0.ɵɵclassProp("open", ctx_r0.dropdownOpen);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate2(" ", i0.ɵɵpipeBind1(6, 7, (ctx_r0.username == null ? null : ctx_r0.username[0]) || "A"), "", i0.ɵɵpipeBind1(7, 9, (ctx_r0.username == null ? null : ctx_r0.username[1]) || "U"), " ");
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("ngIf", ctx_r0.username || ctx_r0.displayName);
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("ngIf", ctx_r0.dropdownOpen);
} }
function AppComponent_header_0_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "header", 3)(1, "div", 4)(2, "div", 5)(3, "div", 6);
    i0.ɵɵelement(4, "img", 7);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "div", 8)(6, "h1", 9);
    i0.ɵɵtext(7, "SPA - Societe d'Aluminium");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "span", 10);
    i0.ɵɵtext(9, "Facturation | Vente & Fabrication");
    i0.ɵɵelementEnd()()();
    i0.ɵɵtemplate(10, AppComponent_header_0_nav_10_Template, 9, 8, "nav", 11)(11, AppComponent_header_0_div_11_Template, 12, 11, "div", 12);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(10);
    i0.ɵɵproperty("ngIf", ctx_r0.isLoggedIn);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.isLoggedIn);
} }
function AppComponent_footer_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "footer", 68);
    i0.ɵɵtext(1, " SPA - Societe d'Aluminium | Merci pour votre confiance\n");
    i0.ɵɵelementEnd();
} }
export class AppComponent {
    constructor() {
        this.router = inject(Router);
        this.auth = inject(AuthService);
        this.dropdownOpen = false;
    }
    async ngOnInit() {
        await this.auth.ensureInitialized();
    }
    get isLoginRoute() {
        return this.router.url.startsWith('/login');
    }
    get isLoggedIn() {
        return this.auth.isLoggedIn();
    }
    get role() {
        return this.auth.role();
    }
    get isEmployee() {
        return this.role === 'employee';
    }
    get username() {
        return this.auth.username();
    }
    get displayName() {
        return this.auth.displayName();
    }
    get canViewStock() {
        return this.auth.hasPermission('viewStock');
    }
    get canManageStock() {
        return this.auth.hasPermission('manageStock');
    }
    get canManageInvoices() {
        return this.auth.hasPermission('manageInvoices');
    }
    get canManageQuotes() {
        return this.auth.hasPermission('manageQuotes');
    }
    get canManageClients() {
        return this.auth.hasPermission('manageClients');
    }
    get canManageEmployees() {
        return this.auth.hasPermission('manageEmployees');
    }
    get canManageSalary() {
        return this.auth.hasPermission('manageSalary');
    }
    get canOpenEmployees() {
        return !this.isEmployee && (this.canManageEmployees || this.canManageSalary);
    }
    get canOpenInventoryModules() {
        return this.canViewStock && !this.isEmployee;
    }
    get canOpenSettings() {
        return this.canManageEmployees && !this.isEmployee;
    }
    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }
    onDocumentClick(event) {
        const target = event.target;
        if (!target.closest('.user-menu')) {
            this.dropdownOpen = false;
        }
    }
    async logout() {
        this.dropdownOpen = false;
        await this.auth.logout();
        await this.router.navigateByUrl('/login');
    }
    openSettings() {
        if (!this.canOpenSettings) {
            return;
        }
        this.dropdownOpen = false;
        void this.router.navigateByUrl('/settings');
    }
    static { this.ɵfac = function AppComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || AppComponent)(); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: AppComponent, selectors: [["app-root"]], hostBindings: function AppComponent_HostBindings(rf, ctx) { if (rf & 1) {
            i0.ɵɵlistener("click", function AppComponent_click_HostBindingHandler($event) { return ctx.onDocumentClick($event); }, i0.ɵɵresolveDocument);
        } }, decls: 4, vars: 2, consts: [["class", "app-header", 4, "ngIf"], [1, "app-main"], ["class", "app-footer", 4, "ngIf"], [1, "app-header"], [1, "header-inner"], [1, "brand"], [1, "brand-mark"], ["src", "assets/logospa.png", "alt", "SPA - Societe d'Aluminium", 1, "brand-logo"], [1, "brand-text"], [1, "brand-title"], [1, "brand-subtitle"], ["class", "nav", 4, "ngIf"], ["class", "actions", 4, "ngIf"], [1, "nav"], ["routerLink", "/invoices", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/quotes", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/clients", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/stock", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/inventaire", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/stock/history", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/estimation", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/employees", "routerLinkActive", "active", 4, "ngIf"], ["routerLink", "/invoices", "routerLinkActive", "active"], [1, "nav-icon"], ["routerLink", "/quotes", "routerLinkActive", "active"], ["routerLink", "/clients", "routerLinkActive", "active"], ["routerLink", "/stock", "routerLinkActive", "active"], ["routerLink", "/inventaire", "routerLinkActive", "active"], ["routerLink", "/stock/history", "routerLinkActive", "active"], ["routerLink", "/estimation", "routerLinkActive", "active"], ["routerLink", "/employees", "routerLinkActive", "active"], [1, "actions"], ["class", "btn-primary", "routerLink", "/invoices/new", 4, "ngIf"], [1, "user-menu"], ["type", "button", 1, "user-pill", 3, "click"], [1, "avatar"], ["class", "user-info", 4, "ngIf"], ["width", "14", "height", "14", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2.5", "stroke-linecap", "round", 1, "chevron"], ["points", "6 9 12 15 18 9"], ["class", "dropdown", 4, "ngIf"], ["routerLink", "/invoices/new", 1, "btn-primary"], ["width", "14", "height", "14", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "2.5", "stroke-linecap", "round"], ["x1", "12", "y1", "5", "x2", "12", "y2", "19"], ["x1", "5", "y1", "12", "x2", "19", "y2", "12"], [1, "user-info"], [1, "user-name"], [1, "user-role"], [1, "dropdown"], [1, "dropdown-header"], [1, "dropdown-avatar"], [1, "dropdown-user-info"], [1, "dropdown-name"], [1, "dropdown-role-badge"], [1, "dropdown-divider"], [1, "dropdown-section"], ["type", "button", "disabled", "", 1, "dropdown-item"], ["width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "1.8", "stroke-linecap", "round"], ["d", "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"], ["cx", "12", "cy", "7", "r", "4"], [1, "dropdown-badge-soon"], ["class", "dropdown-item", "type", "button", 3, "click", 4, "ngIf"], ["type", "button", 1, "dropdown-item", "dropdown-item--danger", 3, "click"], ["d", "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"], ["points", "16 17 21 12 16 7"], ["x1", "21", "y1", "12", "x2", "9", "y2", "12"], ["type", "button", 1, "dropdown-item", 3, "click"], ["cx", "12", "cy", "12", "r", "3"], ["d", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"], [1, "app-footer"]], template: function AppComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵtemplate(0, AppComponent_header_0_Template, 12, 2, "header", 0);
            i0.ɵɵelementStart(1, "main", 1);
            i0.ɵɵelement(2, "router-outlet");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(3, AppComponent_footer_3_Template, 2, 0, "footer", 2);
        } if (rf & 2) {
            i0.ɵɵproperty("ngIf", !ctx.isLoginRoute);
            i0.ɵɵadvance(3);
            i0.ɵɵproperty("ngIf", !ctx.isLoginRoute);
        } }, dependencies: [CommonModule, i1.NgIf, RouterModule, i2.RouterOutlet, i2.RouterLink, i2.RouterLinkActive, i1.UpperCasePipe], styles: ["\n\n\n\n.app-header[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  z-index: 100;\n  background: #ffffff;\n  border-bottom: 2px solid #1a56db;\n  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.08);\n}\n\n.header-inner[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 24px;\n  padding: 0 40px;\n  height: 66px;\n  max-width: 1600px;\n  margin: 0 auto;\n}\n\n\n\n\n\n.brand[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  flex-shrink: 0;\n}\n\n.brand-mark[_ngcontent-%COMP%] { display: flex; align-items: center; }\n\n.brand-logo[_ngcontent-%COMP%] {\n  height: 42px;\n  width: auto;\n  object-fit: contain;\n  display: block;\n}\n\n.brand-text[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  padding-left: 14px;\n  border-left: 2px solid #e8edf5;\n}\n\n.brand-title[_ngcontent-%COMP%] {\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  font-size: 0.93rem;\n  font-weight: 700;\n  color: #0f1f3d;\n  line-height: 1.2;\n  letter-spacing: -0.01em;\n}\n\n.brand-subtitle[_ngcontent-%COMP%] {\n  font-size: 0.71rem;\n  color: #8a96a8;\n  letter-spacing: 0.02em;\n}\n\n\n\n\n\n.nav[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  flex: 1;\n  justify-content: center;\n}\n\n.nav[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 7px 14px;\n  border-radius: 8px;\n  font-size: 0.83rem;\n  font-weight: 500;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  color: #4a5568;\n  text-decoration: none;\n  transition: all 0.15s ease;\n  white-space: nowrap;\n}\n\n.nav-icon[_ngcontent-%COMP%] { font-size: 0.9rem; }\n\n.nav[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n  background: #eef2ff;\n  color: #1a56db;\n}\n\n.nav[_ngcontent-%COMP%]   a.active[_ngcontent-%COMP%] {\n  background: #1a56db;\n  color: #ffffff;\n  font-weight: 600;\n  box-shadow: 0 2px 8px rgba(26, 86, 219, 0.25);\n}\n\n\n\n\n\n.actions[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-shrink: 0;\n}\n\n.btn-primary[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  background: #1a56db;\n  color: #fff;\n  padding: 8px 16px;\n  border-radius: 8px;\n  font-size: 0.82rem;\n  font-weight: 600;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  text-decoration: none;\n  transition: all 0.15s ease;\n  white-space: nowrap;\n  box-shadow: 0 2px 8px rgba(26, 86, 219, 0.3);\n}\n\n.btn-primary[_ngcontent-%COMP%]:hover {\n  background: #1447c0;\n  transform: translateY(-1px);\n  box-shadow: 0 4px 14px rgba(26, 86, 219, 0.35);\n}\n\n\n\n\n\n.user-menu[_ngcontent-%COMP%] {\n  position: relative;\n}\n\n\n\n\n\n.user-pill[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  padding: 5px 12px 5px 5px;\n  border-radius: 999px;\n  border: 1.5px solid #e2e8f0;\n  background: #f8fafc;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  outline: none;\n}\n\n.user-pill[_ngcontent-%COMP%]:hover, \n.user-menu.open[_ngcontent-%COMP%]   .user-pill[_ngcontent-%COMP%] {\n  border-color: #1a56db;\n  background: #eef2ff;\n  box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.1);\n}\n\n.avatar[_ngcontent-%COMP%] {\n  width: 30px;\n  height: 30px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #1a56db 0%, #3b82f6 100%);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.7rem;\n  font-weight: 700;\n  color: #ffffff;\n  letter-spacing: 0.03em;\n  flex-shrink: 0;\n  box-shadow: 0 2px 6px rgba(26, 86, 219, 0.3);\n}\n\n.user-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 1px;\n}\n\n.user-name[_ngcontent-%COMP%] {\n  font-size: 0.8rem;\n  font-weight: 600;\n  color: #0f1f3d;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  line-height: 1.2;\n}\n\n.user-role[_ngcontent-%COMP%] {\n  font-size: 0.65rem;\n  color: #1a56db;\n  font-weight: 600;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  background: #dbeafe;\n  padding: 1px 7px;\n  border-radius: 999px;\n  line-height: 1.6;\n}\n\n.chevron[_ngcontent-%COMP%] {\n  color: #8a96a8;\n  transition: transform 0.2s ease;\n  flex-shrink: 0;\n}\n\n.user-menu.open[_ngcontent-%COMP%]   .chevron[_ngcontent-%COMP%] {\n  transform: rotate(180deg);\n}\n\n\n\n\n\n.dropdown[_ngcontent-%COMP%] {\n  position: absolute;\n  top: calc(100% + 10px);\n  right: 0;\n  width: 240px;\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  box-shadow: 0 8px 32px rgba(15, 31, 61, 0.12), 0 2px 8px rgba(15, 31, 61, 0.06);\n  overflow: hidden;\n  animation: _ngcontent-%COMP%_dropdownIn 0.18s ease;\n  z-index: 200;\n}\n\n@keyframes _ngcontent-%COMP%_dropdownIn {\n  from { opacity: 0; transform: translateY(-8px) scale(0.97); }\n  to   { opacity: 1; transform: translateY(0) scale(1); }\n}\n\n\n\n.dropdown-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 16px;\n  background: linear-gradient(135deg, #eef2ff 0%, #f0f7ff 100%);\n}\n\n.dropdown-avatar[_ngcontent-%COMP%] {\n  width: 42px;\n  height: 42px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #1a56db 0%, #3b82f6 100%);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.85rem;\n  font-weight: 700;\n  color: #ffffff;\n  letter-spacing: 0.03em;\n  flex-shrink: 0;\n  box-shadow: 0 3px 10px rgba(26, 86, 219, 0.35);\n}\n\n.dropdown-user-info[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.dropdown-name[_ngcontent-%COMP%] {\n  font-size: 0.88rem;\n  font-weight: 700;\n  color: #0f1f3d;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  line-height: 1.2;\n  text-transform: capitalize;\n}\n\n.dropdown-role-badge[_ngcontent-%COMP%] {\n  display: inline-block;\n  font-size: 0.65rem;\n  font-weight: 700;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: #1a56db;\n  background: #dbeafe;\n  padding: 2px 8px;\n  border-radius: 999px;\n  line-height: 1.6;\n}\n\n\n\n.dropdown-divider[_ngcontent-%COMP%] {\n  height: 1px;\n  background: #f1f5f9;\n  margin: 0;\n}\n\n\n\n.dropdown-section[_ngcontent-%COMP%] {\n  padding: 6px;\n}\n\n\n\n.dropdown-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  width: 100%;\n  padding: 9px 12px;\n  border: none;\n  border-radius: 8px;\n  background: transparent;\n  font-size: 0.83rem;\n  font-weight: 500;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  color: #374151;\n  cursor: pointer;\n  transition: background 0.12s ease, color 0.12s ease;\n  text-align: left;\n}\n\n.dropdown-item[_ngcontent-%COMP%]:hover:not([disabled]) {\n  background: #f1f5f9;\n  color: #0f1f3d;\n}\n\n.dropdown-item[disabled][_ngcontent-%COMP%] {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n\n.dropdown-item[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  flex-shrink: 0;\n  color: #8a96a8;\n}\n\n.dropdown-item[_ngcontent-%COMP%]:hover:not([disabled])   svg[_ngcontent-%COMP%] {\n  color: #1a56db;\n}\n\n\n\n.dropdown-badge-soon[_ngcontent-%COMP%] {\n  margin-left: auto;\n  font-size: 0.6rem;\n  font-weight: 600;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  color: #64748b;\n  background: #f1f5f9;\n  padding: 2px 7px;\n  border-radius: 999px;\n}\n\n\n\n.dropdown-item--danger[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\n\n.dropdown-item--danger[_ngcontent-%COMP%]   svg[_ngcontent-%COMP%] {\n  color: #dc2626;\n}\n\n.dropdown-item--danger[_ngcontent-%COMP%]:hover {\n  background: #fef2f2 !important;\n  color: #b91c1c !important;\n}\n\n.dropdown-item--danger[_ngcontent-%COMP%]:hover   svg[_ngcontent-%COMP%] {\n  color: #b91c1c !important;\n}\n\n\n\n\n\n.app-main[_ngcontent-%COMP%] {\n  padding: 32px 40px 64px;\n  min-height: calc(100vh - 66px - 49px);\n  background: #f8fafc;\n}\n\n\n\n\n\n.app-footer[_ngcontent-%COMP%] {\n  text-align: center;\n  color: #8a96a8;\n  padding: 14px 20px;\n  font-size: 0.78rem;\n  border-top: 1px solid #e2e8f0;\n  background: #ffffff;\n  letter-spacing: 0.02em;\n}\n\n\n\n\n\n@media (max-width: 1100px) {\n  .brand-subtitle[_ngcontent-%COMP%] { display: none; }\n  .nav[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] { padding: 6px 10px; font-size: 0.8rem; }\n  .header-inner[_ngcontent-%COMP%] { padding: 0 24px; }\n}\n\n@media (max-width: 820px) {\n  .header-inner[_ngcontent-%COMP%] {\n    flex-wrap: wrap;\n    height: auto;\n    padding: 12px 20px;\n    gap: 10px;\n  }\n  .nav[_ngcontent-%COMP%] {\n    order: 3;\n    width: 100%;\n    justify-content: flex-start;\n    overflow-x: auto;\n    padding-bottom: 4px;\n    scrollbar-width: none;\n  }\n  .nav[_ngcontent-%COMP%]::-webkit-scrollbar { display: none; }\n  .brand-logo[_ngcontent-%COMP%] { height: 32px; }\n  .brand-title[_ngcontent-%COMP%] { font-size: 0.85rem; }\n  .app-main[_ngcontent-%COMP%] { padding: 20px; }\n  .user-info[_ngcontent-%COMP%] { display: none; }\n  .chevron[_ngcontent-%COMP%] { display: none; }\n  .dropdown[_ngcontent-%COMP%] { right: -10px; width: 220px; }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AppComponent, [{
        type: Component,
        args: [{ selector: 'app-root', standalone: true, imports: [CommonModule, RouterModule], template: "<header class=\"app-header\" *ngIf=\"!isLoginRoute\">\n  <div class=\"header-inner\">\n    <div class=\"brand\">\n      <div class=\"brand-mark\">\n        <img src=\"assets/logospa.png\" alt=\"SPA - Societe d'Aluminium\" class=\"brand-logo\" />\n      </div>\n      <div class=\"brand-text\">\n        <h1 class=\"brand-title\">SPA - Societe d'Aluminium</h1>\n        <span class=\"brand-subtitle\">Facturation | Vente &amp; Fabrication</span>\n      </div>\n    </div>\n\n    <nav class=\"nav\" *ngIf=\"isLoggedIn\">\n      <a *ngIf=\"canManageInvoices\" routerLink=\"/invoices\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">FC</span> Factures\n      </a>\n      <a *ngIf=\"canManageQuotes\" routerLink=\"/quotes\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">DV</span> Devis\n      </a>\n      <a *ngIf=\"canManageClients\" routerLink=\"/clients\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">CL</span> Clients\n      </a>\n      <a *ngIf=\"canViewStock\" routerLink=\"/stock\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">ST</span> Stock\n      </a>\n      <a *ngIf=\"canOpenInventoryModules\" routerLink=\"/inventaire\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">IN</span> Inventaire\n      </a>\n      <a *ngIf=\"canOpenInventoryModules\" routerLink=\"/stock/history\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">HS</span> Historique\n      </a>\n      <a *ngIf=\"canManageQuotes\" routerLink=\"/estimation\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">ES</span> Estimation\n      </a>\n      <a *ngIf=\"canOpenEmployees\" routerLink=\"/employees\" routerLinkActive=\"active\">\n        <span class=\"nav-icon\">RH</span> Salaries\n      </a>\n    </nav>\n\n    <div class=\"actions\" *ngIf=\"isLoggedIn\">\n      <a *ngIf=\"canManageInvoices\" class=\"btn-primary\" routerLink=\"/invoices/new\">\n        <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\">\n          <line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\" />\n          <line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\" />\n        </svg>\n        Nouvelle facture\n      </a>\n\n      <div class=\"user-menu\" [class.open]=\"dropdownOpen\">\n        <button class=\"user-pill\" type=\"button\" (click)=\"toggleDropdown()\">\n          <div class=\"avatar\">\n            {{ (username?.[0] || 'A') | uppercase }}{{ (username?.[1] || 'U') | uppercase }}\n          </div>\n          <div class=\"user-info\" *ngIf=\"username || displayName\">\n            <span class=\"user-name\">{{ displayName || username }}</span>\n            <span class=\"user-role\">{{ role }}</span>\n          </div>\n          <svg class=\"chevron\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\">\n            <polyline points=\"6 9 12 15 18 9\" />\n          </svg>\n        </button>\n\n        <div class=\"dropdown\" *ngIf=\"dropdownOpen\">\n          <div class=\"dropdown-header\">\n            <div class=\"dropdown-avatar\">\n              {{ (username?.[0] || 'A') | uppercase }}{{ (username?.[1] || 'U') | uppercase }}\n            </div>\n            <div class=\"dropdown-user-info\">\n              <span class=\"dropdown-name\">{{ displayName || username }}</span>\n              <span class=\"dropdown-role-badge\">{{ role }}</span>\n            </div>\n          </div>\n\n          <div class=\"dropdown-divider\"></div>\n\n          <div class=\"dropdown-section\">\n            <button class=\"dropdown-item\" type=\"button\" disabled>\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\">\n                <path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\" />\n                <circle cx=\"12\" cy=\"7\" r=\"4\" />\n              </svg>\n              Mon profil\n              <span class=\"dropdown-badge-soon\">Bientot</span>\n            </button>\n            <button class=\"dropdown-item\" type=\"button\" (click)=\"openSettings()\" *ngIf=\"canOpenSettings\">\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\">\n                <circle cx=\"12\" cy=\"12\" r=\"3\" />\n                <path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z\" />\n              </svg>\n              Parametres\n            </button>\n          </div>\n\n          <div class=\"dropdown-divider\"></div>\n\n          <div class=\"dropdown-section\">\n            <button class=\"dropdown-item dropdown-item--danger\" type=\"button\" (click)=\"logout()\">\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\">\n                <path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" />\n                <polyline points=\"16 17 21 12 16 7\" />\n                <line x1=\"21\" y1=\"12\" x2=\"9\" y2=\"12\" />\n              </svg>\n              Se deconnecter\n            </button>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</header>\n\n<main class=\"app-main\">\n  <router-outlet></router-outlet>\n</main>\n\n<footer class=\"app-footer\" *ngIf=\"!isLoginRoute\">\n  SPA - Societe d'Aluminium | Merci pour votre confiance\n</footer>\n", styles: ["/* =========================\n   HEADER\n========================= */\n.app-header {\n  position: sticky;\n  top: 0;\n  z-index: 100;\n  background: #ffffff;\n  border-bottom: 2px solid #1a56db;\n  box-shadow: 0 2px 12px rgba(26, 86, 219, 0.08);\n}\n\n.header-inner {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 24px;\n  padding: 0 40px;\n  height: 66px;\n  max-width: 1600px;\n  margin: 0 auto;\n}\n\n/* =========================\n   BRAND\n========================= */\n.brand {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  flex-shrink: 0;\n}\n\n.brand-mark { display: flex; align-items: center; }\n\n.brand-logo {\n  height: 42px;\n  width: auto;\n  object-fit: contain;\n  display: block;\n}\n\n.brand-text {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n  padding-left: 14px;\n  border-left: 2px solid #e8edf5;\n}\n\n.brand-title {\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  font-size: 0.93rem;\n  font-weight: 700;\n  color: #0f1f3d;\n  line-height: 1.2;\n  letter-spacing: -0.01em;\n}\n\n.brand-subtitle {\n  font-size: 0.71rem;\n  color: #8a96a8;\n  letter-spacing: 0.02em;\n}\n\n/* =========================\n   NAVIGATION\n========================= */\n.nav {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  flex: 1;\n  justify-content: center;\n}\n\n.nav a {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 7px 14px;\n  border-radius: 8px;\n  font-size: 0.83rem;\n  font-weight: 500;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  color: #4a5568;\n  text-decoration: none;\n  transition: all 0.15s ease;\n  white-space: nowrap;\n}\n\n.nav-icon { font-size: 0.9rem; }\n\n.nav a:hover {\n  background: #eef2ff;\n  color: #1a56db;\n}\n\n.nav a.active {\n  background: #1a56db;\n  color: #ffffff;\n  font-weight: 600;\n  box-shadow: 0 2px 8px rgba(26, 86, 219, 0.25);\n}\n\n/* =========================\n   ACTIONS\n========================= */\n.actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-shrink: 0;\n}\n\n.btn-primary {\n  display: inline-flex;\n  align-items: center;\n  gap: 7px;\n  background: #1a56db;\n  color: #fff;\n  padding: 8px 16px;\n  border-radius: 8px;\n  font-size: 0.82rem;\n  font-weight: 600;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  text-decoration: none;\n  transition: all 0.15s ease;\n  white-space: nowrap;\n  box-shadow: 0 2px 8px rgba(26, 86, 219, 0.3);\n}\n\n.btn-primary:hover {\n  background: #1447c0;\n  transform: translateY(-1px);\n  box-shadow: 0 4px 14px rgba(26, 86, 219, 0.35);\n}\n\n/* =========================\n   USER MENU (wrapper)\n========================= */\n.user-menu {\n  position: relative;\n}\n\n/* =========================\n   USER PILL (trigger)\n========================= */\n.user-pill {\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  padding: 5px 12px 5px 5px;\n  border-radius: 999px;\n  border: 1.5px solid #e2e8f0;\n  background: #f8fafc;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  outline: none;\n}\n\n.user-pill:hover,\n.user-menu.open .user-pill {\n  border-color: #1a56db;\n  background: #eef2ff;\n  box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.1);\n}\n\n.avatar {\n  width: 30px;\n  height: 30px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #1a56db 0%, #3b82f6 100%);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.7rem;\n  font-weight: 700;\n  color: #ffffff;\n  letter-spacing: 0.03em;\n  flex-shrink: 0;\n  box-shadow: 0 2px 6px rgba(26, 86, 219, 0.3);\n}\n\n.user-info {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 1px;\n}\n\n.user-name {\n  font-size: 0.8rem;\n  font-weight: 600;\n  color: #0f1f3d;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  line-height: 1.2;\n}\n\n.user-role {\n  font-size: 0.65rem;\n  color: #1a56db;\n  font-weight: 600;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  background: #dbeafe;\n  padding: 1px 7px;\n  border-radius: 999px;\n  line-height: 1.6;\n}\n\n.chevron {\n  color: #8a96a8;\n  transition: transform 0.2s ease;\n  flex-shrink: 0;\n}\n\n.user-menu.open .chevron {\n  transform: rotate(180deg);\n}\n\n/* =========================\n   DROPDOWN\n========================= */\n.dropdown {\n  position: absolute;\n  top: calc(100% + 10px);\n  right: 0;\n  width: 240px;\n  background: #ffffff;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  box-shadow: 0 8px 32px rgba(15, 31, 61, 0.12), 0 2px 8px rgba(15, 31, 61, 0.06);\n  overflow: hidden;\n  animation: dropdownIn 0.18s ease;\n  z-index: 200;\n}\n\n@keyframes dropdownIn {\n  from { opacity: 0; transform: translateY(-8px) scale(0.97); }\n  to   { opacity: 1; transform: translateY(0) scale(1); }\n}\n\n/* Dropdown header */\n.dropdown-header {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 16px;\n  background: linear-gradient(135deg, #eef2ff 0%, #f0f7ff 100%);\n}\n\n.dropdown-avatar {\n  width: 42px;\n  height: 42px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #1a56db 0%, #3b82f6 100%);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.85rem;\n  font-weight: 700;\n  color: #ffffff;\n  letter-spacing: 0.03em;\n  flex-shrink: 0;\n  box-shadow: 0 3px 10px rgba(26, 86, 219, 0.35);\n}\n\n.dropdown-user-info {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.dropdown-name {\n  font-size: 0.88rem;\n  font-weight: 700;\n  color: #0f1f3d;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  line-height: 1.2;\n  text-transform: capitalize;\n}\n\n.dropdown-role-badge {\n  display: inline-block;\n  font-size: 0.65rem;\n  font-weight: 700;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  color: #1a56db;\n  background: #dbeafe;\n  padding: 2px 8px;\n  border-radius: 999px;\n  line-height: 1.6;\n}\n\n/* Divider */\n.dropdown-divider {\n  height: 1px;\n  background: #f1f5f9;\n  margin: 0;\n}\n\n/* Section */\n.dropdown-section {\n  padding: 6px;\n}\n\n/* Item */\n.dropdown-item {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  width: 100%;\n  padding: 9px 12px;\n  border: none;\n  border-radius: 8px;\n  background: transparent;\n  font-size: 0.83rem;\n  font-weight: 500;\n  font-family: 'DM Sans', 'Segoe UI', sans-serif;\n  color: #374151;\n  cursor: pointer;\n  transition: background 0.12s ease, color 0.12s ease;\n  text-align: left;\n}\n\n.dropdown-item:hover:not([disabled]) {\n  background: #f1f5f9;\n  color: #0f1f3d;\n}\n\n.dropdown-item[disabled] {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n\n.dropdown-item svg {\n  flex-shrink: 0;\n  color: #8a96a8;\n}\n\n.dropdown-item:hover:not([disabled]) svg {\n  color: #1a56db;\n}\n\n/* Badge \"Bient\u00F4t\" */\n.dropdown-badge-soon {\n  margin-left: auto;\n  font-size: 0.6rem;\n  font-weight: 600;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  color: #64748b;\n  background: #f1f5f9;\n  padding: 2px 7px;\n  border-radius: 999px;\n}\n\n/* Danger item */\n.dropdown-item--danger {\n  color: #dc2626;\n}\n\n.dropdown-item--danger svg {\n  color: #dc2626;\n}\n\n.dropdown-item--danger:hover {\n  background: #fef2f2 !important;\n  color: #b91c1c !important;\n}\n\n.dropdown-item--danger:hover svg {\n  color: #b91c1c !important;\n}\n\n/* =========================\n   MAIN\n========================= */\n.app-main {\n  padding: 32px 40px 64px;\n  min-height: calc(100vh - 66px - 49px);\n  background: #f8fafc;\n}\n\n/* =========================\n   FOOTER\n========================= */\n.app-footer {\n  text-align: center;\n  color: #8a96a8;\n  padding: 14px 20px;\n  font-size: 0.78rem;\n  border-top: 1px solid #e2e8f0;\n  background: #ffffff;\n  letter-spacing: 0.02em;\n}\n\n/* =========================\n   RESPONSIVE\n========================= */\n@media (max-width: 1100px) {\n  .brand-subtitle { display: none; }\n  .nav a { padding: 6px 10px; font-size: 0.8rem; }\n  .header-inner { padding: 0 24px; }\n}\n\n@media (max-width: 820px) {\n  .header-inner {\n    flex-wrap: wrap;\n    height: auto;\n    padding: 12px 20px;\n    gap: 10px;\n  }\n  .nav {\n    order: 3;\n    width: 100%;\n    justify-content: flex-start;\n    overflow-x: auto;\n    padding-bottom: 4px;\n    scrollbar-width: none;\n  }\n  .nav::-webkit-scrollbar { display: none; }\n  .brand-logo { height: 32px; }\n  .brand-title { font-size: 0.85rem; }\n  .app-main { padding: 20px; }\n  .user-info { display: none; }\n  .chevron { display: none; }\n  .dropdown { right: -10px; width: 220px; }\n}\n"] }]
    }], null, { onDocumentClick: [{
            type: HostListener,
            args: ['document:click', ['$event']]
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(AppComponent, { className: "AppComponent", filePath: "src/app/app.component.ts", lineNumber: 13 }); })();
