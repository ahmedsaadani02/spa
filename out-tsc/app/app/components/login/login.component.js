import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
import * as i2 from "../../services/auth.service";
import * as i3 from "@angular/router";
import * as i4 from "@angular/common";
function LoginComponent_h1_27_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h1");
    i0.ɵɵtext(1, "Connexion");
    i0.ɵɵelementEnd();
} }
function LoginComponent_h1_28_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h1");
    i0.ɵɵtext(1, "Verification 2FA");
    i0.ɵɵelementEnd();
} }
function LoginComponent_h1_29_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h1");
    i0.ɵɵtext(1, "Mot de passe oublie");
    i0.ɵɵelementEnd();
} }
function LoginComponent_h1_30_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h1");
    i0.ɵɵtext(1, "Nouveau mot de passe");
    i0.ɵɵelementEnd();
} }
function LoginComponent_h1_31_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h1");
    i0.ɵɵtext(1, "Activation compte protege");
    i0.ɵɵelementEnd();
} }
function LoginComponent_h1_32_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h1");
    i0.ɵɵtext(1, "Finaliser activation");
    i0.ɵɵelementEnd();
} }
function LoginComponent_form_33_span_11_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelement(0, "span", 36);
} }
function LoginComponent_form_33_span_12_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelement(0, "span", 37);
} }
function LoginComponent_form_33_span_21_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span");
    i0.ɵɵtext(1, "Se connecter");
    i0.ɵɵelementEnd();
} }
function LoginComponent_form_33_span_22_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span");
    i0.ɵɵtext(1, "Connexion...");
    i0.ɵɵelementEnd();
} }
function LoginComponent_form_33_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "form", 22);
    i0.ɵɵlistener("ngSubmit", function LoginComponent_form_33_Template_form_ngSubmit_0_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.submitLogin()); });
    i0.ɵɵelementStart(1, "label", 23)(2, "span");
    i0.ɵɵtext(3, "Username ou email");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(4, "input", 24);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "label", 23)(6, "span");
    i0.ɵɵtext(7, "Mot de passe");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "div", 25);
    i0.ɵɵelement(9, "input", 26);
    i0.ɵɵelementStart(10, "button", 27);
    i0.ɵɵlistener("click", function LoginComponent_form_33_Template_button_click_10_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.togglePassword()); });
    i0.ɵɵtemplate(11, LoginComponent_form_33_span_11_Template, 1, 0, "span", 28)(12, LoginComponent_form_33_span_12_Template, 1, 0, "span", 29);
    i0.ɵɵelementEnd()()();
    i0.ɵɵelementStart(13, "div", 30)(14, "label", 31);
    i0.ɵɵelement(15, "input", 32);
    i0.ɵɵelementStart(16, "span");
    i0.ɵɵtext(17, "Rester connecte");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(18, "button", 33);
    i0.ɵɵlistener("click", function LoginComponent_form_33_Template_button_click_18_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.openForgotPassword()); });
    i0.ɵɵtext(19, "Mot de passe oublie ?");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(20, "button", 34);
    i0.ɵɵtemplate(21, LoginComponent_form_33_span_21_Template, 2, 0, "span", 18)(22, LoginComponent_form_33_span_22_Template, 2, 0, "span", 18);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(23, "button", 35);
    i0.ɵɵlistener("click", function LoginComponent_form_33_Template_button_click_23_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.openProtectedSetup()); });
    i0.ɵɵtext(24, " Activer un compte protege ");
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("formGroup", ctx_r1.loginForm);
    i0.ɵɵadvance(9);
    i0.ɵɵproperty("type", ctx_r1.showPassword ? "text" : "password");
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngIf", !ctx_r1.showPassword);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.showPassword);
    i0.ɵɵadvance(8);
    i0.ɵɵproperty("disabled", ctx_r1.loading);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", !ctx_r1.loading);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.loading);
} }
function LoginComponent_form_34_Template(rf, ctx) { if (rf & 1) {
    const _r3 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "form", 22);
    i0.ɵɵlistener("ngSubmit", function LoginComponent_form_34_Template_form_ngSubmit_0_listener() { i0.ɵɵrestoreView(_r3); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.submitTwoFactor()); });
    i0.ɵɵelementStart(1, "p", 38);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "label", 23)(4, "span");
    i0.ɵɵtext(5, "Code a 6 chiffres");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(6, "input", 39);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(7, "div", 30)(8, "button", 34);
    i0.ɵɵtext(9, "Valider");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "button", 40);
    i0.ɵɵlistener("click", function LoginComponent_form_34_Template_button_click_10_listener() { i0.ɵɵrestoreView(_r3); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.backToLogin()); });
    i0.ɵɵtext(11, "Retour");
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("formGroup", ctx_r1.twofaForm);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate1("Code envoye a ", ctx_r1.maskedEmail || "votre email");
    i0.ɵɵadvance(6);
    i0.ɵɵproperty("disabled", ctx_r1.loading);
} }
function LoginComponent_form_35_Template(rf, ctx) { if (rf & 1) {
    const _r4 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "form", 22);
    i0.ɵɵlistener("ngSubmit", function LoginComponent_form_35_Template_form_ngSubmit_0_listener() { i0.ɵɵrestoreView(_r4); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.step === "request-reset" ? ctx_r1.submitRequestReset() : ctx_r1.submitRequestSetup()); });
    i0.ɵɵelementStart(1, "label", 23)(2, "span");
    i0.ɵɵtext(3, "Email autorise");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(4, "input", 41);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "div", 30)(6, "button", 34);
    i0.ɵɵtext(7, "Envoyer code");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(8, "button", 40);
    i0.ɵɵlistener("click", function LoginComponent_form_35_Template_button_click_8_listener() { i0.ɵɵrestoreView(_r4); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.backToLogin()); });
    i0.ɵɵtext(9, "Retour");
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("formGroup", ctx_r1.requestForm);
    i0.ɵɵadvance(6);
    i0.ɵɵproperty("disabled", ctx_r1.loading);
} }
function LoginComponent_form_36_p_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p", 38);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1("Code envoye a ", ctx_r1.maskedEmail);
} }
function LoginComponent_form_36_Template(rf, ctx) { if (rf & 1) {
    const _r5 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "form", 22);
    i0.ɵɵlistener("ngSubmit", function LoginComponent_form_36_Template_form_ngSubmit_0_listener() { i0.ɵɵrestoreView(_r5); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.step === "confirm-reset" ? ctx_r1.submitConfirmReset() : ctx_r1.submitCompleteSetup()); });
    i0.ɵɵtemplate(1, LoginComponent_form_36_p_1_Template, 2, 1, "p", 42);
    i0.ɵɵelementStart(2, "label", 23)(3, "span");
    i0.ɵɵtext(4, "Code");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(5, "input", 39);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(6, "label", 23)(7, "span");
    i0.ɵɵtext(8, "Nouveau mot de passe");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(9, "input", 43);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(10, "label", 23)(11, "span");
    i0.ɵɵtext(12, "Confirmation mot de passe");
    i0.ɵɵelementEnd();
    i0.ɵɵelement(13, "input", 44);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(14, "div", 30)(15, "button", 34);
    i0.ɵɵtext(16, "Valider");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(17, "button", 40);
    i0.ɵɵlistener("click", function LoginComponent_form_36_Template_button_click_17_listener() { i0.ɵɵrestoreView(_r5); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.backToLogin()); });
    i0.ɵɵtext(18, "Retour");
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(19, "button", 35);
    i0.ɵɵlistener("click", function LoginComponent_form_36_Template_button_click_19_listener() { i0.ɵɵrestoreView(_r5); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.toggleActionPassword()); });
    i0.ɵɵtext(20);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("formGroup", ctx_r1.actionForm);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.maskedEmail);
    i0.ɵɵadvance(8);
    i0.ɵɵproperty("type", ctx_r1.showActionPassword ? "text" : "password");
    i0.ɵɵadvance(4);
    i0.ɵɵproperty("type", ctx_r1.showActionPassword ? "text" : "password");
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("disabled", ctx_r1.loading);
    i0.ɵɵadvance(5);
    i0.ɵɵtextInterpolate1(" ", ctx_r1.showActionPassword ? "Masquer mot de passe" : "Afficher mot de passe", " ");
} }
function LoginComponent_div_37_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 45);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.info);
} }
function LoginComponent_div_38_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 46);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r1.error);
} }
export class LoginComponent {
    constructor(fb, auth, router) {
        this.fb = fb;
        this.auth = auth;
        this.router = router;
        this.loading = false;
        this.error = '';
        this.info = '';
        this.showPassword = false;
        this.showActionPassword = false;
        this.step = 'login';
        this.challengeId = null;
        this.maskedEmail = '';
        this.loginForm = this.fb.group({
            identity: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            remember: [true]
        });
        this.twofaForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
        });
        this.requestForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
        this.actionForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
            newPassword: ['', [Validators.required, Validators.minLength(10)]],
            confirmPassword: ['', [Validators.required]]
        });
    }
    async submitLogin() {
        this.resetMessages();
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }
        this.loading = true;
        try {
            const { identity, password } = this.loginForm.getRawValue();
            const result = await this.auth.beginLogin(identity ?? '', password ?? '');
            if (result.status === 'success') {
                await this.router.navigateByUrl(this.auth.getDefaultRoute());
                return;
            }
            if (result.status === 'requires_2fa') {
                this.challengeId = result.challengeId ?? null;
                this.maskedEmail = result.maskedEmail ?? '';
                this.step = 'twofa';
                this.info = `Code envoye a ${this.maskedEmail || 'votre email'}.`;
                this.twofaForm.reset({ code: '' });
                return;
            }
            if (result.status === 'must_setup_password') {
                this.step = 'request-setup';
                const identityValue = String(identity ?? '').trim();
                this.requestForm.patchValue({
                    email: identityValue.includes('@') ? identityValue : ''
                });
                this.info = 'Compte protege: activation mot de passe requise avant connexion.';
                return;
            }
            if (result.status === 'blocked_temporarily') {
                this.error = `Trop de tentatives. Reessayez dans ${result.retryAfterSeconds ?? 60}s.`;
                return;
            }
            this.error = "Identifiants invalides.";
        }
        finally {
            this.loading = false;
        }
    }
    async submitTwoFactor() {
        this.resetMessages();
        if (!this.challengeId) {
            this.error = 'Session 2FA invalide. Reconnectez-vous.';
            this.step = 'login';
            return;
        }
        if (this.twofaForm.invalid) {
            this.twofaForm.markAllAsTouched();
            return;
        }
        this.loading = true;
        try {
            const code = this.twofaForm.controls.code.value ?? '';
            const result = await this.auth.verifyLogin2fa(this.challengeId, code);
            if (result.ok && result.status === 'success') {
                await this.router.navigateByUrl(this.auth.getDefaultRoute());
                return;
            }
            if (result.status === 'blocked_temporarily') {
                this.error = `Verification bloquee temporairement (${result.retryAfterSeconds ?? 60}s).`;
                return;
            }
            this.error = result.status === 'expired_code' ? 'Code expire.' : 'Code invalide.';
        }
        finally {
            this.loading = false;
        }
    }
    async submitRequestReset() {
        this.resetMessages();
        if (this.requestForm.invalid) {
            this.requestForm.markAllAsTouched();
            return;
        }
        this.loading = true;
        try {
            const email = this.requestForm.controls.email.value ?? '';
            const result = await this.auth.requestPasswordReset(email);
            if (result.status === 'blocked_temporarily') {
                this.error = `Demande bloquee temporairement (${result.retryAfterSeconds ?? 60}s).`;
                return;
            }
            this.challengeId = result.challengeId ?? null;
            this.maskedEmail = result.maskedEmail ?? '';
            this.info = 'Si le compte existe et est protege, un code a ete envoye.';
            if (this.challengeId) {
                this.step = 'confirm-reset';
            }
        }
        finally {
            this.loading = false;
        }
    }
    async submitConfirmReset() {
        this.resetMessages();
        if (!this.challengeId) {
            this.error = 'Challenge reset introuvable.';
            return;
        }
        if (this.actionForm.invalid) {
            this.actionForm.markAllAsTouched();
            return;
        }
        const { code, newPassword, confirmPassword } = this.actionForm.getRawValue();
        if (newPassword !== confirmPassword) {
            this.error = 'Confirmation mot de passe differente.';
            return;
        }
        this.loading = true;
        try {
            const result = await this.auth.confirmPasswordReset(this.challengeId, code ?? '', newPassword ?? '');
            if (result.ok && result.status === 'completed') {
                this.info = 'Mot de passe mis a jour. Vous pouvez vous connecter.';
                this.backToLogin();
                return;
            }
            this.error = result.message ?? this.statusToMessage(result.status);
        }
        finally {
            this.loading = false;
        }
    }
    async submitRequestSetup() {
        this.resetMessages();
        if (this.requestForm.invalid) {
            this.requestForm.markAllAsTouched();
            return;
        }
        this.loading = true;
        try {
            const email = this.requestForm.controls.email.value ?? '';
            const result = await this.auth.requestPasswordSetup(email);
            if (result.status === 'blocked_temporarily') {
                this.error = `Demande bloquee temporairement (${result.retryAfterSeconds ?? 60}s).`;
                return;
            }
            this.challengeId = result.challengeId ?? null;
            this.maskedEmail = result.maskedEmail ?? '';
            this.info = 'Si le compte protege est valide, un code setup a ete envoye.';
            if (this.challengeId) {
                this.step = 'complete-setup';
            }
        }
        finally {
            this.loading = false;
        }
    }
    async submitCompleteSetup() {
        this.resetMessages();
        if (!this.challengeId) {
            this.error = 'Challenge setup introuvable.';
            return;
        }
        if (this.actionForm.invalid) {
            this.actionForm.markAllAsTouched();
            return;
        }
        const { code, newPassword, confirmPassword } = this.actionForm.getRawValue();
        if (newPassword !== confirmPassword) {
            this.error = 'Confirmation mot de passe differente.';
            return;
        }
        this.loading = true;
        try {
            const result = await this.auth.completePasswordSetup(this.challengeId, code ?? '', newPassword ?? '');
            if (result.ok && result.status === 'completed') {
                this.info = 'Activation terminee. Connectez-vous avec votre nouveau mot de passe.';
                this.backToLogin();
                return;
            }
            this.error = result.message ?? this.statusToMessage(result.status);
        }
        finally {
            this.loading = false;
        }
    }
    openForgotPassword() {
        this.resetMessages();
        this.step = 'request-reset';
        this.challengeId = null;
        this.maskedEmail = '';
        this.actionForm.reset({ code: '', newPassword: '', confirmPassword: '' });
    }
    openProtectedSetup() {
        this.resetMessages();
        this.step = 'request-setup';
        this.challengeId = null;
        this.maskedEmail = '';
        this.actionForm.reset({ code: '', newPassword: '', confirmPassword: '' });
    }
    backToLogin() {
        this.step = 'login';
        this.challengeId = null;
        this.maskedEmail = '';
        this.twofaForm.reset({ code: '' });
        this.actionForm.reset({ code: '', newPassword: '', confirmPassword: '' });
    }
    togglePassword() {
        this.showPassword = !this.showPassword;
    }
    toggleActionPassword() {
        this.showActionPassword = !this.showActionPassword;
    }
    statusToMessage(status) {
        if (status === 'weak_password')
            return 'Mot de passe trop faible.';
        if (status === 'expired_code')
            return 'Code expire.';
        if (status === 'too_many_attempts')
            return 'Trop de tentatives.';
        if (status === 'blocked_temporarily')
            return 'Operation temporairement bloquee.';
        if (status === 'invalid_code')
            return 'Code invalide.';
        return 'Operation impossible.';
    }
    resetMessages() {
        this.error = '';
        this.info = '';
    }
    static { this.ɵfac = function LoginComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || LoginComponent)(i0.ɵɵdirectiveInject(i1.FormBuilder), i0.ɵɵdirectiveInject(i2.AuthService), i0.ɵɵdirectiveInject(i3.Router)); }; }
    static { this.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: LoginComponent, selectors: [["app-login"]], decls: 39, vars: 12, consts: [[1, "login-page"], [1, "bg"], [1, "grain"], [1, "glow", "glow-1"], [1, "glow", "glow-2"], [1, "shell"], [1, "brand-panel"], [1, "brand-top"], ["src", "assets/logospa.png", "alt", "SPA", 1, "brand-logo"], [1, "brand-text"], [1, "brand-name"], [1, "brand-sub"], [1, "brand-quote"], [1, "quote-mark"], [1, "brand-bottom"], [1, "login-panel"], [1, "card"], [1, "card-head"], [4, "ngIf"], ["class", "form", 3, "formGroup", "ngSubmit", 4, "ngIf"], ["class", "info", 4, "ngIf"], ["class", "error", 4, "ngIf"], [1, "form", 3, "ngSubmit", "formGroup"], [1, "field"], ["type", "text", "formControlName", "identity", "autocomplete", "username", 1, "input"], [1, "password-wrap"], ["formControlName", "password", "autocomplete", "current-password", 1, "input", 3, "type"], ["type", "button", 1, "icon-btn", 3, "click"], ["class", "dot", 4, "ngIf"], ["class", "dot open", 4, "ngIf"], [1, "row"], [1, "check"], ["type", "checkbox", "formControlName", "remember"], ["type", "button", 1, "link-btn", 3, "click"], ["type", "submit", 1, "btn", "primary", 3, "disabled"], ["type", "button", 1, "link-btn", "secondary", 3, "click"], [1, "dot"], [1, "dot", "open"], [1, "help"], ["type", "text", "maxlength", "6", "formControlName", "code", 1, "input"], ["type", "button", 1, "btn", "ghost", 3, "click"], ["type", "email", "formControlName", "email", "autocomplete", "email", 1, "input"], ["class", "help", 4, "ngIf"], ["formControlName", "newPassword", 1, "input", 3, "type"], ["formControlName", "confirmPassword", 1, "input", 3, "type"], [1, "info"], [1, "error"]], template: function LoginComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "div", 0)(1, "div", 1);
            i0.ɵɵelement(2, "div", 2)(3, "div", 3)(4, "div", 4);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(5, "div", 5)(6, "section", 6)(7, "div", 7);
            i0.ɵɵelement(8, "img", 8);
            i0.ɵɵelementStart(9, "div", 9)(10, "div", 10);
            i0.ɵɵtext(11, "SPA - Societe d'Aluminium");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(12, "div", 11);
            i0.ɵɵtext(13, "Facturation - Stock - Devis - Estimation");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(14, "div", 12)(15, "div", 13);
            i0.ɵɵtext(16, "\"");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(17, "p");
            i0.ɵɵtext(18, " Authentification ERP securisee avec protection renforcee pour les comptes sensibles. ");
            i0.ɵɵelementEnd()();
            i0.ɵɵelementStart(19, "div", 14)(20, "span");
            i0.ɵɵtext(21, "Statut : OK");
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(22, "span");
            i0.ɵɵtext(23, "\u00A9 SPA");
            i0.ɵɵelementEnd()()();
            i0.ɵɵelementStart(24, "section", 15)(25, "div", 16)(26, "div", 17);
            i0.ɵɵtemplate(27, LoginComponent_h1_27_Template, 2, 0, "h1", 18)(28, LoginComponent_h1_28_Template, 2, 0, "h1", 18)(29, LoginComponent_h1_29_Template, 2, 0, "h1", 18)(30, LoginComponent_h1_30_Template, 2, 0, "h1", 18)(31, LoginComponent_h1_31_Template, 2, 0, "h1", 18)(32, LoginComponent_h1_32_Template, 2, 0, "h1", 18);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(33, LoginComponent_form_33_Template, 25, 7, "form", 19)(34, LoginComponent_form_34_Template, 12, 3, "form", 19)(35, LoginComponent_form_35_Template, 10, 2, "form", 19)(36, LoginComponent_form_36_Template, 21, 6, "form", 19)(37, LoginComponent_div_37_Template, 2, 1, "div", 20)(38, LoginComponent_div_38_Template, 2, 1, "div", 21);
            i0.ɵɵelementEnd()()()();
        } if (rf & 2) {
            i0.ɵɵadvance(27);
            i0.ɵɵproperty("ngIf", ctx.step === "login");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "twofa");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "request-reset");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "confirm-reset");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "request-setup");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "complete-setup");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "login");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "twofa");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "request-reset" || ctx.step === "request-setup");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.step === "confirm-reset" || ctx.step === "complete-setup");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.info);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.error);
        } }, dependencies: [CommonModule, i4.NgIf, ReactiveFormsModule, i1.ɵNgNoValidate, i1.DefaultValueAccessor, i1.CheckboxControlValueAccessor, i1.NgControlStatus, i1.NgControlStatusGroup, i1.MaxLengthValidator, i1.FormGroupDirective, i1.FormControlName], styles: ["[_nghost-%COMP%] { display: block; }\n\n\n\n.login-page[_ngcontent-%COMP%]{\n  position: fixed;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n\n  display: grid;\n  place-items: center;\n\n  overflow: hidden;\n  background: #05060a;\n  padding: 26px;\n\n  color: #e9ecf6;\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;\n}\n\n\n\n.bg[_ngcontent-%COMP%] { \n  position: absolute; \n  inset: 0; \n  z-index: 0; \n  overflow: hidden;\n}\n\n.grain[_ngcontent-%COMP%]{\n  position:absolute; inset:0;\n  opacity:.14;\n  background-image:\n    radial-gradient(circle at 1px 1px, rgba(255,255,255,.06) 1px, transparent 0);\n  background-size: 26px 26px;\n}\n\n.glow[_ngcontent-%COMP%]{\n  position:absolute;\n  filter: blur(120px);\n  opacity: .35;\n  border-radius: 999px;\n}\n.glow-1[_ngcontent-%COMP%]{ width: 720px; height: 520px; left:-220px; top:-200px; background:#1a4fff; }\n.glow-2[_ngcontent-%COMP%]{ width: 680px; height: 560px; right:-260px; bottom:-260px; background:#00a3ff; }\n\n\n\n.shell[_ngcontent-%COMP%]{\n  width: 100%;\n  max-width: 1100px;\n  display: grid;\n  grid-template-columns: 1.05fr .95fr;\n  gap: 18px;\n  position: relative;\n  z-index: 2;\n}\n\n\n\n.brand-panel[_ngcontent-%COMP%]{\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  border-radius: 22px;\n  padding: 26px;\n  border: 1px solid rgba(255,255,255,.08);\n  background: rgba(12,14,22,.55);\n  backdrop-filter: blur(10px);\n}\n\n.brand-top[_ngcontent-%COMP%]{\n  display:flex;\n  gap: 14px;\n  align-items:center;\n}\n\n.brand-logo[_ngcontent-%COMP%]{\n  width: 54px;\n  height: 54px;\n  object-fit: contain;\n  border-radius: 14px;\n  background: rgba(255,255,255,.06);\n  border: 1px solid rgba(255,255,255,.10);\n  padding: 8px;\n}\n\n.brand-name[_ngcontent-%COMP%]{\n  font-weight: 800;\n  letter-spacing: .2px;\n  font-size: 16px;\n}\n\n.brand-sub[_ngcontent-%COMP%]{\n  margin-top: 2px;\n  color: rgba(233,236,246,.72);\n  font-size: 12.5px;\n}\n\n.brand-quote[_ngcontent-%COMP%]{\n  margin: 22px 0;\n  padding: 18px 18px;\n  border-radius: 18px;\n  border: 1px solid rgba(255,255,255,.08);\n  background: rgba(6,8,14,.55);\n}\n\n.quote-mark[_ngcontent-%COMP%]{\n  font-size: 30px;\n  opacity: .6;\n  line-height: 1;\n  margin-bottom: 8px;\n}\n\n.brand-quote[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{\n  margin: 0;\n  color: rgba(233,236,246,.82);\n  line-height: 1.55;\n  font-size: 14px;\n}\n\n.quote-footer[_ngcontent-%COMP%]{\n  display:flex;\n  align-items:center;\n  gap: 10px;\n  margin-top: 14px;\n  opacity: .9;\n}\n\n.avatar[_ngcontent-%COMP%]{\n  width: 38px;\n  height: 38px;\n  border-radius: 999px;\n  display:grid;\n  place-items:center;\n  font-weight: 900;\n  letter-spacing: .4px;\n  background: rgba(255,255,255,.08);\n  border: 1px solid rgba(255,255,255,.10);\n}\n\n.who[_ngcontent-%COMP%]{ font-weight: 700; font-size: 13px; }\n.meta[_ngcontent-%COMP%]{ color: rgba(233,236,246,.65); font-size: 12px; }\n\n.brand-bottom[_ngcontent-%COMP%]{\n  display:flex;\n  justify-content: space-between;\n  color: rgba(233,236,246,.55);\n  font-size: 11px;\n  text-transform: uppercase;\n  letter-spacing: .16em;\n}\n\n\n\n.login-panel[_ngcontent-%COMP%]{ display:grid; }\n\n.card[_ngcontent-%COMP%]{\n  border-radius: 22px;\n  padding: 26px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(10,12,18,.72);\n  backdrop-filter: blur(14px);\n  box-shadow: 0 30px 90px rgba(0,0,0,.55);\n  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;\n}\n\n@media (hover: hover) and (pointer: fine) {\n  .card[_ngcontent-%COMP%]:hover{\n    transform: translateY(-2px);\n    border-color: rgba(255,255,255,.16);\n    box-shadow: 0 40px 110px rgba(0,0,0,.62);\n  }\n}\n\n.card-head[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{\n  margin: 0;\n  font-size: 22px;\n  letter-spacing: .2px;\n}\n\n.card-head[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{\n  margin: 6px 0 18px;\n  color: rgba(233,236,246,.68);\n  font-size: 13px;\n}\n\n.form[_ngcontent-%COMP%]{ display:grid; gap: 14px; }\n\n.field[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{\n  display:block;\n  font-size: 12px;\n  color: rgba(233,236,246,.72);\n  margin: 0 0 7px 2px;\n}\n\n.input[_ngcontent-%COMP%]{\n  width: 100%;\n  padding: 12px 12px;\n  border-radius: 14px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(0,0,0,.28);\n  color: #fff;\n  outline: none;\n  transition: .18s ease;\n}\n\n.input[_ngcontent-%COMP%]::placeholder{ color: rgba(233,236,246,.35); }\n\n.input[_ngcontent-%COMP%]:focus{\n  border-color: rgba(43,108,255,.9);\n  box-shadow: 0 0 0 4px rgba(43,108,255,.16);\n}\n\n.hint[_ngcontent-%COMP%]{\n  display:block;\n  margin-top: 6px;\n  font-size: 12px;\n  color: rgba(233,236,246,.55);\n}\n\n\n\n.password-wrap[_ngcontent-%COMP%]{ position: relative; }\n\n.icon-btn[_ngcontent-%COMP%]{\n  position:absolute;\n  right: 10px;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 34px;\n  height: 34px;\n  border-radius: 10px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(255,255,255,.06);\n  cursor: pointer;\n}\n.icon-btn[_ngcontent-%COMP%]:hover{ border-color: rgba(43,108,255,.7); }\n\n.dot[_ngcontent-%COMP%]{\n  display:block;\n  width: 14px;\n  height: 14px;\n  border-radius: 999px;\n  margin: 0 auto;\n  background: rgba(233,236,246,.7);\n}\n.dot.open[_ngcontent-%COMP%]{\n  background: rgba(233,236,246,.25);\n  box-shadow: inset 0 0 0 2px rgba(233,236,246,.7);\n}\n\n.row[_ngcontent-%COMP%]{\n  display:flex;\n  align-items:center;\n  justify-content: space-between;\n  gap: 10px;\n  margin-top: 4px;\n}\n\n.check[_ngcontent-%COMP%]{\n  display:flex;\n  align-items:center;\n  gap: 8px;\n  font-size: 12px;\n  color: rgba(233,236,246,.75);\n}\n.check[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]{ accent-color: #2b6cff; }\n\n.help[_ngcontent-%COMP%]{\n  font-size: 12px;\n  color: rgba(233,236,246,.55);\n  text-align: right;\n}\n\n.info[_ngcontent-%COMP%]{\n  color: #8fe1ff;\n  background: rgba(71, 184, 255, .08);\n  border: 1px solid rgba(71, 184, 255, .22);\n  padding: 10px 12px;\n  border-radius: 14px;\n  font-size: 13px;\n}\n\n.error[_ngcontent-%COMP%]{\n  color: #ff6b6b;\n  background: rgba(255, 107, 107, .08);\n  border: 1px solid rgba(255, 107, 107, .18);\n  padding: 10px 12px;\n  border-radius: 14px;\n  font-size: 13px;\n}\n\n\n\n.btn[_ngcontent-%COMP%]{\n  width: 100%;\n  border-radius: 14px;\n  padding: 12px 14px;\n  font-weight: 800;\n  letter-spacing: .2px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(255,255,255,.06);\n  color: #fff;\n  cursor: pointer;\n  transition: transform .18s ease, filter .18s ease, opacity .18s ease;\n}\n\n.btn.primary[_ngcontent-%COMP%]{\n  background: linear-gradient(135deg, #2b6cff, #00a3ff);\n  border-color: rgba(43,108,255,.65);\n  box-shadow: 0 18px 50px rgba(0, 115, 255, .20);\n  position: relative;\n  overflow: hidden;\n}\n\n.btn[_ngcontent-%COMP%]:disabled{\n  opacity: .65;\n  cursor: not-allowed;\n}\n\n.link-btn[_ngcontent-%COMP%]{\n  border: none;\n  background: transparent;\n  color: #86b8ff;\n  font-size: 12px;\n  cursor: pointer;\n  padding: 0;\n  text-decoration: underline;\n}\n\n.link-btn.secondary[_ngcontent-%COMP%]{\n  justify-self: center;\n  margin-top: 2px;\n}\n\n.btn.primary[_ngcontent-%COMP%]:hover{\n  filter: brightness(1.02);\n  transform: translateY(-1px);\n}\n\n.btn.primary[_ngcontent-%COMP%]:active{\n  transform: translateY(0);\n  filter: brightness(.98);\n}\n\n\n\n@media (prefers-reduced-motion: no-preference) {\n  .btn.primary[_ngcontent-%COMP%]::after {\n    content: \"\";\n    position: absolute;\n    inset: -40% -60%;\n    background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);\n    transform: translateX(-40%);\n    animation: _ngcontent-%COMP%_btnShine 3.6s ease-in-out 1.2s infinite;\n    pointer-events: none;\n  }\n}\n\n@keyframes _ngcontent-%COMP%_btnShine {\n  0%, 70%   { transform: translateX(-40%); opacity: 0; }\n  75%       { opacity: 1; }\n  100%      { transform: translateX(40%); opacity: 0; }\n}\n\n\n\n.test-accounts[_ngcontent-%COMP%]{\n  margin-top: 12px;\n  padding-top: 12px;\n  border-top: 1px solid rgba(255,255,255,.08);\n}\n\n.ta-title[_ngcontent-%COMP%]{\n  font-size: 11px;\n  text-transform: uppercase;\n  letter-spacing: .16em;\n  color: rgba(233,236,246,.55);\n  margin-bottom: 10px;\n}\n\n.ta-grid[_ngcontent-%COMP%]{\n  display:grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}\n\n.ta[_ngcontent-%COMP%]{\n  border-radius: 14px;\n  padding: 10px 12px;\n  border: 1px solid rgba(255,255,255,.08);\n  background: rgba(0,0,0,.20);\n}\n\n.ta-role[_ngcontent-%COMP%]{\n  font-weight: 800;\n  font-size: 12px;\n  margin-bottom: 2px;\n}\n\n.ta-cred[_ngcontent-%COMP%]{\n  font-size: 12px;\n  color: rgba(233,236,246,.72);\n}\n\n.footnote[_ngcontent-%COMP%]{\n  margin-top: 8px;\n  font-size: 12px;\n  color: rgba(233,236,246,.60);\n  text-align: center;\n}\n\n\n\n@media (max-width: 980px){\n  .shell[_ngcontent-%COMP%]{ grid-template-columns: 1fr; }\n  .brand-panel[_ngcontent-%COMP%]{ display:none; }\n}\n\n\n\n\n\n\n\n@media (prefers-reduced-motion: no-preference) {\n  .shell[_ngcontent-%COMP%] {\n    animation: _ngcontent-%COMP%_shellIn 520ms cubic-bezier(.2,.9,.2,1) both;\n  }\n\n  .brand-panel[_ngcontent-%COMP%] {\n    animation: _ngcontent-%COMP%_fadeSlide 520ms cubic-bezier(.2,.9,.2,1) 80ms both;\n  }\n\n  .login-panel[_ngcontent-%COMP%] {\n    animation: _ngcontent-%COMP%_fadeSlide 520ms cubic-bezier(.2,.9,.2,1) 140ms both;\n  }\n\n  .card[_ngcontent-%COMP%] {\n    animation: _ngcontent-%COMP%_cardFloat 6s ease-in-out 700ms infinite;\n  }\n\n  .glow-1[_ngcontent-%COMP%] { animation: _ngcontent-%COMP%_glowPulse1 7.5s ease-in-out infinite; }\n  .glow-2[_ngcontent-%COMP%] { animation: _ngcontent-%COMP%_glowPulse2 8.5s ease-in-out infinite; }\n}\n\n@keyframes _ngcontent-%COMP%_shellIn {\n  from { opacity: 0; transform: translateY(10px) scale(.995); }\n  to   { opacity: 1; transform: translateY(0) scale(1); }\n}\n\n@keyframes _ngcontent-%COMP%_fadeSlide {\n  from { opacity: 0; transform: translateY(10px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n\n@keyframes _ngcontent-%COMP%_cardFloat {\n  0%, 100% { transform: translateY(0); }\n  50%      { transform: translateY(-3px); }\n}\n\n@keyframes _ngcontent-%COMP%_glowPulse1 {\n  0%, 100% { transform: translate(0,0) scale(1); opacity: .32; }\n  50%      { transform: translate(18px,12px) scale(1.05); opacity: .40; }\n}\n\n@keyframes _ngcontent-%COMP%_glowPulse2 {\n  0%, 100% { transform: translate(0,0) scale(1); opacity: .30; }\n  50%      { transform: translate(-16px,-10px) scale(1.06); opacity: .38; }\n}"] }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(LoginComponent, [{
        type: Component,
        args: [{ selector: 'app-login', standalone: true, imports: [CommonModule, ReactiveFormsModule], template: "<div class=\"login-page\">\n  <div class=\"bg\">\n    <div class=\"grain\"></div>\n    <div class=\"glow glow-1\"></div>\n    <div class=\"glow glow-2\"></div>\n  </div>\n\n  <div class=\"shell\">\n    <section class=\"brand-panel\">\n      <div class=\"brand-top\">\n        <img src=\"assets/logospa.png\" alt=\"SPA\" class=\"brand-logo\" />\n        <div class=\"brand-text\">\n          <div class=\"brand-name\">SPA - Societe d'Aluminium</div>\n          <div class=\"brand-sub\">Facturation - Stock - Devis - Estimation</div>\n        </div>\n      </div>\n\n      <div class=\"brand-quote\">\n        <div class=\"quote-mark\">\"</div>\n        <p>\n          Authentification ERP securisee avec protection renforcee\n          pour les comptes sensibles.\n        </p>\n      </div>\n\n      <div class=\"brand-bottom\">\n        <span>Statut : OK</span>\n        <span>&copy; SPA</span>\n      </div>\n    </section>\n\n    <section class=\"login-panel\">\n      <div class=\"card\">\n        <div class=\"card-head\">\n          <h1 *ngIf=\"step === 'login'\">Connexion</h1>\n          <h1 *ngIf=\"step === 'twofa'\">Verification 2FA</h1>\n          <h1 *ngIf=\"step === 'request-reset'\">Mot de passe oublie</h1>\n          <h1 *ngIf=\"step === 'confirm-reset'\">Nouveau mot de passe</h1>\n          <h1 *ngIf=\"step === 'request-setup'\">Activation compte protege</h1>\n          <h1 *ngIf=\"step === 'complete-setup'\">Finaliser activation</h1>\n        </div>\n\n        <form *ngIf=\"step === 'login'\" [formGroup]=\"loginForm\" (ngSubmit)=\"submitLogin()\" class=\"form\">\n          <label class=\"field\">\n            <span>Username ou email</span>\n            <input class=\"input\" type=\"text\" formControlName=\"identity\" autocomplete=\"username\" />\n          </label>\n\n          <label class=\"field\">\n            <span>Mot de passe</span>\n            <div class=\"password-wrap\">\n              <input\n                class=\"input\"\n                [type]=\"showPassword ? 'text' : 'password'\"\n                formControlName=\"password\"\n                autocomplete=\"current-password\"\n              />\n              <button type=\"button\" class=\"icon-btn\" (click)=\"togglePassword()\">\n                <span class=\"dot\" *ngIf=\"!showPassword\"></span>\n                <span class=\"dot open\" *ngIf=\"showPassword\"></span>\n              </button>\n            </div>\n          </label>\n\n          <div class=\"row\">\n            <label class=\"check\">\n              <input type=\"checkbox\" formControlName=\"remember\" />\n              <span>Rester connecte</span>\n            </label>\n            <button class=\"link-btn\" type=\"button\" (click)=\"openForgotPassword()\">Mot de passe oublie ?</button>\n          </div>\n\n          <button class=\"btn primary\" type=\"submit\" [disabled]=\"loading\">\n            <span *ngIf=\"!loading\">Se connecter</span>\n            <span *ngIf=\"loading\">Connexion...</span>\n          </button>\n\n          <button class=\"link-btn secondary\" type=\"button\" (click)=\"openProtectedSetup()\">\n            Activer un compte protege\n          </button>\n        </form>\n\n        <form *ngIf=\"step === 'twofa'\" [formGroup]=\"twofaForm\" (ngSubmit)=\"submitTwoFactor()\" class=\"form\">\n          <p class=\"help\">Code envoye a {{ maskedEmail || 'votre email' }}</p>\n          <label class=\"field\">\n            <span>Code a 6 chiffres</span>\n            <input class=\"input\" type=\"text\" maxlength=\"6\" formControlName=\"code\" />\n          </label>\n          <div class=\"row\">\n            <button class=\"btn primary\" type=\"submit\" [disabled]=\"loading\">Valider</button>\n            <button class=\"btn ghost\" type=\"button\" (click)=\"backToLogin()\">Retour</button>\n          </div>\n        </form>\n\n        <form *ngIf=\"step === 'request-reset' || step === 'request-setup'\" [formGroup]=\"requestForm\" class=\"form\"\n          (ngSubmit)=\"step === 'request-reset' ? submitRequestReset() : submitRequestSetup()\">\n          <label class=\"field\">\n            <span>Email autorise</span>\n            <input class=\"input\" type=\"email\" formControlName=\"email\" autocomplete=\"email\" />\n          </label>\n          <div class=\"row\">\n            <button class=\"btn primary\" type=\"submit\" [disabled]=\"loading\">Envoyer code</button>\n            <button class=\"btn ghost\" type=\"button\" (click)=\"backToLogin()\">Retour</button>\n          </div>\n        </form>\n\n        <form *ngIf=\"step === 'confirm-reset' || step === 'complete-setup'\" [formGroup]=\"actionForm\" class=\"form\"\n          (ngSubmit)=\"step === 'confirm-reset' ? submitConfirmReset() : submitCompleteSetup()\">\n          <p class=\"help\" *ngIf=\"maskedEmail\">Code envoye a {{ maskedEmail }}</p>\n          <label class=\"field\">\n            <span>Code</span>\n            <input class=\"input\" type=\"text\" maxlength=\"6\" formControlName=\"code\" />\n          </label>\n          <label class=\"field\">\n            <span>Nouveau mot de passe</span>\n            <input class=\"input\" [type]=\"showActionPassword ? 'text' : 'password'\" formControlName=\"newPassword\" />\n          </label>\n          <label class=\"field\">\n            <span>Confirmation mot de passe</span>\n            <input class=\"input\" [type]=\"showActionPassword ? 'text' : 'password'\" formControlName=\"confirmPassword\" />\n          </label>\n          <div class=\"row\">\n            <button class=\"btn primary\" type=\"submit\" [disabled]=\"loading\">Valider</button>\n            <button class=\"btn ghost\" type=\"button\" (click)=\"backToLogin()\">Retour</button>\n          </div>\n          <button class=\"link-btn secondary\" type=\"button\" (click)=\"toggleActionPassword()\">\n            {{ showActionPassword ? 'Masquer mot de passe' : 'Afficher mot de passe' }}\n          </button>\n        </form>\n\n        <div class=\"info\" *ngIf=\"info\">{{ info }}</div>\n        <div class=\"error\" *ngIf=\"error\">{{ error }}</div>\n      </div>\n    </section>\n  </div>\n</div>\n", styles: [":host { display: block; }\n\n/* page */\n.login-page{\n  position: fixed;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n\n  display: grid;\n  place-items: center;\n\n  overflow: hidden;\n  background: #05060a;\n  padding: 26px;\n\n  color: #e9ecf6;\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;\n}\n\n/* background */\n.bg { \n  position: absolute; \n  inset: 0; \n  z-index: 0; \n  overflow: hidden;\n}\n\n.grain{\n  position:absolute; inset:0;\n  opacity:.14;\n  background-image:\n    radial-gradient(circle at 1px 1px, rgba(255,255,255,.06) 1px, transparent 0);\n  background-size: 26px 26px;\n}\n\n.glow{\n  position:absolute;\n  filter: blur(120px);\n  opacity: .35;\n  border-radius: 999px;\n}\n.glow-1{ width: 720px; height: 520px; left:-220px; top:-200px; background:#1a4fff; }\n.glow-2{ width: 680px; height: 560px; right:-260px; bottom:-260px; background:#00a3ff; }\n\n/* layout */\n.shell{\n  width: 100%;\n  max-width: 1100px;\n  display: grid;\n  grid-template-columns: 1.05fr .95fr;\n  gap: 18px;\n  position: relative;\n  z-index: 2;\n}\n\n/* brand panel */\n.brand-panel{\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  border-radius: 22px;\n  padding: 26px;\n  border: 1px solid rgba(255,255,255,.08);\n  background: rgba(12,14,22,.55);\n  backdrop-filter: blur(10px);\n}\n\n.brand-top{\n  display:flex;\n  gap: 14px;\n  align-items:center;\n}\n\n.brand-logo{\n  width: 54px;\n  height: 54px;\n  object-fit: contain;\n  border-radius: 14px;\n  background: rgba(255,255,255,.06);\n  border: 1px solid rgba(255,255,255,.10);\n  padding: 8px;\n}\n\n.brand-name{\n  font-weight: 800;\n  letter-spacing: .2px;\n  font-size: 16px;\n}\n\n.brand-sub{\n  margin-top: 2px;\n  color: rgba(233,236,246,.72);\n  font-size: 12.5px;\n}\n\n.brand-quote{\n  margin: 22px 0;\n  padding: 18px 18px;\n  border-radius: 18px;\n  border: 1px solid rgba(255,255,255,.08);\n  background: rgba(6,8,14,.55);\n}\n\n.quote-mark{\n  font-size: 30px;\n  opacity: .6;\n  line-height: 1;\n  margin-bottom: 8px;\n}\n\n.brand-quote p{\n  margin: 0;\n  color: rgba(233,236,246,.82);\n  line-height: 1.55;\n  font-size: 14px;\n}\n\n.quote-footer{\n  display:flex;\n  align-items:center;\n  gap: 10px;\n  margin-top: 14px;\n  opacity: .9;\n}\n\n.avatar{\n  width: 38px;\n  height: 38px;\n  border-radius: 999px;\n  display:grid;\n  place-items:center;\n  font-weight: 900;\n  letter-spacing: .4px;\n  background: rgba(255,255,255,.08);\n  border: 1px solid rgba(255,255,255,.10);\n}\n\n.who{ font-weight: 700; font-size: 13px; }\n.meta{ color: rgba(233,236,246,.65); font-size: 12px; }\n\n.brand-bottom{\n  display:flex;\n  justify-content: space-between;\n  color: rgba(233,236,246,.55);\n  font-size: 11px;\n  text-transform: uppercase;\n  letter-spacing: .16em;\n}\n\n/* login panel */\n.login-panel{ display:grid; }\n\n.card{\n  border-radius: 22px;\n  padding: 26px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(10,12,18,.72);\n  backdrop-filter: blur(14px);\n  box-shadow: 0 30px 90px rgba(0,0,0,.55);\n  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;\n}\n\n@media (hover: hover) and (pointer: fine) {\n  .card:hover{\n    transform: translateY(-2px);\n    border-color: rgba(255,255,255,.16);\n    box-shadow: 0 40px 110px rgba(0,0,0,.62);\n  }\n}\n\n.card-head h1{\n  margin: 0;\n  font-size: 22px;\n  letter-spacing: .2px;\n}\n\n.card-head p{\n  margin: 6px 0 18px;\n  color: rgba(233,236,246,.68);\n  font-size: 13px;\n}\n\n.form{ display:grid; gap: 14px; }\n\n.field span{\n  display:block;\n  font-size: 12px;\n  color: rgba(233,236,246,.72);\n  margin: 0 0 7px 2px;\n}\n\n.input{\n  width: 100%;\n  padding: 12px 12px;\n  border-radius: 14px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(0,0,0,.28);\n  color: #fff;\n  outline: none;\n  transition: .18s ease;\n}\n\n.input::placeholder{ color: rgba(233,236,246,.35); }\n\n.input:focus{\n  border-color: rgba(43,108,255,.9);\n  box-shadow: 0 0 0 4px rgba(43,108,255,.16);\n}\n\n.hint{\n  display:block;\n  margin-top: 6px;\n  font-size: 12px;\n  color: rgba(233,236,246,.55);\n}\n\n/* password */\n.password-wrap{ position: relative; }\n\n.icon-btn{\n  position:absolute;\n  right: 10px;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 34px;\n  height: 34px;\n  border-radius: 10px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(255,255,255,.06);\n  cursor: pointer;\n}\n.icon-btn:hover{ border-color: rgba(43,108,255,.7); }\n\n.dot{\n  display:block;\n  width: 14px;\n  height: 14px;\n  border-radius: 999px;\n  margin: 0 auto;\n  background: rgba(233,236,246,.7);\n}\n.dot.open{\n  background: rgba(233,236,246,.25);\n  box-shadow: inset 0 0 0 2px rgba(233,236,246,.7);\n}\n\n.row{\n  display:flex;\n  align-items:center;\n  justify-content: space-between;\n  gap: 10px;\n  margin-top: 4px;\n}\n\n.check{\n  display:flex;\n  align-items:center;\n  gap: 8px;\n  font-size: 12px;\n  color: rgba(233,236,246,.75);\n}\n.check input{ accent-color: #2b6cff; }\n\n.help{\n  font-size: 12px;\n  color: rgba(233,236,246,.55);\n  text-align: right;\n}\n\n.info{\n  color: #8fe1ff;\n  background: rgba(71, 184, 255, .08);\n  border: 1px solid rgba(71, 184, 255, .22);\n  padding: 10px 12px;\n  border-radius: 14px;\n  font-size: 13px;\n}\n\n.error{\n  color: #ff6b6b;\n  background: rgba(255, 107, 107, .08);\n  border: 1px solid rgba(255, 107, 107, .18);\n  padding: 10px 12px;\n  border-radius: 14px;\n  font-size: 13px;\n}\n\n/* button */\n.btn{\n  width: 100%;\n  border-radius: 14px;\n  padding: 12px 14px;\n  font-weight: 800;\n  letter-spacing: .2px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(255,255,255,.06);\n  color: #fff;\n  cursor: pointer;\n  transition: transform .18s ease, filter .18s ease, opacity .18s ease;\n}\n\n.btn.primary{\n  background: linear-gradient(135deg, #2b6cff, #00a3ff);\n  border-color: rgba(43,108,255,.65);\n  box-shadow: 0 18px 50px rgba(0, 115, 255, .20);\n  position: relative;\n  overflow: hidden;\n}\n\n.btn:disabled{\n  opacity: .65;\n  cursor: not-allowed;\n}\n\n.link-btn{\n  border: none;\n  background: transparent;\n  color: #86b8ff;\n  font-size: 12px;\n  cursor: pointer;\n  padding: 0;\n  text-decoration: underline;\n}\n\n.link-btn.secondary{\n  justify-self: center;\n  margin-top: 2px;\n}\n\n.btn.primary:hover{\n  filter: brightness(1.02);\n  transform: translateY(-1px);\n}\n\n.btn.primary:active{\n  transform: translateY(0);\n  filter: brightness(.98);\n}\n\n/* Shine subtil */\n@media (prefers-reduced-motion: no-preference) {\n  .btn.primary::after {\n    content: \"\";\n    position: absolute;\n    inset: -40% -60%;\n    background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);\n    transform: translateX(-40%);\n    animation: btnShine 3.6s ease-in-out 1.2s infinite;\n    pointer-events: none;\n  }\n}\n\n@keyframes btnShine {\n  0%, 70%   { transform: translateX(-40%); opacity: 0; }\n  75%       { opacity: 1; }\n  100%      { transform: translateX(40%); opacity: 0; }\n}\n\n/* test accounts */\n.test-accounts{\n  margin-top: 12px;\n  padding-top: 12px;\n  border-top: 1px solid rgba(255,255,255,.08);\n}\n\n.ta-title{\n  font-size: 11px;\n  text-transform: uppercase;\n  letter-spacing: .16em;\n  color: rgba(233,236,246,.55);\n  margin-bottom: 10px;\n}\n\n.ta-grid{\n  display:grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}\n\n.ta{\n  border-radius: 14px;\n  padding: 10px 12px;\n  border: 1px solid rgba(255,255,255,.08);\n  background: rgba(0,0,0,.20);\n}\n\n.ta-role{\n  font-weight: 800;\n  font-size: 12px;\n  margin-bottom: 2px;\n}\n\n.ta-cred{\n  font-size: 12px;\n  color: rgba(233,236,246,.72);\n}\n\n.footnote{\n  margin-top: 8px;\n  font-size: 12px;\n  color: rgba(233,236,246,.60);\n  text-align: center;\n}\n\n/* responsive */\n@media (max-width: 980px){\n  .shell{ grid-template-columns: 1fr; }\n  .brand-panel{ display:none; }\n}\n\n/* ===================== */\n/* Premium animations     */\n/* ===================== */\n@media (prefers-reduced-motion: no-preference) {\n  .shell {\n    animation: shellIn 520ms cubic-bezier(.2,.9,.2,1) both;\n  }\n\n  .brand-panel {\n    animation: fadeSlide 520ms cubic-bezier(.2,.9,.2,1) 80ms both;\n  }\n\n  .login-panel {\n    animation: fadeSlide 520ms cubic-bezier(.2,.9,.2,1) 140ms both;\n  }\n\n  .card {\n    animation: cardFloat 6s ease-in-out 700ms infinite;\n  }\n\n  .glow-1 { animation: glowPulse1 7.5s ease-in-out infinite; }\n  .glow-2 { animation: glowPulse2 8.5s ease-in-out infinite; }\n}\n\n@keyframes shellIn {\n  from { opacity: 0; transform: translateY(10px) scale(.995); }\n  to   { opacity: 1; transform: translateY(0) scale(1); }\n}\n\n@keyframes fadeSlide {\n  from { opacity: 0; transform: translateY(10px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n\n@keyframes cardFloat {\n  0%, 100% { transform: translateY(0); }\n  50%      { transform: translateY(-3px); }\n}\n\n@keyframes glowPulse1 {\n  0%, 100% { transform: translate(0,0) scale(1); opacity: .32; }\n  50%      { transform: translate(18px,12px) scale(1.05); opacity: .40; }\n}\n\n@keyframes glowPulse2 {\n  0%, 100% { transform: translate(0,0) scale(1); opacity: .30; }\n  50%      { transform: translate(-16px,-10px) scale(1.06); opacity: .38; }\n}\n"] }]
    }], () => [{ type: i1.FormBuilder }, { type: i2.AuthService }, { type: i3.Router }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(LoginComponent, { className: "LoginComponent", filePath: "src/app/components/login/login.component.ts", lineNumber: 22 }); })();
