import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../services/ipc.service";
export class SalaryAdvancesRepository {
    constructor(ipc) {
        this.ipc = ipc;
    }
    listByEmployee(employeeId, month, year) {
        return this.ipc.salaryAdvancesList(employeeId, month, year);
    }
    create(payload) {
        return this.ipc.salaryAdvancesCreate(payload);
    }
    delete(id) {
        return this.ipc.salaryAdvancesDelete(id);
    }
    getMonthlyTotal(employeeId, month, year) {
        return this.ipc.salaryAdvancesTotal(employeeId, month, year);
    }
    static { this.ɵfac = function SalaryAdvancesRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || SalaryAdvancesRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: SalaryAdvancesRepository, factory: SalaryAdvancesRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(SalaryAdvancesRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
