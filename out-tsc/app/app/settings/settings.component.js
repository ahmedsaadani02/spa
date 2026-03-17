import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../services/ipc.service";
import * as i2 from "@angular/common";
function SettingsComponent_button_13_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 13);
    i0.ɵɵlistener("click", function SettingsComponent_button_13_Template_button_click_0_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.installUpdateNow()); });
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("disabled", ctx_r1.installingUpdate);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r1.installingUpdate ? "Installation..." : "Installer et redemarrer", " ");
} }
function SettingsComponent_span_14_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 14);
    i0.ɵɵtext(1, "Disponible uniquement dans Electron.");
    i0.ɵɵelementEnd();
} }
function SettingsComponent_div_17_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 7);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.updateMessage);
} }
function SettingsComponent_div_18_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 7);
    i0.ɵɵtext(1);
    i0.ɵɵpipe(2, "number");
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" Telechargement: ", i0.ɵɵpipeBind2(2, 1, ctx_r1.updateProgress, "1.0-0"), "% ");
} }
function SettingsComponent_div_19_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 15);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.updateError);
} }
function SettingsComponent_span_24_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 14);
    i0.ɵɵtext(1, "Disponible uniquement dans Electron.");
    i0.ɵɵelementEnd();
} }
function SettingsComponent_div_25_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 16);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.infoMessage);
} }
function SettingsComponent_div_26_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 15);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.errorMessage);
} }
function SettingsComponent_div_27_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 7);
    i0.ɵɵtext(1, "Chargement des sauvegardes...");
    i0.ɵɵelementEnd();
} }
function SettingsComponent_table_28_tr_12_Template(rf, ctx) { if (rf & 1) {
    const _r3 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "tr")(1, "td");
    i0.ɵɵtext(2);
    i0.ɵɵpipe(3, "date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "td");
    i0.ɵɵtext(5);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "td");
    i0.ɵɵtext(7);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "td")(9, "button", 13);
    i0.ɵɵlistener("click", function SettingsComponent_table_28_tr_12_Template_button_click_9_listener() { const backup_r4 = i0.ɵɵrestoreView(_r3).$implicit; const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.restoreBackup(backup_r4)); });
    i0.ɵɵtext(10);
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const backup_r4 = ctx.$implicit;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(3, 5, backup_r4.createdAt, "dd/MM/yyyy HH:mm"));
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.formatSize(backup_r4.size));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(backup_r4.fileName);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("disabled", ctx_r1.restoringFileName !== null || !ctx_r1.hasDbApi);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", ctx_r1.restoringFileName === backup_r4.fileName ? "Restauration..." : "Restaurer", " ");
} }
function SettingsComponent_table_28_tr_13_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "tr")(1, "td", 20);
    i0.ɵɵtext(2, "Aucune sauvegarde disponible.");
    i0.ɵɵelementEnd()();
} }
function SettingsComponent_table_28_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "table", 17)(1, "thead")(2, "tr")(3, "th");
    i0.ɵɵtext(4, "Date");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "th");
    i0.ɵɵtext(6, "Taille");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "th");
    i0.ɵɵtext(8, "Fichier");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(9, "th");
    i0.ɵɵtext(10, "Action");
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(11, "tbody");
    i0.ɵɵtemplate(12, SettingsComponent_table_28_tr_12_Template, 11, 8, "tr", 18)(13, SettingsComponent_table_28_tr_13_Template, 3, 0, "tr", 19);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance(12);
    i0.ɵɵproperty("ngForOf", ctx_r1.backups)("ngForTrackBy", ctx_r1.trackByBackup);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.backups.length === 0);
} }
export class SettingsComponent {
    constructor(ipc, cdr) {
        this.ipc = ipc;
        this.cdr = cdr;
        this.backups = [];
        this.loading = false;
        this.creatingBackup = false;
        this.restoringFileName = null;
        this.infoMessage = '';
        this.errorMessage = '';
        this.updateStatus = 'none';
        this.updateMessage = 'Aucune verification effectuee.';
        this.updateError = '';
        this.updateProgress = 0;
        this.checkingUpdates = false;
        this.installingUpdate = false;
        this.unsubscribeUpdateStatus = null;
        this.trackByBackup = (_, backup) => backup.fileName;
    }
    get hasDbApi() {
        return this.ipc.isAvailable;
    }
    get hasUpdatesApi() {
        return this.ipc.isAvailable;
    }
    ngOnInit() {
        void this.loadBackups();
        void this.initUpdatesState();
    }
    ngOnDestroy() {
        if (this.unsubscribeUpdateStatus) {
            this.unsubscribeUpdateStatus();
            this.unsubscribeUpdateStatus = null;
        }
    }
    async createBackup() {
        if (this.creatingBackup)
            return;
        this.creatingBackup = true;
        this.errorMessage = '';
        this.infoMessage = '';
        this.cdr.markForCheck();
        try {
            const result = await this.ipc.dbBackup();
            if (!result?.ok) {
                this.errorMessage = result?.message ?? 'Sauvegarde impossible.';
                return;
            }
            this.infoMessage = `Sauvegarde creee: ${result.fileName ?? 'OK'}`;
            await this.loadBackups();
        }
        finally {
            this.creatingBackup = false;
            this.cdr.markForCheck();
        }
    }
    async restoreBackup(backup) {
        if (this.restoringFileName)
            return;
        const confirmed = globalThis.confirm(`Confirmer la restauration de "${backup.fileName}" ?\nLa base actuelle sera remplacee.`);
        if (!confirmed)
            return;
        this.restoringFileName = backup.fileName;
        this.errorMessage = '';
        this.infoMessage = '';
        this.cdr.markForCheck();
        try {
            const restored = await this.ipc.dbRestore(backup.fileName);
            if (!restored) {
                this.errorMessage = 'Restauration impossible.';
                return;
            }
            this.infoMessage = `Restauration terminee: ${backup.fileName}`;
            await this.loadBackups();
        }
        finally {
            this.restoringFileName = null;
            this.cdr.markForCheck();
        }
    }
    formatSize(size) {
        if (size < 1024)
            return `${size} B`;
        if (size < 1024 * 1024)
            return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
    async loadBackups() {
        this.loading = true;
        this.errorMessage = '';
        this.cdr.markForCheck();
        try {
            this.backups = await this.ipc.dbListBackups();
        }
        catch {
            this.backups = [];
            this.errorMessage = 'Chargement des sauvegardes impossible.';
        }
        finally {
            this.loading = false;
            this.cdr.markForCheck();
        }
    }
    async checkForUpdates() {
        if (!this.hasUpdatesApi || this.checkingUpdates)
            return;
        this.checkingUpdates = true;
        this.updateError = '';
        this.updateMessage = 'Recherche des mises a jour...';
        this.cdr.markForCheck();
        try {
            await this.ipc.updatesCheck();
        }
        finally {
            this.checkingUpdates = false;
            this.cdr.markForCheck();
        }
    }
    async installUpdateNow() {
        if (!this.hasUpdatesApi || this.installingUpdate)
            return;
        this.installingUpdate = true;
        this.cdr.markForCheck();
        try {
            await this.ipc.updatesInstall();
        }
        finally {
            this.installingUpdate = false;
            this.cdr.markForCheck();
        }
    }
    getUpdateStatusLabel() {
        switch (this.updateStatus) {
            case 'checking':
                return 'recherche...';
            case 'available':
                return 'mise a jour detectee';
            case 'downloading':
                return 'telechargement...';
            case 'downloaded':
                return 'pret a installer';
            case 'error':
                return 'erreur';
            case 'none':
            default:
                return 'a jour';
        }
    }
    async initUpdatesState() {
        if (!this.hasUpdatesApi)
            return;
        this.unsubscribeUpdateStatus = this.ipc.updatesOnStatus((payload) => {
            this.applyUpdateStatus(payload);
            this.cdr.markForCheck();
        });
        const current = await this.ipc.updatesGetStatus();
        if (current) {
            this.applyUpdateStatus(current);
            this.cdr.markForCheck();
        }
    }
    applyUpdateStatus(payload) {
        this.updateStatus = payload.status;
        this.updateMessage = payload.message ?? this.updateMessage;
        this.updateProgress = Number(payload.percent ?? 0);
        if (payload.status === 'error') {
            this.updateError = payload.message ?? 'Erreur pendant la mise a jour.';
        }
        else {
            this.updateError = '';
        }
    }
    static { this.ɵfac = function SettingsComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || SettingsComponent)(i0.ɵɵdirectiveInject(i1.IpcService), i0.ɵɵdirectiveInject(i0.ChangeDetectorRef)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: SettingsComponent, selectors: [["app-settings"]], decls: 29, vars: 15, consts: [[1, "panel"], [1, "panel-header"], [1, "card", "settings-card", "update-card"], [1, "settings-actions"], ["type", "button", 1, "btn-run", 3, "click", "disabled"], ["class", "btn-restore", "type", "button", 3, "disabled", "click", 4, "ngIf"], ["class", "settings-hint", 4, "ngIf"], [1, "settings-feedback"], ["class", "settings-feedback", 4, "ngIf"], ["class", "settings-feedback err", 4, "ngIf"], [1, "card", "settings-card"], ["class", "settings-feedback ok", 4, "ngIf"], ["class", "backups-table", 4, "ngIf"], ["type", "button", 1, "btn-restore", 3, "click", "disabled"], [1, "settings-hint"], [1, "settings-feedback", "err"], [1, "settings-feedback", "ok"], [1, "backups-table"], [4, "ngFor", "ngForOf", "ngForTrackBy"], [4, "ngIf"], ["colspan", "4", 1, "empty-backups"]], template: function SettingsComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "section", 0)(1, "div", 1)(2, "div")(3, "h1");
            i0.ɵɵtext(4, "Parametres");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "p");
            i0.ɵɵtext(6, "Protection et restauration de la base SQLite.");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(7, "section", 2)(8, "h2");
            i0.ɵɵtext(9, "Mise a jour");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(10, "div", 3)(11, "button", 4);
            i0.ɵɵlistener("click", function SettingsComponent_Template_button_click_11_listener() { return ctx.checkForUpdates(); });
            i0.ɵɵtext(12);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(13, SettingsComponent_button_13_Template, 2, 2, "button", 5)(14, SettingsComponent_span_14_Template, 2, 0, "span", 6);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(15, "div", 7);
            i0.ɵɵtext(16);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(17, SettingsComponent_div_17_Template, 2, 1, "div", 8)(18, SettingsComponent_div_18_Template, 3, 4, "div", 8)(19, SettingsComponent_div_19_Template, 2, 1, "div", 9);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(20, "section", 10)(21, "div", 3)(22, "button", 4);
            i0.ɵɵlistener("click", function SettingsComponent_Template_button_click_22_listener() { return ctx.createBackup(); });
            i0.ɵɵtext(23);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(24, SettingsComponent_span_24_Template, 2, 0, "span", 6);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(25, SettingsComponent_div_25_Template, 2, 1, "div", 11)(26, SettingsComponent_div_26_Template, 2, 1, "div", 9)(27, SettingsComponent_div_27_Template, 2, 0, "div", 8)(28, SettingsComponent_table_28_Template, 14, 3, "table", 12);
            i0.ɵɵelementEnd()();
        } if (rf & 2) {
            i0.ɵɵadvance(11);
            i0.ɵɵproperty("disabled", ctx.checkingUpdates || !ctx.hasUpdatesApi);
            i0.ɵɵadvance();
            i0.ɵɵtextInterpolate1(" ", ctx.checkingUpdates ? "Recherche..." : "Verifier les mises a jour", " ");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.updateStatus === "downloaded");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", !ctx.hasUpdatesApi);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate1("Statut: ", ctx.getUpdateStatusLabel());
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.updateMessage);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.updateStatus === "downloading");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.updateError);
            i0.ɵɵadvance(3);
            i0.ɵɵproperty("disabled", ctx.creatingBackup || !ctx.hasDbApi);
            i0.ɵɵadvance();
            i0.ɵɵtextInterpolate1(" ", ctx.creatingBackup ? "Sauvegarde..." : "Sauvegarder la base", " ");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", !ctx.hasDbApi);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.infoMessage);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.errorMessage);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.loading);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", !ctx.loading);
        } }, dependencies: [CommonModule, i2.NgForOf, i2.NgIf, i2.DecimalPipe, i2.DatePipe], styles: [".settings-card[_ngcontent-%COMP%] {\n  display: grid;\n  gap: 10px;\n}\n\n.update-card[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%] {\n  margin: 0;\n  font-size: 1rem;\n}\n\n.settings-actions[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n\n.btn-run[_ngcontent-%COMP%], \n.btn-restore[_ngcontent-%COMP%] {\n  border: 1px solid #1a56db;\n  background: #1a56db;\n  color: #fff;\n  border-radius: 8px;\n  padding: 7px 12px;\n  font-size: 0.82rem;\n  font-weight: 600;\n  cursor: pointer;\n}\n\n.btn-run[disabled][_ngcontent-%COMP%], \n.btn-restore[disabled][_ngcontent-%COMP%] {\n  opacity: 0.55;\n  cursor: not-allowed;\n}\n\n.btn-restore[_ngcontent-%COMP%] {\n  background: #fff;\n  color: #1a56db;\n}\n\n.settings-hint[_ngcontent-%COMP%] {\n  color: #64748b;\n  font-size: 0.78rem;\n}\n\n.settings-feedback[_ngcontent-%COMP%] {\n  padding: 9px 12px;\n  border-radius: 8px;\n  background: #f8fafc;\n  color: #334155;\n  font-size: 0.82rem;\n}\n\n.settings-feedback.ok[_ngcontent-%COMP%] {\n  background: #dcfce7;\n  color: #166534;\n}\n\n.settings-feedback.err[_ngcontent-%COMP%] {\n  background: #fee2e2;\n  color: #991b1b;\n}\n\n.backups-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n}\n\n.backups-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], \n.backups-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 10px;\n  text-align: left;\n  border-bottom: 1px solid var(--border);\n  font-size: 0.83rem;\n}\n\n.backups-table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  background: #f8fafc;\n  font-weight: 700;\n}\n\n.empty-backups[_ngcontent-%COMP%] {\n  text-align: center;\n  color: #64748b;\n}"], changeDetection: 0 }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(SettingsComponent, [{
        type: Component,
        args: [{ selector: 'app-settings', standalone: true, imports: [CommonModule], changeDetection: ChangeDetectionStrategy.OnPush, template: "<section class=\"panel\">\n  <div class=\"panel-header\">\n    <div>\n      <h1>Parametres</h1>\n      <p>Protection et restauration de la base SQLite.</p>\n    </div>\n  </div>\n\n  <section class=\"card settings-card update-card\">\n    <h2>Mise a jour</h2>\n\n    <div class=\"settings-actions\">\n      <button class=\"btn-run\" type=\"button\" (click)=\"checkForUpdates()\" [disabled]=\"checkingUpdates || !hasUpdatesApi\">\n        {{ checkingUpdates ? 'Recherche...' : 'Verifier les mises a jour' }}\n      </button>\n\n      <button\n        class=\"btn-restore\"\n        type=\"button\"\n        *ngIf=\"updateStatus === 'downloaded'\"\n        [disabled]=\"installingUpdate\"\n        (click)=\"installUpdateNow()\"\n      >\n        {{ installingUpdate ? 'Installation...' : 'Installer et redemarrer' }}\n      </button>\n\n      <span class=\"settings-hint\" *ngIf=\"!hasUpdatesApi\">Disponible uniquement dans Electron.</span>\n    </div>\n\n    <div class=\"settings-feedback\">Statut: {{ getUpdateStatusLabel() }}</div>\n    <div class=\"settings-feedback\" *ngIf=\"updateMessage\">{{ updateMessage }}</div>\n    <div class=\"settings-feedback\" *ngIf=\"updateStatus === 'downloading'\">\n      Telechargement: {{ updateProgress | number:'1.0-0' }}%\n    </div>\n    <div class=\"settings-feedback err\" *ngIf=\"updateError\">{{ updateError }}</div>\n  </section>\n\n  <section class=\"card settings-card\">\n    <div class=\"settings-actions\">\n      <button class=\"btn-run\" type=\"button\" (click)=\"createBackup()\" [disabled]=\"creatingBackup || !hasDbApi\">\n        {{ creatingBackup ? 'Sauvegarde...' : 'Sauvegarder la base' }}\n      </button>\n      <span class=\"settings-hint\" *ngIf=\"!hasDbApi\">Disponible uniquement dans Electron.</span>\n    </div>\n\n    <div class=\"settings-feedback ok\" *ngIf=\"infoMessage\">{{ infoMessage }}</div>\n    <div class=\"settings-feedback err\" *ngIf=\"errorMessage\">{{ errorMessage }}</div>\n    <div class=\"settings-feedback\" *ngIf=\"loading\">Chargement des sauvegardes...</div>\n\n    <table class=\"backups-table\" *ngIf=\"!loading\">\n      <thead>\n        <tr>\n          <th>Date</th>\n          <th>Taille</th>\n          <th>Fichier</th>\n          <th>Action</th>\n        </tr>\n      </thead>\n      <tbody>\n        <tr *ngFor=\"let backup of backups; trackBy: trackByBackup\">\n          <td>{{ backup.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>\n          <td>{{ formatSize(backup.size) }}</td>\n          <td>{{ backup.fileName }}</td>\n          <td>\n            <button\n              class=\"btn-restore\"\n              type=\"button\"\n              [disabled]=\"restoringFileName !== null || !hasDbApi\"\n              (click)=\"restoreBackup(backup)\"\n            >\n              {{ restoringFileName === backup.fileName ? 'Restauration...' : 'Restaurer' }}\n            </button>\n          </td>\n        </tr>\n        <tr *ngIf=\"backups.length === 0\">\n          <td colspan=\"4\" class=\"empty-backups\">Aucune sauvegarde disponible.</td>\n        </tr>\n      </tbody>\n    </table>\n  </section>\n</section>\n", styles: [".settings-card {\n  display: grid;\n  gap: 10px;\n}\n\n.update-card h2 {\n  margin: 0;\n  font-size: 1rem;\n}\n\n.settings-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n\n.btn-run,\n.btn-restore {\n  border: 1px solid #1a56db;\n  background: #1a56db;\n  color: #fff;\n  border-radius: 8px;\n  padding: 7px 12px;\n  font-size: 0.82rem;\n  font-weight: 600;\n  cursor: pointer;\n}\n\n.btn-run[disabled],\n.btn-restore[disabled] {\n  opacity: 0.55;\n  cursor: not-allowed;\n}\n\n.btn-restore {\n  background: #fff;\n  color: #1a56db;\n}\n\n.settings-hint {\n  color: #64748b;\n  font-size: 0.78rem;\n}\n\n.settings-feedback {\n  padding: 9px 12px;\n  border-radius: 8px;\n  background: #f8fafc;\n  color: #334155;\n  font-size: 0.82rem;\n}\n\n.settings-feedback.ok {\n  background: #dcfce7;\n  color: #166534;\n}\n\n.settings-feedback.err {\n  background: #fee2e2;\n  color: #991b1b;\n}\n\n.backups-table {\n  width: 100%;\n  border-collapse: collapse;\n}\n\n.backups-table th,\n.backups-table td {\n  padding: 10px;\n  text-align: left;\n  border-bottom: 1px solid var(--border);\n  font-size: 0.83rem;\n}\n\n.backups-table thead th {\n  background: #f8fafc;\n  font-weight: 700;\n}\n\n.empty-backups {\n  text-align: center;\n  color: #64748b;\n}\n"] }]
    }], () => [{ type: i1.IpcService }, { type: i0.ChangeDetectorRef }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(SettingsComponent, { className: "SettingsComponent", filePath: "src/app/settings/settings.component.ts", lineNumber: 14 }); })();
