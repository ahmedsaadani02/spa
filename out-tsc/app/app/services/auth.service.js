import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "../repositories/auth.repository";
const EMPTY_PERMISSIONS = {
    viewStock: false,
    manageStock: false,
    manageEmployees: false,
    manageInvoices: false,
    manageQuotes: false,
    manageClients: false,
    manageSalary: false
};
const EMPLOYEE_ALLOWED_PERMISSIONS = new Set(['viewStock', 'manageStock']);
export class AuthService {
    constructor(authRepository) {
        this.authRepository = authRepository;
        this.currentUserSubject = new BehaviorSubject(null);
        this.currentUser$ = this.currentUserSubject.asObservable();
        this.initialized = false;
        this.initPromise = null;
    }
    async ensureInitialized() {
        if (this.initialized)
            return;
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = (async () => {
            const user = await this.authRepository.getCurrentUser();
            this.currentUserSubject.next(user);
            this.initialized = true;
        })().finally(() => {
            this.initPromise = null;
        });
        return this.initPromise;
    }
    async login(username, password) {
        const user = await this.authRepository.login(username, password);
        this.currentUserSubject.next(user);
        return !!user;
    }
    async beginLogin(identity, password) {
        const result = await this.authRepository.beginLogin(identity, password);
        if (result.status === 'success' && result.user) {
            this.currentUserSubject.next(result.user);
        }
        return result;
    }
    async verifyLogin2fa(challengeId, code) {
        const result = await this.authRepository.verifyLogin2fa(challengeId, code);
        if (result.ok && result.user) {
            this.currentUserSubject.next(result.user);
        }
        return result;
    }
    requestPasswordReset(email) {
        return this.authRepository.requestPasswordReset(email);
    }
    confirmPasswordReset(challengeId, code, newPassword) {
        return this.authRepository.confirmPasswordReset(challengeId, code, newPassword);
    }
    requestPasswordSetup(email) {
        return this.authRepository.requestPasswordSetup(email);
    }
    completePasswordSetup(challengeId, code, newPassword) {
        return this.authRepository.completePasswordSetup(challengeId, code, newPassword);
    }
    async logout() {
        await this.authRepository.logout();
        this.currentUserSubject.next(null);
    }
    async refreshCurrentUser() {
        const user = await this.authRepository.getCurrentUser();
        this.currentUserSubject.next(user);
        return user;
    }
    async resetPassword(employeeId, newPassword) {
        return this.authRepository.resetPassword(employeeId, newPassword);
    }
    isLoggedIn() {
        return !!this.currentUserSubject.value;
    }
    currentUser() {
        return this.currentUserSubject.value;
    }
    role() {
        return this.currentUserSubject.value?.role ?? null;
    }
    username() {
        return this.currentUserSubject.value?.username ?? null;
    }
    displayName() {
        return this.currentUserSubject.value?.nom ?? null;
    }
    permissions() {
        return this.currentUserSubject.value?.permissions ?? EMPTY_PERMISSIONS;
    }
    hasPermission(permission) {
        const user = this.currentUserSubject.value;
        if (!user)
            return false;
        if (user.role === 'admin' || user.role === 'developer' || user.role === 'owner')
            return true;
        if (user.role === 'employee' && !EMPLOYEE_ALLOWED_PERMISSIONS.has(permission)) {
            return false;
        }
        return !!user.permissions[permission];
    }
    getDefaultRoute() {
        if (!this.isLoggedIn())
            return '/login';
        if (this.role() === 'employee') {
            return this.hasPermission('viewStock') ? '/stock' : '/access-denied';
        }
        if (this.hasPermission('manageInvoices'))
            return '/invoices';
        if (this.hasPermission('manageQuotes'))
            return '/quotes';
        if (this.hasPermission('manageClients'))
            return '/clients';
        if (this.hasPermission('viewStock'))
            return '/stock';
        if (this.hasPermission('manageEmployees'))
            return '/employees';
        if (this.hasPermission('manageSalary'))
            return '/employees';
        return '/access-denied';
    }
    static { this.ɵfac = function AuthService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || AuthService)(i0.ɵɵinject(i1.AuthRepository)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: AuthService, factory: AuthService.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AuthService, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], () => [{ type: i1.AuthRepository }], null); })();
