import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type LoginStep = 'login' | 'setup-protected';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loading = false;
  error = '';
  info = '';
  showPassword = false;
  showSetupPassword = false;

  step: LoginStep = 'login';
  maskedEmail = '';

  loginForm = this.fb.group({
    identity: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  setupForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    newPassword: ['', [Validators.required, Validators.minLength(10)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submitLogin(): Promise<void> {
    this.resetMessages();
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    try {
      const { identity, password } = this.loginForm.getRawValue();
      console.log('[web-login] submit payload', {
        identity: (identity ?? '').toString().trim(),
        identityType: (identity ?? '').toString().includes('@') ? 'email' : 'username'
      });
      const result = await this.auth.beginLogin(identity ?? '', password ?? '');
      console.log('[web-login] raw response', result);

      if (result.status === 'success') {
        await this.router.navigateByUrl(this.auth.getDefaultRoute());
        return;
      }

      if (result.status === 'must_setup_password') {
        const identityValue = String(identity ?? '').trim();
        this.step = 'setup-protected';
        this.maskedEmail = result.maskedEmail ?? '';
        this.setupForm.reset({
          email: identityValue.includes('@') ? identityValue : '',
          newPassword: '',
          confirmPassword: ''
        });
        this.info = 'Compte protege detecte: definissez votre mot de passe initial.';
        return;
      }

      if (result.status === 'blocked_temporarily') {
        this.error = `Trop de tentatives. Reessayez dans ${result.retryAfterSeconds ?? 60}s.`;
        console.warn('[web-login] displayed error', this.error);
        return;
      }

      if (result.status === 'operation_failed') {
        this.error = result.message || 'Erreur d\'authentification. Verifiez que le backend web est demarre.';
        console.warn('[web-login] displayed error', this.error);
        return;
      }

      this.error = 'Identifiants invalides.';
      console.warn('[web-login] displayed error', this.error);
    } finally {
      this.loading = false;
    }
  }

  async submitSetupProtectedPassword(): Promise<void> {
    this.resetMessages();
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }

    const { email, newPassword, confirmPassword } = this.setupForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error = 'Confirmation mot de passe differente.';
      return;
    }

    this.loading = true;
    try {
      const result = await this.auth.setupProtectedPassword(email ?? '', newPassword ?? '');
      if (result.ok && result.status === 'completed') {
        this.info = 'Mot de passe cree. Vous pouvez maintenant vous connecter.';
        this.backToLogin(email ?? '');
        return;
      }

      if (result.status === 'blocked_temporarily') {
        this.error = `Operation temporairement bloquee (${result.retryAfterSeconds ?? 60}s).`;
        return;
      }

      this.error = result.message ?? this.statusToMessage(result.status);
    } finally {
      this.loading = false;
    }
  }

  openProtectedSetup(): void {
    this.resetMessages();
    this.step = 'setup-protected';
    this.maskedEmail = '';
    this.setupForm.reset({ email: '', newPassword: '', confirmPassword: '' });
  }

  backToLogin(prefillIdentity = ''): void {
    this.step = 'login';
    this.maskedEmail = '';
    this.setupForm.reset({ email: '', newPassword: '', confirmPassword: '' });
    if (prefillIdentity.trim()) {
      this.loginForm.patchValue({ identity: prefillIdentity.trim(), password: '' });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleSetupPassword(): void {
    this.showSetupPassword = !this.showSetupPassword;
  }

  private statusToMessage(status: string): string {
    if (status === 'weak_password') return 'Mot de passe trop faible.';
    if (status === 'forbidden') return 'Email non autorise pour creation initiale.';
    if (status === 'already_configured') return 'Mot de passe deja configure.';
    if (status === 'invalid_credentials') return 'Operation non autorisee.';
    if (status === 'blocked_temporarily') return 'Operation temporairement bloquee.';
    return 'Operation impossible.';
  }

  private resetMessages(): void {
    this.error = '';
    this.info = '';
  }
}
