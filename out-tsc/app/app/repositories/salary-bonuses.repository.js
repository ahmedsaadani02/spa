import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../services/ipc.service";
export class SalaryBonusesRepository {
    constructor(ipc) {
        this.ipc = ipc;
    }
    listByEmployee(employeeId, month, year) {
        return this.ipc.salaryBonusesList(employeeId, month, year);
    }
    create(payload) {
        return this.ipc.salaryBonusesCreate(payload);
    }
    delete(id) {
        return this.ipc.salaryBonusesDelete(id);
    }
    getMonthlyTotal(employeeId, month, year) {
        return this.ipc.salaryBonusesTotal(employeeId, month, year);
    }
    static { this.ɵfac = function SalaryBonusesRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || SalaryBonusesRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: SalaryBonusesRepository, factory: SalaryBonusesRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(SalaryBonusesRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
