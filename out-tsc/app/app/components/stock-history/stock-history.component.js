import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, startWith, takeUntil } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "../../services/stock-store.service";
import * as i3 from "@angular/common";
function StockHistoryComponent_div_89_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 22)(1, "div");
    i0.ɵɵtext(2);
    i0.ɵɵpipe(3, "date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "div", 23);
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "div");
    i0.ɵɵtext(7);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "div");
    i0.ɵɵtext(9);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "div");
    i0.ɵɵtext(11);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(12, "div", 23);
    i0.ɵɵtext(13);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "div", 23);
    i0.ɵɵtext(15);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(16, "div", 23);
    i0.ɵɵtext(17);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(18, "div");
    i0.ɵɵtext(19);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(20, "div");
    i0.ɵɵtext(21);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const row_r1 = ctx.$implicit;
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(3, 10, row_r1.movement.at, "dd/MM/yyyy HH:mm"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(row_r1.movement.reference);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r1.category);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r1.movement.color);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.formatType(row_r1.movement.type));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.formatDelta(row_r1.movement.delta));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r1.movement.before);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r1.movement.after);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(row_r1.movement.reason);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r1.actorLabel(row_r1.movement));
} }
function StockHistoryComponent_div_90_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 24);
    i0.ɵɵtext(1, " Aucun mouvement pour ce mois. ");
    i0.ɵɵelementEnd();
} }
export class StockHistoryComponent {
    constructor(fb, store) {
        this.fb = fb;
        this.store = store;
        this.destroy$ = new Subject();
        this.filters = this.fb.group({
            month: [this.currentMonth()],
            reference: [''],
            color: ['all'],
            actor: [''],
            category: ['all']
        });
        this.summary = {
            inTotal: 0,
            outTotal: 0,
            net: 0,
            count: 0
        };
        this.movements = [];
    }
    ngOnInit() {
        combineLatest([
            this.store.movements$,
            this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()))
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([movements, filters]) => {
            const month = filters.month ?? this.currentMonth();
            const reference = (filters.reference ?? '').trim().toLowerCase();
            const color = filters.color ?? 'all';
            const actor = (filters.actor ?? '').trim().toLowerCase();
            const category = filters.category ?? 'all';
            const monthMovements = movements.filter((movement) => movement.at.startsWith(month));
            this.summary = this.store.getMonthlySummary(month);
            const filtered = monthMovements.filter((movement) => {
                const refText = `${movement.reference} ${movement.label}`.toLowerCase();
                const matchesReference = !reference || refText.includes(reference);
                const matchesColor = color === 'all' || movement.color === color;
                const actorText = `${movement.actor ?? ''} ${movement.username ?? ''} ${movement.employeeId ?? ''}`.toLowerCase();
                const matchesActor = !actor || actorText.includes(actor);
                const matchesCategory = category === 'all' || movement.category === category;
                return matchesReference && matchesColor && matchesActor && matchesCategory;
            });
            this.movements = filtered.map((movement) => ({
                movement,
                category: movement.category
            }));
        });
        void this.store.load();
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    formatType(type) {
        if (type === 'IN')
            return 'Entree';
        if (type === 'OUT')
            return 'Sortie';
        return 'Ajust';
    }
    formatDelta(value) {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value}`;
    }
    actorLabel(movement) {
        if (movement.actor && movement.actor.trim())
            return movement.actor;
        if (movement.username && movement.username.trim())
            return movement.username;
        return movement.employeeId ?? 'unknown';
    }
    currentMonth() {
        return new Date().toISOString().slice(0, 7);
    }
    static { this.ɵfac = function StockHistoryComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || StockHistoryComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i2.StockStoreService)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: StockHistoryComponent, selectors: [["app-stock-history"]], decls: 91, vars: 7, consts: [[1, "panel"], [1, "panel-header"], [1, "card"], [1, "filters", 3, "formGroup"], [1, "field"], ["type", "month", "formControlName", "month", 1, "input"], ["type", "search", "formControlName", "reference", "placeholder", "Reference", 1, "input"], ["formControlName", "color", 1, "input"], ["value", "all"], ["value", "blanc"], ["value", "gris"], ["value", "noir"], ["type", "search", "formControlName", "actor", "placeholder", "Nom", 1, "input"], ["formControlName", "category", 1, "input"], ["value", "profil"], ["value", "accessoire"], ["value", "joint"], [1, "summary"], [1, "table"], [1, "table-row", "table-head"], ["class", "table-row", 4, "ngFor", "ngForOf"], ["class", "empty", 4, "ngIf"], [1, "table-row"], [1, "mono"], [1, "empty"]], template: function StockHistoryComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4, "Historique Stock");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "Journal des mouvements par mois.");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(7, "section", 2)(8, "div", 3)(9, "label", 4)(10, "span");
            i0.ɵɵtext(11, "Mois");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(12, "input", 5);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(13, "label", 4)(14, "span");
            i0.ɵɵtext(15, "Reference");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(16, "input", 6);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(17, "label", 4)(18, "span");
            i0.ɵɵtext(19, "Couleur");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(20, "select", 7)(21, "option", 8);
            i0.ɵɵtext(22, "Toutes");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(23, "option", 9);
            i0.ɵɵtext(24, "Blanc");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(25, "option", 10);
            i0.ɵɵtext(26, "Gris");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(27, "option", 11);
            i0.ɵɵtext(28, "Noir");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(29, "label", 4)(30, "span");
            i0.ɵɵtext(31, "Employe");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(32, "input", 12);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(33, "label", 4)(34, "span");
            i0.ɵɵtext(35, "Categorie");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(36, "select", 13)(37, "option", 8);
            i0.ɵɵtext(38, "Toutes");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(39, "option", 14);
            i0.ɵɵtext(40, "Profils");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(41, "option", 15);
            i0.ɵɵtext(42, "Accessoires");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(43, "option", 16);
            i0.ɵɵtext(44, "Joints");
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(45, "div", 17)(46, "div")(47, "span");
            i0.ɵɵtext(48, "Total entrees");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(49, "strong");
            i0.ɵɵtext(50);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(51, "div")(52, "span");
            i0.ɵɵtext(53, "Total sorties");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(54, "strong");
            i0.ɵɵtext(55);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(56, "div")(57, "span");
            i0.ɵɵtext(58, "Net");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(59, "strong");
            i0.ɵɵtext(60);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(61, "div")(62, "span");
            i0.ɵɵtext(63, "Mouvements");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(64, "strong");
            i0.ɵɵtext(65);
            i0.ɵɵelementEnd()()()();
            i0.ɵɵelementStart(66, "section", 2)(67, "div", 18)(68, "div", 19)(69, "div");
            i0.ɵɵtext(70, "Date");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(71, "div");
            i0.ɵɵtext(72, "Reference");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(73, "div");
            i0.ɵɵtext(74, "Categorie");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(75, "div");
            i0.ɵɵtext(76, "Couleur");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(77, "div");
            i0.ɵɵtext(78, "Type");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(79, "div");
            i0.ɵɵtext(80, "Delta");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(81, "div");
            i0.ɵɵtext(82, "Avant");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(83, "div");
            i0.ɵɵtext(84, "Apres");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(85, "div");
            i0.ɵɵtext(86, "Raison");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(87, "div");
            i0.ɵɵtext(88, "Employe");
            i0.ɵɵelementEnd()();
            i0.ɵɵtemplate(89, StockHistoryComponent_div_89_Template, 22, 13, "div", 20);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(90, StockHistoryComponent_div_90_Template, 2, 0, "div", 21);
            i0.ɵɵelementEnd()();
        } if (rf & 2) {
            i0.ɵɵadvance(8);
            i0.ɵɵproperty("formGroup", ctx.filters);
            i0.ɵɵadvance(42);
            i0.ɵɵtextInterpolate(ctx.summary.inTotal);
            i0.ɵɵadvance(5);
            i0.ɵɵtextInterpolate(ctx.summary.outTotal);
            i0.ɵɵadvance(5);
            i0.ɵɵtextInterpolate(ctx.summary.net);
            i0.ɵɵadvance(5);
            i0.ɵɵtextInterpolate(ctx.summary.count);
            i0.ɵɵadvance(24);
            i0.ɵɵproperty("ngForOf", ctx.movements);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.movements.length === 0);
        } }, dependencies: [CommonModule, i3.NgForOf, i3.NgIf, ReactiveFormsModule, i1.NgSelectOption, i1.ɵNgSelectMultipleOption, i1.DefaultValueAccessor, i1.SelectControlValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.FormGroupDirective, i1.FormControlName, i3.DatePipe], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.filters[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(5, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.summary[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 12px;\n  margin-top: 16px;\n}\n\n.summary[_ngcontent-%COMP%]   div[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 16px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n}\n\n.table[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.table-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1fr 1fr 0.8fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr 1.2fr 1fr;\n  gap: 12px;\n  align-items: center;\n  padding: 12px 0;\n  border-bottom: 1px solid var(--border);\n}\n\n.table-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted);\n  padding: 20px 0 10px;\n}\n\n@media (max-width: 980px) {\n  .filters[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .summary[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .table-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(StockHistoryComponent, [{
        type: Component,
        args: [{ selector: 'app-stock-history', standalone: true, imports: [CommonModule, ReactiveFormsModule], template: "<section class=\"panel\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Historique Stock</h1>\n      <p>Journal des mouvements par mois.</p>\n    </div>\n  </div>\n\n  <section class=\"card\">\n    <div class=\"filters\" [formGroup]=\"filters\">\n      <label class=\"field\">\n        <span>Mois</span>\n        <input class=\"input\" type=\"month\" formControlName=\"month\">\n      </label>\n      <label class=\"field\">\n        <span>Reference</span>\n        <input class=\"input\" type=\"search\" formControlName=\"reference\" placeholder=\"Reference\">\n      </label>\n      <label class=\"field\">\n        <span>Couleur</span>\n        <select class=\"input\" formControlName=\"color\">\n          <option value=\"all\">Toutes</option>\n          <option value=\"blanc\">Blanc</option>\n          <option value=\"gris\">Gris</option>\n          <option value=\"noir\">Noir</option>\n        </select>\n      </label>\n      <label class=\"field\">\n        <span>Employe</span>\n        <input class=\"input\" type=\"search\" formControlName=\"actor\" placeholder=\"Nom\">\n      </label>\n      <label class=\"field\">\n        <span>Categorie</span>\n        <select class=\"input\" formControlName=\"category\">\n          <option value=\"all\">Toutes</option>\n          <option value=\"profil\">Profils</option>\n          <option value=\"accessoire\">Accessoires</option>\n          <option value=\"joint\">Joints</option>\n        </select>\n      </label>\n    </div>\n\n    <div class=\"summary\">\n      <div>\n        <span>Total entrees</span>\n        <strong>{{ summary.inTotal }}</strong>\n      </div>\n      <div>\n        <span>Total sorties</span>\n        <strong>{{ summary.outTotal }}</strong>\n      </div>\n      <div>\n        <span>Net</span>\n        <strong>{{ summary.net }}</strong>\n      </div>\n      <div>\n        <span>Mouvements</span>\n        <strong>{{ summary.count }}</strong>\n      </div>\n    </div>\n  </section>\n\n  <section class=\"card\">\n    <div class=\"table\">\n      <div class=\"table-row table-head\">\n        <div>Date</div>\n        <div>Reference</div>\n        <div>Categorie</div>\n        <div>Couleur</div>\n        <div>Type</div>\n        <div>Delta</div>\n        <div>Avant</div>\n        <div>Apres</div>\n        <div>Raison</div>\n        <div>Employe</div>\n      </div>\n\n      <div class=\"table-row\" *ngFor=\"let row of movements\">\n        <div>{{ row.movement.at | date:'dd/MM/yyyy HH:mm' }}</div>\n        <div class=\"mono\">{{ row.movement.reference }}</div>\n        <div>{{ row.category }}</div>\n        <div>{{ row.movement.color }}</div>\n        <div>{{ formatType(row.movement.type) }}</div>\n        <div class=\"mono\">{{ formatDelta(row.movement.delta) }}</div>\n        <div class=\"mono\">{{ row.movement.before }}</div>\n        <div class=\"mono\">{{ row.movement.after }}</div>\n        <div>{{ row.movement.reason }}</div>\n        <div>{{ actorLabel(row.movement) }}</div>\n      </div>\n    </div>\n\n    <div class=\"empty\" *ngIf=\"movements.length === 0\">\n      Aucun mouvement pour ce mois.\n    </div>\n  </section>\n</section>\n", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.filters {\n  display: grid;\n  grid-template-columns: repeat(5, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.summary {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 12px;\n  margin-top: 16px;\n}\n\n.summary div {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px 16px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n}\n\n.table {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.table-row {\n  display: grid;\n  grid-template-columns: 1fr 1fr 0.8fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr 1.2fr 1fr;\n  gap: 12px;\n  align-items: center;\n  padding: 12px 0;\n  border-bottom: 1px solid var(--border);\n}\n\n.table-head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.empty {\n  text-align: center;\n  color: var(--muted);\n  padding: 20px 0 10px;\n}\n\n@media (max-width: 980px) {\n  .filters {\n    grid-template-columns: 1fr;\n  }\n\n  .summary {\n    grid-template-columns: 1fr;\n  }\n\n  .table-row {\n    grid-template-columns: 1fr;\n  }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i2.StockStoreService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(StockHistoryComponent, { className: "StockHistoryComponent", filePath: "src/app/components/stock-history/stock-history.component.ts", lineNumber: 21 }); })();
