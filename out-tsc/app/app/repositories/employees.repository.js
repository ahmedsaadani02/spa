import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../services/ipc.service";
export class EmployeesRepository {
    constructor(ipc) {
        this.ipc = ipc;
    }
    list() {
        return this.ipc.employeesList();
    }
    getById(id) {
        return this.ipc.employeesGetById(id);
    }
    create(payload) {
        return this.ipc.employeesCreate(payload);
    }
    update(id, payload) {
        return this.ipc.employeesUpdate(id, payload);
    }
    delete(id) {
        return this.ipc.employeesDelete(id);
    }
    search(query) {
        return this.ipc.employeesSearch(query);
    }
    setActive(id, actif) {
        return this.ipc.employeesSetActive(id, actif);
    }
    static { this.ɵfac = function EmployeesRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || EmployeesRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: EmployeesRepository, factory: EmployeesRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(EmployeesRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
