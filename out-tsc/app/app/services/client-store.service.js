import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "./client-persistence.service";
export class ClientStoreService {
    constructor(persistence) {
        this.persistence = persistence;
        this.clientsSubject = new BehaviorSubject([]);
        this.clients$ = this.clientsSubject.asObservable();
        this.loaded = false;
        this.loadPromise = null;
        this.refreshInFlight = null;
        this.refreshQueued = false;
    }
    async load() {
        if (this.loaded)
            return;
        if (this.loadPromise)
            return this.loadPromise;
        this.loadPromise = this.refresh()
            .then(() => {
            this.loaded = true;
        })
            .finally(() => {
            this.loadPromise = null;
        });
        return this.loadPromise;
    }
    async refresh() {
        if (this.refreshInFlight) {
            this.refreshQueued = true;
            return this.refreshInFlight;
        }
        this.refreshInFlight = this.runRefreshLoop().finally(() => {
            this.refreshInFlight = null;
        });
        return this.refreshInFlight;
    }
    getSnapshot() {
        return this.clientsSubject.value;
    }
    async runRefreshLoop() {
        do {
            this.refreshQueued = false;
            const all = await this.persistence.list();
            const sorted = [...all].sort((a, b) => (a.nom || '').localeCompare((b.nom || ''), 'fr', { sensitivity: 'base' }));
            if (!this.sameCollection(this.clientsSubject.value, sorted)) {
                this.clientsSubject.next(sorted);
            }
        } while (this.refreshQueued);
    }
    sameCollection(left, right) {
        if (left.length !== right.length)
            return false;
        for (let index = 0; index < left.length; index += 1) {
            if (this.signature(left[index]) !== this.signature(right[index])) {
                return false;
            }
        }
        return true;
    }
    signature(client) {
        return [
            client.id ?? '',
            client.nom ?? '',
            client.tel ?? client.telephone ?? '',
            client.email ?? '',
            client.mf ?? '',
            client.updatedAt ?? '',
            client.createdAt ?? ''
        ].join('|');
    }
    static { this.ɵfac = function ClientStoreService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ClientStoreService)(i0.ɵɵinject(i1.ClientPersistenceService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ClientStoreService, factory: ClientStoreService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(ClientStoreService, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.ClientPersistenceService }], null); })();
