import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as i0 from "@angular/core";
import * as i1 from "../../services/auth.service";
export class AccessDeniedComponent {
    constructor(auth) {
        this.auth = auth;
    }
    get fallbackRoute() {
        return this.auth.getDefaultRoute();
    }
    static { this.ɵfac = function AccessDeniedComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || AccessDeniedComponent)(i0.ɵɵdirectiveInject(i1.AuthService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: AccessDeniedComponent, selectors: [["app-access-denied"]], decls: 7, vars: 1, consts: [[1, "card", "denied"], [1, "btn-primary", 3, "routerLink"]], template: function AccessDeniedComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "h1");
            i0.ɵɵtext(2, "Acces refuse");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(3, "p");
            i0.ɵɵtext(4, "Vous etes connecte, mais vous n'avez pas la permission pour ouvrir ce module.");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "a", 1);
            i0.ɵɵtext(6, "Retourner au tableau autorise");
            i0.ɵɵelementEnd()();
        } if (rf & 2) {
            i0.ɵɵadvance(5);
            i0.ɵɵproperty("routerLink", ctx.fallbackRoute);
        } }, dependencies: [CommonModule, RouterLink], styles: [".denied[_ngcontent-%COMP%] {\n  max-width: 680px;\n  margin: 40px auto;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AccessDeniedComponent, [{
        type: Component,
        args: [{ selector: 'app-access-denied', standalone: true, imports: [CommonModule, RouterLink], template: "<section class=\"card denied\">\n  <h1>Acces refuse</h1>\n  <p>Vous etes connecte, mais vous n'avez pas la permission pour ouvrir ce module.</p>\n  <a class=\"btn-primary\" [routerLink]=\"fallbackRoute\">Retourner au tableau autorise</a>\n</section>\n", styles: [".denied {\n  max-width: 680px;\n  margin: 40px auto;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n"] }]
    }], () => [{ type: i1.AuthService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(AccessDeniedComponent, { className: "AccessDeniedComponent", filePath: "src/app/components/access-denied/access-denied.component.ts", lineNumber: 13 }); })();
