import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  showPassword = false;

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    remember: [true]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submit(): Promise<void> {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    try {
      const { username, password, remember } = this.form.getRawValue();

const ok = this.auth.login(username!, password!);
      if (!ok) {
        this.error = "Nom d’utilisateur ou mot de passe incorrect.";
        return;
      }

      const role = this.auth.role();
      if (role === 'employee') {
        await this.router.navigate(['/stock']);
      } else {
        await this.router.navigate(['/invoices']);
      }
    } finally {
      this.loading = false;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
