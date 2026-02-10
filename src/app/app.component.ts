import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  get isLoginRoute(): boolean {
    return this.router.url.startsWith('/login');
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get role(): 'admin' | 'employee' | null {
    return this.auth.role();
  }

  get username(): string | null {
    return this.auth.username();
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isEmployee(): boolean {
    return this.role === 'employee';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
