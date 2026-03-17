import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "./ipc.service";
export class SalarySummaryService {
    constructor(ipc) {
        this.ipc = ipc;
    }
    getEmployeeSalarySummary(employeeId, month, year) {
        return this.ipc.salarySummary(employeeId, month, year);
    }
    static { this.ɵfac = function SalarySummaryService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || SalarySummaryService)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: SalarySummaryService, factory: SalarySummaryService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(SalarySummaryService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
