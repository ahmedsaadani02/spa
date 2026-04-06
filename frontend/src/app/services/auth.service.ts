import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  AppUser,
  AuthBeginLoginResult,
  AuthPasswordActionResult,
  PermissionSet,
  UserRole
} from '../models/auth.models';
import { AuthRepository } from '../repositories/auth.repository';

const EMPTY_PERMISSIONS: PermissionSet = {
  viewStock: false,
  addStock: false,
  removeStock: false,
  adjustStock: false,
  manageStock: false,
  editStockProduct: false,
  archiveStockProduct: false,
  manageEmployees: false,
  manageInvoices: false,
  manageQuotes: false,
  manageClients: false,
  manageEstimations: false,
  manageArchives: false,
  manageInventory: false,
  viewHistory: false,
  manageSalary: false,
  manageTasks: false,
  receiveTasks: false,
  manageAll: false
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(private authRepository: AuthRepository) {}

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const user = await this.authRepository.getCurrentUser();
      this.currentUserSubject.next(user);
      this.initialized = true;
    })().finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  async login(username: string, password: string): Promise<boolean> {
    const user = await this.authRepository.login(username, password);
    this.currentUserSubject.next(user);
    return !!user;
  }

  async beginLogin(identity: string, password: string): Promise<AuthBeginLoginResult> {
    const result = await this.authRepository.beginLogin(identity, password);
    if (result.status === 'success' && result.user) {
      this.currentUserSubject.next(result.user);
    }
    return result;
  }

  setupProtectedPassword(email: string, newPassword: string): Promise<AuthPasswordActionResult> {
    return this.authRepository.setupProtectedPassword(email, newPassword);
  }

  async logout(): Promise<void> {
    await this.authRepository.logout();
    this.currentUserSubject.next(null);
  }

  async refreshCurrentUser(): Promise<AppUser | null> {
    const user = await this.authRepository.getCurrentUser(true);
    this.currentUserSubject.next(user);
    return user;
  }

  async resetPassword(employeeId: string, newPassword: string): Promise<boolean> {
    return this.authRepository.resetPassword(employeeId, newPassword);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  currentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  role(): UserRole | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  username(): string | null {
    return this.currentUserSubject.value?.username ?? null;
  }

  displayName(): string | null {
    return this.currentUserSubject.value?.nom ?? null;
  }

  permissions(): PermissionSet {
    return this.currentUserSubject.value?.permissions ?? EMPTY_PERMISSIONS;
  }

  hasPermission(permission: keyof PermissionSet): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'developer' || user.role === 'owner') return true;
    return !!user.permissions[permission];
  }

  getDefaultRoute(): string {
    if (!this.isLoggedIn()) return '/login';
    return '/dashboard';
  }
}
