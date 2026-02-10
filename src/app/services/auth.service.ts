import { Injectable } from '@angular/core';

type UserRole = 'admin' | 'employee';

interface AuthSession {
  token: string;
  username: string;
  role: UserRole;
}

const STORAGE_KEY = 'spa_auth_session_v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Simple auth without backend.
   * Stores a minimal session in localStorage (NOT secure).
   */
  login(username: string, password: string): boolean {
    const normalized = (username || '').trim();

    if (normalized === 'admin' && password === 'admin123') {
      this.writeSession({ token: 'ok', username: 'admin', role: 'admin' });
      return true;
    }

    if (normalized === 'employee' && password === 'emp123') {
      this.writeSession({ token: 'ok', username: 'employee', role: 'employee' });
      return true;
    }

    return false;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    const session = this.readSession();
    return !!session?.token && !!session?.role;
  }

  role(): UserRole | null {
    return this.readSession()?.role ?? null;
  }

  username(): string | null {
    return this.readSession()?.username ?? null;
  }

  private readSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  private writeSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}
