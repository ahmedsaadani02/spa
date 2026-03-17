import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, startWith, takeUntil } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "@angular/common";
function EstimationComponent_div_28_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 42);
    i0.ɵɵelement(1, "input", 43)(2, "input", 44)(3, "input", 45);
    i0.ɵɵelementStart(4, "button", 46);
    i0.ɵɵlistener("click", function EstimationComponent_div_28_Template_button_click_4_listener() { const i_r2 = i0.ɵɵrestoreView(_r1).index; const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.removeSerie(i_r2)); });
    i0.ɵɵtext(5, " Supprimer ");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const i_r2 = ctx.index;
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵproperty("formGroupName", i_r2);
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("disabled", ctx_r2.series.length <= 1);
} }
function EstimationComponent_label_53_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 14)(1, "span");
    i0.ɵɵtext(2, "Largeur (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(3, "input", 47);
    i0.ɵɵelementEnd();
} }
function EstimationComponent_label_54_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 14)(1, "span");
    i0.ɵɵtext(2, "Hauteur (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(3, "input", 48);
    i0.ɵɵelementEnd();
} }
function EstimationComponent_label_55_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 14)(1, "span");
    i0.ɵɵtext(2, "Profondeur (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(3, "input", 49);
    i0.ɵɵelementEnd();
} }
function EstimationComponent_label_56_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 31);
    i0.ɵɵelement(1, "input", 50);
    i0.ɵɵelementStart(2, "span");
    i0.ɵɵtext(3, "Ajouter renfort (traverse)");
    i0.ɵɵelementEnd()();
} }
function EstimationComponent_div_57_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 12);
    i0.ɵɵtext(1, " Clique sur ");
    i0.ɵɵelementStart(2, "strong");
    i0.ɵɵtext(3, "G\u00E9n\u00E9rer branches");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(4, " pour cr\u00E9er automatiquement les montants et traverses. ");
    i0.ɵɵelementEnd();
} }
function EstimationComponent_div_77_option_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "option", 59);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const opt_r5 = ctx.$implicit;
    i0.ɵɵproperty("value", opt_r5.id);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(opt_r5.nom);
} }
function EstimationComponent_div_77_Template(rf, ctx) { if (rf & 1) {
    const _r4 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 51);
    i0.ɵɵelement(1, "input", 52);
    i0.ɵɵelementStart(2, "select", 53);
    i0.ɵɵtemplate(3, EstimationComponent_div_77_option_3_Template, 2, 2, "option", 54);
    i0.ɵɵelementEnd();
    i0.ɵɵelement(4, "input", 55)(5, "input", 56);
    i0.ɵɵelementStart(6, "div", 57);
    i0.ɵɵtext(7);
    i0.ɵɵpipe(8, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "button", 58);
    i0.ɵɵlistener("click", function EstimationComponent_div_77_Template_button_click_9_listener() { const i_r6 = i0.ɵɵrestoreView(_r4).index; const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.removePiece(i_r6)); });
    i0.ɵɵtext(10, " Supprimer ");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const i_r6 = ctx.index;
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵproperty("formGroupName", i_r6);
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("ngForOf", ctx_r2.seriesOptions);
    i0.ɵɵadvance(4);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(8, 3, ctx_r2.pieceTotalCm(i_r6), "1.0-1"));
} }
function EstimationComponent_div_78_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 60);
    i0.ɵɵtext(1, " Aucune branche. Clique sur ");
    i0.ɵɵelementStart(2, "strong");
    i0.ɵɵtext(3, "G\u00E9n\u00E9rer branches");
    i0.ɵɵelementEnd();
    i0.ɵɵtext(4, " ou ajoute manuellement. ");
    i0.ɵɵelementEnd();
} }
function EstimationComponent_label_108_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 14)(1, "span");
    i0.ɵɵtext(2, "Surface verre (m\u00B2)");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(3, "input", 61);
    i0.ɵɵelementEnd();
} }
function EstimationComponent_div_109_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 12);
    i0.ɵɵtext(1, " Surface verre estim\u00E9e : ");
    i0.ɵɵelementStart(2, "strong");
    i0.ɵɵtext(3);
    i0.ɵɵpipe(4, "number");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(4, 1, ctx_r2.result.surfaceVerreM2, "1.2-2"), " m\u00B2");
} }
function EstimationComponent_div_125_Template(rf, ctx) { if (rf & 1) {
    const _r7 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 62);
    i0.ɵɵelement(1, "input", 63)(2, "input", 64)(3, "input", 65);
    i0.ɵɵelementStart(4, "button", 58);
    i0.ɵɵlistener("click", function EstimationComponent_div_125_Template_button_click_4_listener() { const i_r8 = i0.ɵɵrestoreView(_r7).index; const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.removeAccessory(i_r8)); });
    i0.ɵɵtext(5, "Supprimer");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const i_r8 = ctx.index;
    i0.ɵɵproperty("formGroupName", i_r8);
} }
function EstimationComponent_div_126_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 60);
    i0.ɵɵtext(1, " Aucun accessoire ajout\u00E9. ");
    i0.ɵɵelementEnd();
} }
function EstimationComponent_div_187_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 60);
    i0.ɵɵtext(1, " Aucune s\u00E9rie \u00E0 afficher. ");
    i0.ɵɵelementEnd();
} }
function EstimationComponent_div_188_div_64_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 12);
    i0.ɵɵtext(1, " Certaines pi\u00E8ces d\u00E9passent la longueur de barre : d\u00E9coupe impossible pour ces pi\u00E8ces. ");
    i0.ɵɵelementEnd();
} }
function EstimationComponent_div_188_tr_79_span_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 73);
    i0.ɵɵtext(1, "Impossible");
    i0.ɵɵelementEnd();
} }
function EstimationComponent_div_188_tr_79_span_6_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span");
    i0.ɵɵtext(1);
    i0.ɵɵpipe(2, "number");
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const piece_r9 = ctx.$implicit;
    const last_r10 = ctx.last;
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate3(" ", piece_r9.designation, " (", i0.ɵɵpipeBind2(2, 3, piece_r9.longueurCm, "1.0-1"), " cm)", !last_r10 ? ", " : "", " ");
} }
function EstimationComponent_div_188_tr_79_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td");
    i0.ɵɵtext(2);
    i0.ɵɵtemplate(3, EstimationComponent_div_188_tr_79_span_3_Template, 2, 0, "span", 71);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "td")(5, "div", 72);
    i0.ɵɵtemplate(6, EstimationComponent_div_188_tr_79_span_6_Template, 3, 6, "span", 69);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(7, "td", 68);
    i0.ɵɵtext(8);
    i0.ɵɵpipe(9, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "td", 68);
    i0.ɵɵtext(11);
    i0.ɵɵpipe(12, "number");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const bar_r11 = ctx.$implicit;
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1(" #", bar_r11.index, " ");
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", bar_r11.impossible);
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("ngForOf", bar_r11.pieces);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(9, 5, bar_r11.pertesCm, "1.0-1"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(12, 8, bar_r11.chuteCm, "1.0-1"));
} }
function EstimationComponent_div_188_tr_80_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td", 74);
    i0.ɵɵtext(2, "Aucune barre.");
    i0.ɵɵelementEnd()();
} }
function EstimationComponent_div_188_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 66)(1, "table", 67)(2, "thead")(3, "tr")(4, "th");
    i0.ɵɵtext(5, "S\u00E9rie");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "th", 68);
    i0.ɵɵtext(7, "Barre (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "th", 68);
    i0.ɵɵtext(9, "Pi\u00E8ces (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "th", 68);
    i0.ɵɵtext(11, "Pertes (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(12, "th", 68);
    i0.ɵɵtext(13, "Conso (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "th", 68);
    i0.ɵɵtext(15, "Nb barres");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(16, "th", 68);
    i0.ɵɵtext(17, "Achet\u00E9 (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(18, "th", 68);
    i0.ɵɵtext(19, "Chute (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(20, "th", 68);
    i0.ɵɵtext(21, "Prix/cm (DT)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(22, "th", 68);
    i0.ɵɵtext(23, "Co\u00FBt achet\u00E9 (DT)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(24, "th", 68);
    i0.ɵɵtext(25, "Co\u00FBt consomm\u00E9 (DT)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(26, "th", 68);
    i0.ɵɵtext(27, "Co\u00FBt chute (DT)");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(28, "tbody")(29, "tr")(30, "td");
    i0.ɵɵtext(31);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(32, "td", 68);
    i0.ɵɵtext(33);
    i0.ɵɵpipe(34, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(35, "td", 68);
    i0.ɵɵtext(36);
    i0.ɵɵpipe(37, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(38, "td", 68);
    i0.ɵɵtext(39);
    i0.ɵɵpipe(40, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(41, "td", 68);
    i0.ɵɵtext(42);
    i0.ɵɵpipe(43, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(44, "td", 68);
    i0.ɵɵtext(45);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(46, "td", 68);
    i0.ɵɵtext(47);
    i0.ɵɵpipe(48, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(49, "td", 68);
    i0.ɵɵtext(50);
    i0.ɵɵpipe(51, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(52, "td", 68);
    i0.ɵɵtext(53);
    i0.ɵɵpipe(54, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(55, "td", 68);
    i0.ɵɵtext(56);
    i0.ɵɵpipe(57, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(58, "td", 68);
    i0.ɵɵtext(59);
    i0.ɵɵpipe(60, "number");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(61, "td", 68);
    i0.ɵɵtext(62);
    i0.ɵɵpipe(63, "number");
    i0.ɵɵelementEnd()()()();
    i0.ɵɵtemplate(64, EstimationComponent_div_188_div_64_Template, 2, 0, "div", 22);
    i0.ɵɵelementStart(65, "div", 40);
    i0.ɵɵtext(66);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(67, "table", 67)(68, "thead")(69, "tr")(70, "th");
    i0.ɵɵtext(71, "# Barre");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(72, "th");
    i0.ɵɵtext(73, "Pi\u00E8ces (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(74, "th", 68);
    i0.ɵɵtext(75, "Pertes (cm)");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(76, "th", 68);
    i0.ɵɵtext(77, "Chute (cm)");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(78, "tbody");
    i0.ɵɵtemplate(79, EstimationComponent_div_188_tr_79_Template, 13, 11, "tr", 69)(80, EstimationComponent_div_188_tr_80_Template, 3, 0, "tr", 70);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const s_r12 = ctx.$implicit;
    i0.ɵɵadvance(31);
    i0.ɵɵtextInterpolate(s_r12.nom);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(34, 16, s_r12.longueurBarreCm, "1.0-1"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(37, 19, s_r12.longueurPiecesCm, "1.0-1"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(40, 22, s_r12.pertesCm, "1.0-1"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(43, 25, s_r12.consommationReelleCm, "1.0-1"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(s_r12.nbBarres);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(48, 28, s_r12.longueurAcheteeCm, "1.0-1"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(51, 31, s_r12.chuteTotaleCm, "1.0-1"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(54, 34, s_r12.prixParCm, "1.4-4"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(57, 37, s_r12.coutAchete, "1.2-2"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(60, 40, s_r12.coutConsomme, "1.2-2"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(63, 43, s_r12.coutChute, "1.2-2"));
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngIf", s_r12.hasImpossible);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("D\u00E9tail des barres \u2014 ", s_r12.nom);
    i0.ɵɵadvance(13);
    i0.ɵɵproperty("ngForOf", s_r12.bars);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", s_r12.bars.length === 0);
} }
export class EstimationComponent {
    constructor(fb) {
        this.fb = fb;
        this.destroy$ = new Subject();
        this.form = this.fb.group({
            series: this.fb.array([]),
            produit: this.fb.group({
                type: ['fenetre'],
                largeur: [120, [Validators.min(0)]],
                hauteur: [100, [Validators.min(0)]],
                profondeur: [40, [Validators.min(0)]],
                cadreRenfort: [false]
            }),
            pieces: this.fb.array([]),
            options: this.fb.group({
                margeChute: [0],
                pertesCoupeCm: [0.2]
            }),
            verre: this.fb.group({
                activerVerre: [false],
                prixVerreM2: [0],
                surfaceVerreM2Manuelle: [0, [Validators.min(0)]]
            }),
            accessoires: this.fb.array([])
        });
        this.result = {
            consommationTotaleCm: 0,
            longueurAcheteeTotaleCm: 0,
            chuteTotaleCm: 0,
            coutBarresAchete: 0,
            coutBarresConsomme: 0,
            coutBarresChute: 0,
            surfaceVerreM2: 0,
            coutVerre: 0,
            coutAccessoires: 0,
            coutTotal: 0,
            series: []
        };
        // séries par défaut
        this.addSerie('Série 40', 650, 0);
        this.addSerie('Série 76', 650, 0);
    }
    ngOnInit() {
        // par défaut : générer une fenêtre
        this.generatePieces();
        this.form.valueChanges
            .pipe(startWith(this.form.getRawValue()), takeUntil(this.destroy$))
            .subscribe(() => this.compute());
    }
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    // ---------- getters ----------
    get series() {
        return this.form.get('series');
    }
    get pieces() {
        return this.form.get('pieces');
    }
    get accessoires() {
        return this.form.get('accessoires');
    }
    get productType() {
        return this.form.get('produit.type')?.value ?? 'fenetre';
    }
    get seriesOptions() {
        const values = this.series.getRawValue() ?? [];
        return values.map(v => ({ id: v.id, nom: (v.nom || v.id).trim() }));
    }
    // ---------- UI helpers ----------
    pieceTotalCm(index) {
        const p = this.pieces.at(index).value;
        return this.round1(this.toNumber(p.longueur) * Math.max(1, Math.floor(this.toNumber(p.quantite))));
    }
    // ---------- Séries ----------
    addSerie(nom = 'Série', longueurBarre = 650, prixBarre = 0) {
        this.series.push(this.createSerie({ nom, longueurBarre, prixBarre }));
        // si aucune pièce n'a de série, on peut assigner la première
        if (this.pieces.length > 0)
            this.ensurePiecesSerie();
    }
    removeSerie(index) {
        if (this.series.length <= 1)
            return;
        const removed = this.series.at(index).value?.id;
        this.series.removeAt(index);
        // re-assigner les pièces qui pointaient vers la série supprimée
        const firstId = this.series.at(0).value?.id;
        this.pieces.controls.forEach(ctrl => {
            if (ctrl.get('serieId')?.value === removed) {
                ctrl.get('serieId')?.setValue(firstId);
            }
        });
    }
    createSerie(initial) {
        return this.fb.group({
            id: [initial?.id ?? this.createId('serie')],
            nom: [initial?.nom ?? 'Série', Validators.required],
            longueurBarre: [initial?.longueurBarre ?? 650, [Validators.required, Validators.min(1)]],
            prixBarre: [initial?.prixBarre ?? 0, [Validators.min(0)]]
        });
    }
    // ---------- Pièces / branches ----------
    addPiece() {
        const firstSerieId = this.series.at(0).value?.id ?? '';
        this.pieces.push(this.createPiece({ serieId: firstSerieId }));
    }
    removePiece(index) {
        this.pieces.removeAt(index);
    }
    createPiece(initial) {
        return this.fb.group({
            designation: [initial?.designation ?? '', Validators.required],
            serieId: [initial?.serieId ?? '', Validators.required],
            longueur: [initial?.longueur ?? 0, [Validators.required, Validators.min(0)]],
            quantite: [initial?.quantite ?? 1, [Validators.required, Validators.min(1)]]
        });
    }
    ensurePiecesSerie() {
        const firstSerieId = this.series.at(0).value?.id ?? '';
        this.pieces.controls.forEach(ctrl => {
            const val = ctrl.get('serieId')?.value ?? '';
            if (!val)
                ctrl.get('serieId')?.setValue(firstSerieId);
        });
    }
    // Génère automatiquement les branches selon dimensions
    generatePieces() {
        const raw = this.form.getRawValue();
        const type = raw.produit?.type ?? 'fenetre';
        const largeur = this.toNumber(raw.produit?.largeur);
        const hauteur = this.toNumber(raw.produit?.hauteur);
        const profondeur = this.toNumber(raw.produit?.profondeur);
        const renfort = !!raw.produit?.cadreRenfort;
        const firstSerieId = this.series.at(0).value?.id ?? '';
        this.pieces.clear();
        if (type === 'custom') {
            // rien, l'utilisateur ajoute à la main
            return;
        }
        if (type === 'fenetre') {
            // 2 montants + 2 traverses
            this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
            this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
            return;
        }
        if (type === 'porte') {
            this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
            this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
            if (renfort) {
                this.pieces.push(this.createPiece({ designation: 'Renfort (traverse)', serieId: firstSerieId, longueur: largeur, quantite: 1 }));
            }
            return;
        }
        if (type === 'box') {
            // cadre (fenêtre) + 2 profondeurs
            this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
            this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
            this.pieces.push(this.createPiece({ designation: 'Profondeur', serieId: firstSerieId, longueur: profondeur, quantite: 2 }));
            return;
        }
    }
    // ---------- Accessoires ----------
    addAccessory() {
        this.accessoires.push(this.createAccessory());
    }
    removeAccessory(index) {
        this.accessoires.removeAt(index);
    }
    createAccessory() {
        return this.fb.group({
            designation: [''],
            quantite: [1, [Validators.min(0)]],
            prixUnitaire: [0, [Validators.min(0)]]
        });
    }
    // ---------- Reset ----------
    reset() {
        // garde les séries par défaut, mais reset valeurs
        const serieValues = this.series.getRawValue() ?? [];
        this.form.reset({
            produit: { type: 'fenetre', largeur: 120, hauteur: 100, profondeur: 40, cadreRenfort: false },
            options: { margeChute: 0, pertesCoupeCm: 0.2 },
            verre: { activerVerre: false, prixVerreM2: 0, surfaceVerreM2Manuelle: 0 },
            accessoires: []
        });
        // reset séries
        this.series.clear();
        if (serieValues.length > 0) {
            serieValues.forEach(s => this.addSerie(s.nom || 'Série', this.toNumber(s.longueurBarre) || 650, this.toNumber(s.prixBarre) || 0));
        }
        else {
            this.addSerie('Série 40', 650, 0);
            this.addSerie('Série 76', 650, 0);
        }
        this.accessoires.clear();
        this.generatePieces();
        this.compute();
    }
    // ---------- Print ----------
    print() {
        window.print();
    }
    // ---------- Compute ----------
    compute() {
        const raw = this.form.getRawValue();
        const series = (raw.series ?? []).map(s => ({
            id: s.id,
            nom: (s.nom ?? '').trim() || s.id,
            longueurBarre: Math.max(0, this.toNumber(s.longueurBarre)),
            prixBarre: Math.max(0, this.toNumber(s.prixBarre))
        }));
        const pieces = (raw.pieces ?? []);
        const pertesCoupeCm = Math.max(0, this.toNumber(raw.options?.pertesCoupeCm));
        const serieResults = series.map(serie => {
            const piecesSerie = pieces.filter(p => p.serieId === serie.id);
            const plan = this.buildCuttingPlan(piecesSerie, serie.longueurBarre, pertesCoupeCm);
            const prixParCm = serie.longueurBarre > 0 ? serie.prixBarre / serie.longueurBarre : 0;
            const coutAchete = plan.nbBarres * serie.prixBarre;
            const coutConsomme = plan.consommationReelleCm * prixParCm;
            const coutChute = Math.max(0, coutAchete - coutConsomme);
            return {
                id: serie.id,
                nom: serie.nom,
                longueurBarreCm: this.round1(serie.longueurBarre),
                prixBarre: this.round2(serie.prixBarre),
                longueurPiecesCm: this.round1(plan.longueurPiecesCm),
                pertesCm: this.round1(plan.pertesCm),
                consommationReelleCm: this.round1(plan.consommationReelleCm),
                nbBarres: plan.nbBarres,
                longueurAcheteeCm: this.round1(plan.longueurAcheteeCm),
                chuteTotaleCm: this.round1(plan.chuteTotaleCm),
                coutAchete: this.round2(coutAchete),
                prixParCm: this.round4(prixParCm),
                coutConsomme: this.round2(coutConsomme),
                coutChute: this.round2(coutChute),
                bars: plan.bars.map(bar => ({
                    ...bar,
                    pertesCm: this.round1(bar.pertesCm),
                    chuteCm: this.round1(bar.chuteCm),
                    longueurUtiliseeCm: this.round1(bar.longueurUtiliseeCm),
                    pieces: bar.pieces.map(piece => ({
                        ...piece,
                        longueurCm: this.round1(piece.longueurCm)
                    }))
                })),
                hasImpossible: plan.hasImpossible
            };
        });
        const consommationTotaleCm = this.round1(serieResults.reduce((s, r) => s + r.consommationReelleCm, 0));
        const longueurAcheteeTotaleCm = this.round1(serieResults.reduce((s, r) => s + r.longueurAcheteeCm, 0));
        const chuteTotaleCm = this.round1(serieResults.reduce((s, r) => s + r.chuteTotaleCm, 0));
        const coutBarresAchete = this.round2(serieResults.reduce((s, r) => s + r.coutAchete, 0));
        const coutBarresConsomme = this.round2(serieResults.reduce((s, r) => s + r.coutConsomme, 0));
        const coutBarresChute = this.round2(serieResults.reduce((s, r) => s + r.coutChute, 0));
        // verre (surface estimée par dimensions)
        const type = raw.produit?.type ?? 'fenetre';
        const largeurCm = Math.max(0, this.toNumber(raw.produit?.largeur));
        const hauteurCm = Math.max(0, this.toNumber(raw.produit?.hauteur));
        let surfaceVerreM2 = 0;
        if (type === 'custom') {
            surfaceVerreM2 = Math.max(0, this.toNumberWithComma(raw.verre?.surfaceVerreM2Manuelle));
        }
        else if (type === 'fenetre' || type === 'porte' || type === 'box') {
            surfaceVerreM2 = (largeurCm / 100) * (hauteurCm / 100);
        }
        const activerVerre = !!raw.verre?.activerVerre;
        const prixVerreM2 = Math.max(0, this.toNumberWithComma(raw.verre?.prixVerreM2));
        const coutVerre = activerVerre ? surfaceVerreM2 * prixVerreM2 : 0;
        // accessoires
        const accessoires = (raw.accessoires ?? []);
        const coutAccessoires = accessoires.reduce((sum, a) => {
            const q = Math.max(0, this.toNumber(a.quantite));
            const pu = Math.max(0, this.toNumber(a.prixUnitaire));
            return sum + q * pu;
        }, 0);
        const coutTotal = coutBarresAchete + coutVerre + coutAccessoires;
        this.result = {
            consommationTotaleCm,
            longueurAcheteeTotaleCm,
            chuteTotaleCm,
            coutBarresAchete,
            coutBarresConsomme,
            coutBarresChute,
            surfaceVerreM2: this.round2(surfaceVerreM2),
            coutVerre: this.round2(coutVerre),
            coutAccessoires: this.round2(coutAccessoires),
            coutTotal: this.round2(coutTotal),
            series: serieResults
        };
        // console.log('DEBUG verre', raw.verre, { surfaceVerreM2, prixVerreM2, activerVerre, coutVerre });
    }
    buildCuttingPlan(pieces, longueurBarreCm, pertesCoupeCm) {
        const expanded = [];
        pieces.forEach(p => {
            const lengthCm = Math.max(0, this.toNumber(p.longueur));
            const qty = Math.max(1, Math.floor(this.toNumber(p.quantite)));
            for (let i = 0; i < qty; i += 1) {
                expanded.push({ designation: (p.designation ?? '').trim() || 'Pièce', longueurCm: lengthCm });
            }
        });
        const bars = [];
        const feasibleBars = [];
        const feasiblePieces = [];
        let hasImpossible = false;
        const sortedPieces = [...expanded].sort((a, b) => b.longueurCm - a.longueurCm);
        sortedPieces.forEach(piece => {
            if (longueurBarreCm <= 0 || piece.longueurCm <= 0 || piece.longueurCm > longueurBarreCm) {
                hasImpossible = true;
                bars.push({
                    index: bars.length + 1,
                    pieces: [piece],
                    pertesCm: 0,
                    chuteCm: 0,
                    longueurUtiliseeCm: piece.longueurCm,
                    impossible: true
                });
                return;
            }
            feasiblePieces.push(piece);
            let placed = false;
            for (const bar of feasibleBars) {
                const usedPieces = bar.pieces.reduce((sum, p) => sum + p.longueurCm, 0);
                const nextPerte = (bar.pieces.length + 1) * pertesCoupeCm;
                const nextUsed = usedPieces + piece.longueurCm + nextPerte;
                if (nextUsed <= longueurBarreCm + 1e-6) {
                    bar.pieces.push(piece);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                const newBar = {
                    index: bars.length + 1,
                    pieces: [piece],
                    pertesCm: 0,
                    chuteCm: 0,
                    longueurUtiliseeCm: 0,
                    impossible: false
                };
                feasibleBars.push(newBar);
                bars.push(newBar);
            }
        });
        feasibleBars.forEach(bar => {
            const sumPieces = bar.pieces.reduce((sum, p) => sum + p.longueurCm, 0);
            bar.pertesCm = bar.pieces.length * pertesCoupeCm;
            bar.longueurUtiliseeCm = sumPieces + bar.pertesCm;
            bar.chuteCm = Math.max(0, longueurBarreCm - bar.longueurUtiliseeCm);
        });
        const longueurPiecesCm = feasiblePieces.reduce((sum, p) => sum + p.longueurCm, 0);
        const pertesCm = feasibleBars.reduce((sum, bar) => sum + bar.pertesCm, 0);
        const consommationReelleCm = longueurPiecesCm + pertesCm;
        const nbBarres = feasibleBars.length;
        const longueurAcheteeCm = nbBarres * longueurBarreCm;
        const chuteTotaleCm = feasibleBars.reduce((sum, bar) => sum + bar.chuteCm, 0);
        // Exemple: barre 650 cm, 2 x 400 cm => 2 barres, chute = 650-400-pertes sur chaque barre.
        return {
            bars,
            longueurPiecesCm,
            pertesCm,
            consommationReelleCm,
            nbBarres,
            longueurAcheteeCm,
            chuteTotaleCm,
            hasImpossible
        };
    }
    toNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }
    toNumberWithComma(v) {
        if (typeof v === 'string') {
            return this.toNumber(v.replace(',', '.'));
        }
        return this.toNumber(v);
    }
    round2(n) {
        return Math.round((n + Number.EPSILON) * 100) / 100;
    }
    round1(n) {
        return Math.round((n + Number.EPSILON) * 10) / 10;
    }
    round4(n) {
        return Math.round((n + Number.EPSILON) * 10000) / 10000;
    }
    createId(prefix) {
        return globalThis.crypto?.randomUUID?.() ?? `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
    static { this.ɵfac = function EstimationComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || EstimationComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: EstimationComponent, selectors: [["app-estimation"]], decls: 189, vars: 51, consts: [[1, "panel"], [1, "panel-header"], [1, "panel-actions", "no-print"], ["type", "button", 1, "btn", "ghost", 3, "click"], ["type", "button", 1, "btn", "primary", 3, "click"], [1, "estimation-grid", 3, "formGroup"], [1, "card"], [1, "section-head"], ["type", "button", 1, "btn", "outline", 3, "click"], ["formArrayName", "series", 1, "series"], [1, "series-row", "series-head"], ["class", "series-row", 3, "formGroupName", 4, "ngFor", "ngForOf"], [1, "hint"], ["formGroupName", "produit", 1, "grid-2"], [1, "field"], ["formControlName", "type", 1, "input"], ["value", "fenetre"], ["value", "porte"], ["value", "box"], ["value", "custom"], ["class", "field", 4, "ngIf"], ["class", "field checkbox", 4, "ngIf"], ["class", "hint", 4, "ngIf"], ["formArrayName", "pieces", 1, "pieces"], [1, "piece-row", "piece-head"], ["class", "piece-row", 3, "formGroupName", 4, "ngFor", "ngForOf"], ["class", "empty", 4, "ngIf"], ["formGroupName", "options", 1, "grid-2"], ["type", "number", "min", "0", "step", "0.1", "formControlName", "margeChute", 1, "input"], ["type", "number", "min", "0", "step", "0.01", "formControlName", "pertesCoupeCm", 1, "input"], ["formGroupName", "verre", 1, "grid-2"], [1, "field", "checkbox"], ["type", "checkbox", "formControlName", "activerVerre"], ["type", "number", "min", "0", "step", "0.01", "formControlName", "prixVerreM2", 1, "input"], ["formArrayName", "accessoires", 1, "accessories"], [1, "accessory-row", "accessory-head"], ["class", "accessory-row", 3, "formGroupName", 4, "ngFor", "ngForOf"], [1, "card", "results"], [1, "results-grid"], [1, "grand-total"], [1, "sub-title"], ["class", "serie-detail", 4, "ngFor", "ngForOf"], [1, "series-row", 3, "formGroupName"], ["formControlName", "nom", "placeholder", "S\u00E9rie 40", 1, "input"], ["type", "number", "min", "1", "step", "1", "formControlName", "longueurBarre", 1, "input"], ["type", "number", "min", "0", "step", "0.01", "formControlName", "prixBarre", 1, "input"], ["type", "button", 1, "btn", "danger", 3, "click", "disabled"], ["type", "number", "min", "0", "step", "1", "formControlName", "largeur", 1, "input"], ["type", "number", "min", "0", "step", "1", "formControlName", "hauteur", 1, "input"], ["type", "number", "min", "0", "step", "1", "formControlName", "profondeur", 1, "input"], ["type", "checkbox", "formControlName", "cadreRenfort"], [1, "piece-row", 3, "formGroupName"], ["formControlName", "designation", "placeholder", "Montant, traverse...", 1, "input"], ["formControlName", "serieId", 1, "input"], [3, "value", 4, "ngFor", "ngForOf"], ["type", "number", "min", "0", "step", "1", "formControlName", "longueur", 1, "input"], ["type", "number", "min", "1", "step", "1", "formControlName", "quantite", 1, "input"], [1, "amount"], ["type", "button", 1, "btn", "danger", 3, "click"], [3, "value"], [1, "empty"], ["type", "number", "min", "0", "step", "0.01", "formControlName", "surfaceVerreM2Manuelle", 1, "input"], [1, "accessory-row", 3, "formGroupName"], ["formControlName", "designation", "placeholder", "Poign\u00E9e, visserie...", 1, "input"], ["type", "number", "min", "0", "step", "1", "formControlName", "quantite", 1, "input"], ["type", "number", "min", "0", "step", "0.01", "formControlName", "prixUnitaire", 1, "input"], [1, "serie-detail"], [1, "breakdown"], [1, "num"], [4, "ngFor", "ngForOf"], [4, "ngIf"], ["class", "tag danger", 4, "ngIf"], [1, "pieces-list"], [1, "tag", "danger"], ["colspan", "4", 1, "empty"]], template: function EstimationComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4, "Estimation de prix");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "Construisez le produit (branches) et calculez le co\u00FBt total en temps r\u00E9el.");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(7, "div", 2)(8, "button", 3);
            i0.ɵɵlistener("click", function EstimationComponent_Template_button_click_8_listener() { return ctx.reset(); });
            i0.ɵɵtext(9, "R\u00E9initialiser");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(10, "button", 4);
            i0.ɵɵlistener("click", function EstimationComponent_Template_button_click_10_listener() { return ctx.print(); });
            i0.ɵɵtext(11, "Imprimer estimation");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(12, "form", 5)(13, "section", 6)(14, "div", 7)(15, "h2");
            i0.ɵɵtext(16, "S\u00E9ries & barres");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(17, "button", 8);
            i0.ɵɵlistener("click", function EstimationComponent_Template_button_click_17_listener() { return ctx.addSerie(); });
            i0.ɵɵtext(18, "Ajouter s\u00E9rie");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(19, "div", 9)(20, "div", 10)(21, "div");
            i0.ɵɵtext(22, "S\u00E9rie");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(23, "div");
            i0.ɵɵtext(24, "Longueur barre (cm)");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(25, "div");
            i0.ɵɵtext(26, "Prix barre (DT)");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(27, "div");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(28, EstimationComponent_div_28_Template, 6, 2, "div", 11);
            i0.ɵɵelementStart(29, "div", 12);
            i0.ɵɵtext(30, " Astuce : mets ");
            i0.ɵɵelementStart(31, "strong");
            i0.ɵɵtext(32, "650");
            i0.ɵɵelementEnd();
            i0.ɵɵtext(33, " pour une barre de 6m50. ");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(34, "section", 6)(35, "div", 7)(36, "h2");
            i0.ɵɵtext(37, "Produit \u00E0 fabriquer");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(38, "button", 8);
            i0.ɵɵlistener("click", function EstimationComponent_Template_button_click_38_listener() { return ctx.generatePieces(); });
            i0.ɵɵtext(39, " G\u00E9n\u00E9rer branches ");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(40, "div", 13)(41, "label", 14)(42, "span");
            i0.ɵɵtext(43, "Type");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(44, "select", 15)(45, "option", 16);
            i0.ɵɵtext(46, "Fen\u00EAtre");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(47, "option", 17);
            i0.ɵɵtext(48, "Porte");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(49, "option", 18);
            i0.ɵɵtext(50, "Box");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(51, "option", 19);
            i0.ɵɵtext(52, "Custom (manuel)");
            i0.ɵɵelementEnd()()();
            i0.ɵɵtemplate(53, EstimationComponent_label_53_Template, 4, 0, "label", 20)(54, EstimationComponent_label_54_Template, 4, 0, "label", 20)(55, EstimationComponent_label_55_Template, 4, 0, "label", 20)(56, EstimationComponent_label_56_Template, 4, 0, "label", 21);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(57, EstimationComponent_div_57_Template, 5, 0, "div", 22);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(58, "section", 6)(59, "div", 7)(60, "h2");
            i0.ɵɵtext(61, "Branches / profil\u00E9s");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(62, "button", 8);
            i0.ɵɵlistener("click", function EstimationComponent_Template_button_click_62_listener() { return ctx.addPiece(); });
            i0.ɵɵtext(63, "Ajouter branche");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(64, "div", 23)(65, "div", 24)(66, "div");
            i0.ɵɵtext(67, "D\u00E9signation");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(68, "div");
            i0.ɵɵtext(69, "S\u00E9rie");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(70, "div");
            i0.ɵɵtext(71, "Longueur (cm)");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(72, "div");
            i0.ɵɵtext(73, "Qt\u00E9");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(74, "div");
            i0.ɵɵtext(75, "Total (cm)");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(76, "div");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(77, EstimationComponent_div_77_Template, 11, 6, "div", 25)(78, EstimationComponent_div_78_Template, 5, 0, "div", 26);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(79, "section", 6)(80, "h2");
            i0.ɵɵtext(81, "Options de coupe");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(82, "div", 27)(83, "label", 14)(84, "span");
            i0.ɵɵtext(85, "Marge chute (%)");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(86, "input", 28);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(87, "label", 14)(88, "span");
            i0.ɵɵtext(89, "Pertes par coupe (cm)");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(90, "input", 29);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(91, "div", 12);
            i0.ɵɵtext(92, " Les pertes par coupe sont appliqu\u00E9es sur ");
            i0.ɵɵelementStart(93, "strong");
            i0.ɵɵtext(94, "le nombre de pi\u00E8ces dans chaque barre");
            i0.ɵɵelementEnd();
            i0.ɵɵtext(95, ". ");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(96, "section", 6)(97, "h2");
            i0.ɵɵtext(98, "Verre");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(99, "div", 30)(100, "label", 31);
            i0.ɵɵelement(101, "input", 32);
            i0.ɵɵelementStart(102, "span");
            i0.ɵɵtext(103, "Inclure le vitrage");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(104, "label", 14)(105, "span");
            i0.ɵɵtext(106, "Prix verre (DT/m\u00B2)");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(107, "input", 33);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(108, EstimationComponent_label_108_Template, 4, 0, "label", 20);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(109, EstimationComponent_div_109_Template, 5, 4, "div", 22);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(110, "section", 6)(111, "div", 7)(112, "h2");
            i0.ɵɵtext(113, "Accessoires");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(114, "button", 8);
            i0.ɵɵlistener("click", function EstimationComponent_Template_button_click_114_listener() { return ctx.addAccessory(); });
            i0.ɵɵtext(115, "Ajouter accessoire");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(116, "div", 34)(117, "div", 35)(118, "div");
            i0.ɵɵtext(119, "D\u00E9signation");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(120, "div");
            i0.ɵɵtext(121, "Qt\u00E9");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(122, "div");
            i0.ɵɵtext(123, "PU (DT)");
            i0.ɵɵelementEnd();
            i0.ɵɵelement(124, "div");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(125, EstimationComponent_div_125_Template, 6, 1, "div", 36)(126, EstimationComponent_div_126_Template, 2, 0, "div", 26);
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(127, "section", 37)(128, "h2");
            i0.ɵɵtext(129, "R\u00E9sultats");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(130, "div", 38)(131, "div")(132, "span");
            i0.ɵɵtext(133, "Conso totale (toutes s\u00E9ries)");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(134, "strong");
            i0.ɵɵtext(135);
            i0.ɵɵpipe(136, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(137, "div")(138, "span");
            i0.ɵɵtext(139, "Longueur achet\u00E9e totale");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(140, "strong");
            i0.ɵɵtext(141);
            i0.ɵɵpipe(142, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(143, "div")(144, "span");
            i0.ɵɵtext(145, "Chute totale");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(146, "strong");
            i0.ɵɵtext(147);
            i0.ɵɵpipe(148, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(149, "div")(150, "span");
            i0.ɵɵtext(151, "Co\u00FBt barres achet\u00E9es");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(152, "strong");
            i0.ɵɵtext(153);
            i0.ɵɵpipe(154, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(155, "div")(156, "span");
            i0.ɵɵtext(157, "Co\u00FBt barres consomm\u00E9es");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(158, "strong");
            i0.ɵɵtext(159);
            i0.ɵɵpipe(160, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(161, "div")(162, "span");
            i0.ɵɵtext(163, "Co\u00FBt chute barres");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(164, "strong");
            i0.ɵɵtext(165);
            i0.ɵɵpipe(166, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(167, "div")(168, "span");
            i0.ɵɵtext(169, "Co\u00FBt verre");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(170, "strong");
            i0.ɵɵtext(171);
            i0.ɵɵpipe(172, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(173, "div")(174, "span");
            i0.ɵɵtext(175, "Co\u00FBt accessoires");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(176, "strong");
            i0.ɵɵtext(177);
            i0.ɵɵpipe(178, "number");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(179, "div", 39)(180, "span");
            i0.ɵɵtext(181, "Co\u00FBt total");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(182, "strong");
            i0.ɵɵtext(183);
            i0.ɵɵpipe(184, "number");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(185, "h3", 40);
            i0.ɵɵtext(186, "D\u00E9tail par s\u00E9rie");
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(187, EstimationComponent_div_187_Template, 2, 0, "div", 26)(188, EstimationComponent_div_188_Template, 81, 46, "div", 41);
            i0.ɵɵelementEnd()()();
        } if (rf & 2) {
            i0.ɵɵadvance(12);
            i0.ɵɵproperty("formGroup", ctx.form);
            i0.ɵɵadvance(16);
            i0.ɵɵproperty("ngForOf", ctx.series.controls);
            i0.ɵɵadvance(25);
            i0.ɵɵproperty("ngIf", ctx.productType !== "custom");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.productType !== "custom");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.productType === "box");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.productType === "porte");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.productType !== "custom");
            i0.ɵɵadvance(20);
            i0.ɵɵproperty("ngForOf", ctx.pieces.controls);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.pieces.length === 0);
            i0.ɵɵadvance(30);
            i0.ɵɵproperty("ngIf", ctx.productType === "custom");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.result.surfaceVerreM2 > 0);
            i0.ɵɵadvance(16);
            i0.ɵɵproperty("ngForOf", ctx.accessoires.controls);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.accessoires.length === 0);
            i0.ɵɵadvance(9);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(136, 24, ctx.result.consommationTotaleCm, "1.0-1"), " cm");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(142, 27, ctx.result.longueurAcheteeTotaleCm, "1.0-1"), " cm");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(148, 30, ctx.result.chuteTotaleCm, "1.0-1"), " cm");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(154, 33, ctx.result.coutBarresAchete, "1.2-2"), " DT");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(160, 36, ctx.result.coutBarresConsomme, "1.2-2"), " DT");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(166, 39, ctx.result.coutBarresChute, "1.2-2"), " DT");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(172, 42, ctx.result.coutVerre, "1.2-2"), " DT");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(178, 45, ctx.result.coutAccessoires, "1.2-2"), " DT");
            i0.ɵɵadvance(6);
            i0.ɵɵtextInterpolate1("", i0.ɵɵpipeBind2(184, 48, ctx.result.coutTotal, "1.2-2"), " DT");
            i0.ɵɵadvance(4);
            i0.ɵɵproperty("ngIf", ctx.result.series.length === 0);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngForOf", ctx.result.series);
        } }, dependencies: [CommonModule, i2.NgForOf, i2.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.NgSelectOption, i1.ɵNgSelectMultipleOption, i1.DefaultValueAccessor, i1.NumberValueAccessor, i1.CheckboxControlValueAccessor, i1.SelectControlValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.MinValidator, i1.FormGroupDirective, i1.FormControlName, i1.FormGroupName, i1.FormArrayName, i2.DecimalPipe], styles: [".panel[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.panel-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.estimation-grid[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 20px;\n}\n\n.section-head[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 10px;\n}\n\n.field.checkbox[_ngcontent-%COMP%] {\n  flex-direction: row;\n  align-items: center;\n  gap: 10px;\n  padding-top: 28px;\n}\n\n\n\n.series[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.series-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.2fr 0.8fr 0.8fr 0.6fr;\n  gap: 12px;\n  align-items: center;\n}\n\n.series-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n\n\n.pieces[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.piece-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.4fr 0.9fr 0.7fr 0.5fr 0.6fr 0.6fr;\n  gap: 12px;\n  align-items: center;\n}\n\n.piece-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.amount[_ngcontent-%COMP%] {\n  text-align: right;\n  font-weight: 700;\n}\n\n.accessories[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.accessory-row[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: 1.6fr 0.6fr 0.7fr 0.6fr;\n  gap: 12px;\n  align-items: center;\n}\n\n.accessory-head[_ngcontent-%COMP%] {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.results-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n}\n\n.results-grid[_ngcontent-%COMP%]   div[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n}\n\n.results-grid[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  color: var(--muted);\n  font-weight: 600;\n  font-size: 0.85rem;\n}\n\n.results-grid[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%] {\n  font-size: 1.05rem;\n}\n\n.results-grid[_ngcontent-%COMP%]   .grand-total[_ngcontent-%COMP%] {\n  background: var(--accent-soft);\n  border-color: rgba(15, 118, 110, 0.2);\n}\n\n.sub-title[_ngcontent-%COMP%] {\n  margin-top: 16px;\n  font-size: 1rem;\n}\n\n.breakdown[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  margin-top: 10px;\n  font-size: 13px;\n}\n\n.breakdown[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.breakdown[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  border: 1px solid var(--border);\n  padding: 8px 10px;\n}\n\n.breakdown[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f8f6f1;\n  text-align: left;\n}\n\n.serie-detail[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  margin-top: 8px;\n}\n\n.pieces-list[_ngcontent-%COMP%] {\n  line-height: 1.4;\n}\n\n.tag[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 2px 8px;\n  border-radius: 999px;\n  font-size: 0.7rem;\n  font-weight: 600;\n  margin-left: 6px;\n}\n\n.tag.danger[_ngcontent-%COMP%] {\n  background: #fce9e9;\n  color: #b42318;\n  border: 1px solid rgba(180, 35, 24, 0.25);\n}\n\n.num[_ngcontent-%COMP%] {\n  text-align: right;\n}\n\n.hint[_ngcontent-%COMP%] {\n  margin-top: 10px;\n  color: var(--muted);\n}\n\n.empty[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted);\n  padding: 16px 0 4px;\n}\n\n@media (max-width: 980px) {\n  .panel-header[_ngcontent-%COMP%] {\n    flex-direction: column;\n  }\n\n  .results-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n\n  .series-row[_ngcontent-%COMP%], \n   .piece-row[_ngcontent-%COMP%], \n   .accessory-row[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(EstimationComponent, [{
        type: Component,
        args: [{ selector: 'app-estimation', standalone: true, imports: [CommonModule, ReactiveFormsModule], template: "<section class=\"panel\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Estimation de prix</h1>\n      <p>Construisez le produit (branches) et calculez le co\u00FBt total en temps r\u00E9el.</p>\n    </div>\n    <div class=\"panel-actions no-print\">\n      <button class=\"btn ghost\" type=\"button\" (click)=\"reset()\">R\u00E9initialiser</button>\n      <button class=\"btn primary\" type=\"button\" (click)=\"print()\">Imprimer estimation</button>\n    </div>\n  </div>\n\n  <form class=\"estimation-grid\" [formGroup]=\"form\">\n\n    <!-- =======================\n         S\u00C9RIES / BARRES\n    ======================== -->\n    <section class=\"card\">\n      <div class=\"section-head\">\n        <h2>S\u00E9ries & barres</h2>\n        <button class=\"btn outline\" type=\"button\" (click)=\"addSerie()\">Ajouter s\u00E9rie</button>\n      </div>\n\n      <div class=\"series\" formArrayName=\"series\">\n        <div class=\"series-row series-head\">\n          <div>S\u00E9rie</div>\n          <div>Longueur barre (cm)</div>\n          <div>Prix barre (DT)</div>\n          <div></div>\n        </div>\n\n        <div\n          class=\"series-row\"\n          *ngFor=\"let s of series.controls; let i = index\"\n          [formGroupName]=\"i\"\n        >\n          <input class=\"input\" formControlName=\"nom\" placeholder=\"S\u00E9rie 40\">\n          <input class=\"input\" type=\"number\" min=\"1\" step=\"1\" formControlName=\"longueurBarre\">\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"0.01\" formControlName=\"prixBarre\">\n          <button class=\"btn danger\" type=\"button\" (click)=\"removeSerie(i)\" [disabled]=\"series.length <= 1\">\n            Supprimer\n          </button>\n        </div>\n\n        <div class=\"hint\">\n          Astuce : mets <strong>650</strong> pour une barre de 6m50.\n        </div>\n      </div>\n    </section>\n\n    <!-- =======================\n         PRODUIT / DIMENSIONS\n    ======================== -->\n    <section class=\"card\">\n      <div class=\"section-head\">\n        <h2>Produit \u00E0 fabriquer</h2>\n        <button class=\"btn outline\" type=\"button\" (click)=\"generatePieces()\">\n          G\u00E9n\u00E9rer branches\n        </button>\n      </div>\n\n      <div class=\"grid-2\" formGroupName=\"produit\">\n        <label class=\"field\">\n          <span>Type</span>\n          <select class=\"input\" formControlName=\"type\">\n            <option value=\"fenetre\">Fen\u00EAtre</option>\n            <option value=\"porte\">Porte</option>\n            <option value=\"box\">Box</option>\n            <option value=\"custom\">Custom (manuel)</option>\n          </select>\n        </label>\n\n        <label class=\"field\" *ngIf=\"productType !== 'custom'\">\n          <span>Largeur (cm)</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"1\" formControlName=\"largeur\">\n        </label>\n\n        <label class=\"field\" *ngIf=\"productType !== 'custom'\">\n          <span>Hauteur (cm)</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"1\" formControlName=\"hauteur\">\n        </label>\n\n        <label class=\"field\" *ngIf=\"productType === 'box'\">\n          <span>Profondeur (cm)</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"1\" formControlName=\"profondeur\">\n        </label>\n\n        <label class=\"field checkbox\" *ngIf=\"productType === 'porte'\">\n          <input type=\"checkbox\" formControlName=\"cadreRenfort\">\n          <span>Ajouter renfort (traverse)</span>\n        </label>\n      </div>\n\n      <div class=\"hint\" *ngIf=\"productType !== 'custom'\">\n        Clique sur <strong>G\u00E9n\u00E9rer branches</strong> pour cr\u00E9er automatiquement les montants et traverses.\n      </div>\n    </section>\n\n    <!-- =======================\n         BRANCHES / PI\u00C8CES\n    ======================== -->\n    <section class=\"card\">\n      <div class=\"section-head\">\n        <h2>Branches / profil\u00E9s</h2>\n        <button class=\"btn outline\" type=\"button\" (click)=\"addPiece()\">Ajouter branche</button>\n      </div>\n\n      <div class=\"pieces\" formArrayName=\"pieces\">\n        <div class=\"piece-row piece-head\">\n          <div>D\u00E9signation</div>\n          <div>S\u00E9rie</div>\n          <div>Longueur (cm)</div>\n          <div>Qt\u00E9</div>\n          <div>Total (cm)</div>\n          <div></div>\n        </div>\n\n        <div\n          class=\"piece-row\"\n          *ngFor=\"let p of pieces.controls; let i = index\"\n          [formGroupName]=\"i\"\n        >\n          <input class=\"input\" formControlName=\"designation\" placeholder=\"Montant, traverse...\">\n\n          <select class=\"input\" formControlName=\"serieId\">\n            <option *ngFor=\"let opt of seriesOptions\" [value]=\"opt.id\">{{ opt.nom }}</option>\n          </select>\n\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"1\" formControlName=\"longueur\">\n          <input class=\"input\" type=\"number\" min=\"1\" step=\"1\" formControlName=\"quantite\">\n\n          <div class=\"amount\">{{ pieceTotalCm(i) | number:'1.0-1' }}</div>\n\n          <button class=\"btn danger\" type=\"button\" (click)=\"removePiece(i)\">\n            Supprimer\n          </button>\n        </div>\n\n        <div class=\"empty\" *ngIf=\"pieces.length === 0\">\n          Aucune branche. Clique sur <strong>G\u00E9n\u00E9rer branches</strong> ou ajoute manuellement.\n        </div>\n      </div>\n    </section>\n\n    <!-- =======================\n         OPTIONS DE COUPE\n    ======================== -->\n    <section class=\"card\">\n      <h2>Options de coupe</h2>\n      <div class=\"grid-2\" formGroupName=\"options\">\n        <label class=\"field\">\n          <span>Marge chute (%)</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"0.1\" formControlName=\"margeChute\">\n        </label>\n        <label class=\"field\">\n          <span>Pertes par coupe (cm)</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"0.01\" formControlName=\"pertesCoupeCm\">\n        </label>\n      </div>\n      <div class=\"hint\">\n        Les pertes par coupe sont appliqu\u00E9es sur <strong>le nombre de pi\u00E8ces dans chaque barre</strong>.\n      </div>\n    </section>\n\n    <!-- =======================\n         VERRE\n    ======================== -->\n    <section class=\"card\">\n      <h2>Verre</h2>\n      <div class=\"grid-2\" formGroupName=\"verre\">\n        <label class=\"field checkbox\">\n          <input type=\"checkbox\" formControlName=\"activerVerre\">\n          <span>Inclure le vitrage</span>\n        </label>\n        <label class=\"field\">\n          <span>Prix verre (DT/m\u00B2)</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"0.01\" formControlName=\"prixVerreM2\">\n        </label>\n        <label class=\"field\" *ngIf=\"productType === 'custom'\">\n          <span>Surface verre (m\u00B2)</span>\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"0.01\" formControlName=\"surfaceVerreM2Manuelle\">\n        </label>\n      </div>\n\n      <div class=\"hint\" *ngIf=\"result.surfaceVerreM2 > 0\">\n        Surface verre estim\u00E9e : <strong>{{ result.surfaceVerreM2 | number:'1.2-2' }} m\u00B2</strong>\n      </div>\n    </section>\n\n    <!-- =======================\n         ACCESSOIRES\n    ======================== -->\n    <section class=\"card\">\n      <div class=\"section-head\">\n        <h2>Accessoires</h2>\n        <button class=\"btn outline\" type=\"button\" (click)=\"addAccessory()\">Ajouter accessoire</button>\n      </div>\n\n      <div class=\"accessories\" formArrayName=\"accessoires\">\n        <div class=\"accessory-row accessory-head\">\n          <div>D\u00E9signation</div>\n          <div>Qt\u00E9</div>\n          <div>PU (DT)</div>\n          <div></div>\n        </div>\n\n        <div\n          class=\"accessory-row\"\n          *ngFor=\"let acc of accessoires.controls; let i = index\"\n          [formGroupName]=\"i\"\n        >\n          <input class=\"input\" formControlName=\"designation\" placeholder=\"Poign\u00E9e, visserie...\">\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"1\" formControlName=\"quantite\">\n          <input class=\"input\" type=\"number\" min=\"0\" step=\"0.01\" formControlName=\"prixUnitaire\">\n          <button class=\"btn danger\" type=\"button\" (click)=\"removeAccessory(i)\">Supprimer</button>\n        </div>\n\n        <div class=\"empty\" *ngIf=\"accessoires.length === 0\">\n          Aucun accessoire ajout\u00E9.\n        </div>\n      </div>\n    </section>\n\n    <!-- =======================\n         R\u00C9SULTATS\n    ======================== -->\n    <section class=\"card results\">\n      <h2>R\u00E9sultats</h2>\n\n      <div class=\"results-grid\">\n        <div>\n          <span>Conso totale (toutes s\u00E9ries)</span>\n          <strong>{{ result.consommationTotaleCm | number:'1.0-1' }} cm</strong>\n        </div>\n        <div>\n          <span>Longueur achet\u00E9e totale</span>\n          <strong>{{ result.longueurAcheteeTotaleCm | number:'1.0-1' }} cm</strong>\n        </div>\n        <div>\n          <span>Chute totale</span>\n          <strong>{{ result.chuteTotaleCm | number:'1.0-1' }} cm</strong>\n        </div>\n        <div>\n          <span>Co\u00FBt barres achet\u00E9es</span>\n          <strong>{{ result.coutBarresAchete | number:'1.2-2' }} DT</strong>\n        </div>\n        <div>\n          <span>Co\u00FBt barres consomm\u00E9es</span>\n          <strong>{{ result.coutBarresConsomme | number:'1.2-2' }} DT</strong>\n        </div>\n        <div>\n          <span>Co\u00FBt chute barres</span>\n          <strong>{{ result.coutBarresChute | number:'1.2-2' }} DT</strong>\n        </div>\n        <div>\n          <span>Co\u00FBt verre</span>\n          <strong>{{ result.coutVerre | number:'1.2-2' }} DT</strong>\n        </div>\n        <div>\n          <span>Co\u00FBt accessoires</span>\n          <strong>{{ result.coutAccessoires | number:'1.2-2' }} DT</strong>\n        </div>\n        <div class=\"grand-total\">\n          <span>Co\u00FBt total</span>\n          <strong>{{ result.coutTotal | number:'1.2-2' }} DT</strong>\n        </div>\n      </div>\n\n      <h3 class=\"sub-title\">D\u00E9tail par s\u00E9rie</h3>\n      <div *ngIf=\"result.series.length === 0\" class=\"empty\">\n        Aucune s\u00E9rie \u00E0 afficher.\n      </div>\n\n      <div class=\"serie-detail\" *ngFor=\"let s of result.series\">\n        <table class=\"breakdown\">\n          <thead>\n            <tr>\n              <th>S\u00E9rie</th>\n              <th class=\"num\">Barre (cm)</th>\n              <th class=\"num\">Pi\u00E8ces (cm)</th>\n              <th class=\"num\">Pertes (cm)</th>\n              <th class=\"num\">Conso (cm)</th>\n              <th class=\"num\">Nb barres</th>\n              <th class=\"num\">Achet\u00E9 (cm)</th>\n              <th class=\"num\">Chute (cm)</th>\n              <th class=\"num\">Prix/cm (DT)</th>\n              <th class=\"num\">Co\u00FBt achet\u00E9 (DT)</th>\n              <th class=\"num\">Co\u00FBt consomm\u00E9 (DT)</th>\n              <th class=\"num\">Co\u00FBt chute (DT)</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr>\n              <td>{{ s.nom }}</td>\n              <td class=\"num\">{{ s.longueurBarreCm | number:'1.0-1' }}</td>\n              <td class=\"num\">{{ s.longueurPiecesCm | number:'1.0-1' }}</td>\n              <td class=\"num\">{{ s.pertesCm | number:'1.0-1' }}</td>\n              <td class=\"num\">{{ s.consommationReelleCm | number:'1.0-1' }}</td>\n              <td class=\"num\">{{ s.nbBarres }}</td>\n              <td class=\"num\">{{ s.longueurAcheteeCm | number:'1.0-1' }}</td>\n              <td class=\"num\">{{ s.chuteTotaleCm | number:'1.0-1' }}</td>\n              <td class=\"num\">{{ s.prixParCm | number:'1.4-4' }}</td>\n              <td class=\"num\">{{ s.coutAchete | number:'1.2-2' }}</td>\n              <td class=\"num\">{{ s.coutConsomme | number:'1.2-2' }}</td>\n              <td class=\"num\">{{ s.coutChute | number:'1.2-2' }}</td>\n            </tr>\n          </tbody>\n        </table>\n\n        <div class=\"hint\" *ngIf=\"s.hasImpossible\">\n          Certaines pi\u00E8ces d\u00E9passent la longueur de barre : d\u00E9coupe impossible pour ces pi\u00E8ces.\n        </div>\n\n        <div class=\"sub-title\">D\u00E9tail des barres \u2014 {{ s.nom }}</div>\n        <table class=\"breakdown\">\n          <thead>\n            <tr>\n              <th># Barre</th>\n              <th>Pi\u00E8ces (cm)</th>\n              <th class=\"num\">Pertes (cm)</th>\n              <th class=\"num\">Chute (cm)</th>\n            </tr>\n          </thead>\n          <tbody>\n            <tr *ngFor=\"let bar of s.bars\">\n              <td>\n                #{{ bar.index }}\n                <span class=\"tag danger\" *ngIf=\"bar.impossible\">Impossible</span>\n              </td>\n              <td>\n                <div class=\"pieces-list\">\n                  <span *ngFor=\"let piece of bar.pieces; let last = last\">\n                    {{ piece.designation }} ({{ piece.longueurCm | number:'1.0-1' }} cm){{ !last ? ', ' : '' }}\n                  </span>\n                </div>\n              </td>\n              <td class=\"num\">{{ bar.pertesCm | number:'1.0-1' }}</td>\n              <td class=\"num\">{{ bar.chuteCm | number:'1.0-1' }}</td>\n            </tr>\n            <tr *ngIf=\"s.bars.length === 0\">\n              <td colspan=\"4\" class=\"empty\">Aucune barre.</td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n    </section>\n  </form>\n</section>\n", styles: [".panel {\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n}\n\n.panel-header {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 20px;\n}\n\n.panel-actions {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.estimation-grid {\n  display: grid;\n  gap: 20px;\n}\n\n.section-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 10px;\n}\n\n.field.checkbox {\n  flex-direction: row;\n  align-items: center;\n  gap: 10px;\n  padding-top: 28px;\n}\n\n/* ===== S\u00E9ries ===== */\n.series {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.series-row {\n  display: grid;\n  grid-template-columns: 1.2fr 0.8fr 0.8fr 0.6fr;\n  gap: 12px;\n  align-items: center;\n}\n\n.series-head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n/* ===== Pi\u00E8ces / branches ===== */\n.pieces {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.piece-row {\n  display: grid;\n  grid-template-columns: 1.4fr 0.9fr 0.7fr 0.5fr 0.6fr 0.6fr;\n  gap: 12px;\n  align-items: center;\n}\n\n.piece-head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.amount {\n  text-align: right;\n  font-weight: 700;\n}\n\n.accessories {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.accessory-row {\n  display: grid;\n  grid-template-columns: 1.6fr 0.6fr 0.7fr 0.6fr;\n  gap: 12px;\n  align-items: center;\n}\n\n.accessory-head {\n  text-transform: uppercase;\n  font-size: 0.75rem;\n  letter-spacing: 0.08em;\n  color: var(--muted);\n  border-bottom: 2px solid var(--border);\n  padding-bottom: 10px;\n}\n\n.results-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n}\n\n.results-grid div {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 12px;\n  border-radius: 12px;\n  background: #f8f6f1;\n  border: 1px solid var(--border);\n}\n\n.results-grid span {\n  color: var(--muted);\n  font-weight: 600;\n  font-size: 0.85rem;\n}\n\n.results-grid strong {\n  font-size: 1.05rem;\n}\n\n.results-grid .grand-total {\n  background: var(--accent-soft);\n  border-color: rgba(15, 118, 110, 0.2);\n}\n\n.sub-title {\n  margin-top: 16px;\n  font-size: 1rem;\n}\n\n.breakdown {\n  width: 100%;\n  border-collapse: collapse;\n  margin-top: 10px;\n  font-size: 13px;\n}\n\n.breakdown th,\n.breakdown td {\n  border: 1px solid var(--border);\n  padding: 8px 10px;\n}\n\n.breakdown th {\n  background: #f8f6f1;\n  text-align: left;\n}\n\n.serie-detail {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  margin-top: 8px;\n}\n\n.pieces-list {\n  line-height: 1.4;\n}\n\n.tag {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 2px 8px;\n  border-radius: 999px;\n  font-size: 0.7rem;\n  font-weight: 600;\n  margin-left: 6px;\n}\n\n.tag.danger {\n  background: #fce9e9;\n  color: #b42318;\n  border: 1px solid rgba(180, 35, 24, 0.25);\n}\n\n.num {\n  text-align: right;\n}\n\n.hint {\n  margin-top: 10px;\n  color: var(--muted);\n}\n\n.empty {\n  text-align: center;\n  color: var(--muted);\n  padding: 16px 0 4px;\n}\n\n@media (max-width: 980px) {\n  .panel-header {\n    flex-direction: column;\n  }\n\n  .results-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .series-row,\n  .piece-row,\n  .accessory-row {\n    grid-template-columns: 1fr;\n  }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(EstimationComponent, { className: "EstimationComponent", filePath: "src/app/components/estimation/estimation.component.ts", lineNumber: 85 }); })();
