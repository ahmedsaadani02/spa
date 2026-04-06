import { Injectable } from '@angular/core';
import {
  AppUser,
  AuthBeginLoginResult,
  AuthPasswordActionResult,
  PermissionSet
} from '../models/auth.models';
import { AppApiService } from '../services/app-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthRepository {
  private currentUserRequest: Promise<AppUser | null> | null = null;
  private cachedCurrentUser: AppUser | null | undefined = undefined;

  constructor(private ipc: AppApiService) {}

  private get userAgent(): string | null {
    return typeof navigator === 'undefined' ? null : navigator.userAgent;
  }

  async login(username: string, password: string): Promise<AppUser | null> {
    const user = await this.ipc.authLogin(username, password);
    this.cachedCurrentUser = user;
    return user;
  }

  async beginLogin(identity: string, password: string): Promise<AuthBeginLoginResult> {
    const result = await this.ipc.authBeginLogin(identity, password, { userAgent: this.userAgent });
    if (result.status === 'success') {
      this.cachedCurrentUser = result.user ?? null;
    }
    return result;
  }

  async setupProtectedPassword(email: string, newPassword: string): Promise<AuthPasswordActionResult> {
    return this.ipc.authSetupProtectedPassword(email, newPassword, { userAgent: this.userAgent });
  }

  async logout(): Promise<boolean> {
    this.cachedCurrentUser = null;
    return this.ipc.authLogout();
  }

  async getCurrentUser(force = false): Promise<AppUser | null> {
    if (!force && this.cachedCurrentUser !== undefined) {
      return this.cachedCurrentUser;
    }
    if (!force && this.currentUserRequest) {
      return this.currentUserRequest;
    }

    this.currentUserRequest = this.ipc.authGetCurrentUser()
      .then((user) => {
        this.cachedCurrentUser = user;
        return user;
      })
      .finally(() => {
        this.currentUserRequest = null;
      });

    return this.currentUserRequest;
  }

  async hasPermission(permission: keyof PermissionSet): Promise<boolean> {
    return this.ipc.authHasPermission(permission);
  }

  async resetPassword(employeeId: string, newPassword: string): Promise<boolean> {
    return this.ipc.authResetPassword(employeeId, newPassword);
  }
}
