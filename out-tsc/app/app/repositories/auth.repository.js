import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "../services/ipc.service";
export class AuthRepository {
    constructor(ipc) {
        this.ipc = ipc;
    }
    get userAgent() {
        return typeof navigator === 'undefined' ? null : navigator.userAgent;
    }
    login(username, password) {
        return this.ipc.authLogin(username, password);
    }
    beginLogin(identity, password) {
        return this.ipc.authBeginLogin(identity, password, { userAgent: this.userAgent });
    }
    verifyLogin2fa(challengeId, code) {
        return this.ipc.authVerifyLogin2fa(challengeId, code, { userAgent: this.userAgent });
    }
    requestPasswordReset(email) {
        return this.ipc.authRequestPasswordReset(email, { userAgent: this.userAgent });
    }
    confirmPasswordReset(challengeId, code, newPassword) {
        return this.ipc.authConfirmPasswordReset(challengeId, code, newPassword, { userAgent: this.userAgent });
    }
    requestPasswordSetup(email) {
        return this.ipc.authRequestPasswordSetup(email, { userAgent: this.userAgent });
    }
    completePasswordSetup(challengeId, code, newPassword) {
        return this.ipc.authCompletePasswordSetup(challengeId, code, newPassword, { userAgent: this.userAgent });
    }
    logout() {
        return this.ipc.authLogout();
    }
    getCurrentUser() {
        return this.ipc.authGetCurrentUser();
    }
    hasPermission(permission) {
        return this.ipc.authHasPermission(permission);
    }
    resetPassword(employeeId, newPassword) {
        return this.ipc.authResetPassword(employeeId, newPassword);
    }
    static { this.ɵfac = function AuthRepository_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || AuthRepository)(i0.ɵɵinject(i1.IpcService)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: AuthRepository, factory: AuthRepository.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(AuthRepository, [{
        type: Injectable,
        args: [{
                providedIn: 'root'
            }]
    }], () => [{ type: i1.IpcService }], null); })();
