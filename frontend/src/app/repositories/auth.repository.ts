import { Injectable } from '@angular/core';
import { hasSpaApi, isElectronRuntime } from '../bridge/spa-bridge';
import {
  AppUser,
  AuthBeginLoginResult,
  AuthPasswordActionResult,
  PermissionSet,
  UserRole
} from '../models/auth.models';
import { IpcService } from '../services/ipc.service';

type WebAuthUserRecord = {
  id: string;
  nom: string;
  username: string;
  email: string | null;
  emailNormalized: string | null;
  role: UserRole;
  isActive: boolean;
  isProtectedAccount: boolean;
  mustSetupPassword: boolean;
  passwordHash: string | null;
  permissions: PermissionSet;
};

const WEB_USERS_KEY = 'spa:web-auth-users:v1';
const WEB_SESSION_KEY = 'spa:web-auth-session:v1';
const WEB_PROTECTED_ACCOUNTS = [
  { id: 'protected-developer', nom: 'Developpeur', email: 'ahmedsaadani02@gmail.com', username: 'developer', role: 'developer' as const },
  { id: 'protected-owner', nom: 'Chef Entreprise', email: 'saadani.karim@planet.tn', username: 'owner', role: 'owner' as const }
];

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
  manageAll: false
};

let webUsersMemoryCache: WebAuthUserRecord[] | null = null;
let webSessionMemoryCache: AppUser | null = null;

@Injectable({
  providedIn: 'root'
})
export class AuthRepository {
  constructor(private ipc: IpcService) {}

  private get userAgent(): string | null {
    return typeof navigator === 'undefined' ? null : navigator.userAgent;
  }

  private get useIpcAuth(): boolean {
    return hasSpaApi() || isElectronRuntime();
  }

  private get canUseBrowserStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private normalizeIdentity(value: string): string {
    return (value || '').trim().toLowerCase();
  }

  private normalizeEmail(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase();
  }

  private passwordPolicyOk(password: string): boolean {
    return typeof password === 'string'
      && password.length >= 10
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && /[^A-Za-z0-9]/.test(password);
  }

  private rolePermissions(role: UserRole): PermissionSet {
    if (role === 'admin' || role === 'developer' || role === 'owner') {
      return {
        viewStock: true,
        addStock: true,
        removeStock: true,
        adjustStock: true,
        manageStock: true,
        editStockProduct: true,
        archiveStockProduct: true,
        manageEmployees: true,
        manageInvoices: true,
        manageQuotes: true,
        manageClients: true,
        manageEstimations: true,
        manageArchives: true,
        manageInventory: true,
        viewHistory: true,
        manageSalary: true,
        manageAll: true
      };
    }
    return { ...EMPTY_PERMISSIONS };
  }

  private toAppUser(record: WebAuthUserRecord): AppUser {
    return {
      id: record.id,
      nom: record.nom,
      username: record.username,
      email: record.email,
      role: record.role,
      isActive: record.isActive,
      isProtectedAccount: record.isProtectedAccount,
      requiresEmail2fa: false,
      mustSetupPassword: record.mustSetupPassword,
      permissions: record.permissions
    };
  }

  private defaultWebUsers(): WebAuthUserRecord[] {
    const nowProtected = WEB_PROTECTED_ACCOUNTS.map((account) => ({
      id: account.id,
      nom: account.nom,
      username: account.username,
      email: account.email,
      emailNormalized: this.normalizeEmail(account.email),
      role: account.role,
      isActive: true,
      isProtectedAccount: true,
      mustSetupPassword: true,
      passwordHash: null,
      permissions: this.rolePermissions(account.role)
    }));
    return nowProtected;
  }

  private readWebUsers(): WebAuthUserRecord[] {
    if (webUsersMemoryCache) {
      return [...webUsersMemoryCache];
    }

    if (!this.canUseBrowserStorage) {
      webUsersMemoryCache = this.defaultWebUsers();
      return [...webUsersMemoryCache];
    }

    try {
      const raw = window.localStorage.getItem(WEB_USERS_KEY);
      if (!raw) {
        webUsersMemoryCache = this.defaultWebUsers();
        this.writeWebUsers(webUsersMemoryCache);
        return [...webUsersMemoryCache];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        webUsersMemoryCache = this.defaultWebUsers();
        this.writeWebUsers(webUsersMemoryCache);
        return [...webUsersMemoryCache];
      }
      webUsersMemoryCache = parsed as WebAuthUserRecord[];
      return [...webUsersMemoryCache];
    } catch {
      webUsersMemoryCache = this.defaultWebUsers();
      this.writeWebUsers(webUsersMemoryCache);
      return [...webUsersMemoryCache];
    }
  }

  private writeWebUsers(users: WebAuthUserRecord[]): void {
    webUsersMemoryCache = [...users];
    if (!this.canUseBrowserStorage) return;
    try {
      window.localStorage.setItem(WEB_USERS_KEY, JSON.stringify(users));
    } catch {
      // Ignore storage write failures in browser fallback.
    }
  }

  private readWebSession(): AppUser | null {
    if (webSessionMemoryCache) {
      return webSessionMemoryCache;
    }
    if (!this.canUseBrowserStorage) {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(WEB_SESSION_KEY);
      if (!raw) return null;
      webSessionMemoryCache = JSON.parse(raw) as AppUser;
      return webSessionMemoryCache;
    } catch {
      return null;
    }
  }

  private writeWebSession(user: AppUser | null): void {
    webSessionMemoryCache = user;
    if (!this.canUseBrowserStorage) return;
    try {
      if (!user) {
        window.localStorage.removeItem(WEB_SESSION_KEY);
      } else {
        window.localStorage.setItem(WEB_SESSION_KEY, JSON.stringify(user));
      }
    } catch {
      // Ignore storage write failures in browser fallback.
    }
  }

  private async sha256(value: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(value);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return `plain:${value}`;
  }

  private async verifyPassword(password: string, hash: string | null): Promise<boolean> {
    if (!hash || !password) return false;
    if (hash.startsWith('plain:')) {
      return hash.slice(6) === password;
    }
    return (await this.sha256(password)) === hash;
  }

  private async hashPassword(password: string): Promise<string> {
    return this.sha256(password);
  }

  async login(username: string, password: string): Promise<AppUser | null> {
    if (this.useIpcAuth) {
      return this.ipc.authLogin(username, password);
    }
    const result = await this.beginLogin(username, password);
    return result.status === 'success' ? result.user ?? null : null;
  }

  async beginLogin(identity: string, password: string): Promise<AuthBeginLoginResult> {
    if (this.useIpcAuth) {
    return this.ipc.authBeginLogin(identity, password, { userAgent: this.userAgent });
    }

    const normalizedIdentity = this.normalizeIdentity(identity);
    if (!normalizedIdentity || !password) {
      return { status: 'invalid_credentials' };
    }

    const users = this.readWebUsers();
    const user = users.find((u) => {
      const byUsername = u.username.toLowerCase() === normalizedIdentity;
      const byEmail = !!u.emailNormalized && u.emailNormalized === normalizedIdentity;
      return byUsername || byEmail;
    });

    if (!user || !user.isActive) {
      return { status: 'invalid_credentials' };
    }

    const usingEmail = normalizedIdentity.includes('@');
    if (usingEmail && !user.isProtectedAccount) {
      return { status: 'invalid_credentials' };
    }

    if (user.mustSetupPassword || !user.passwordHash) {
      if (user.isProtectedAccount) {
        return { status: 'must_setup_password', maskedEmail: user.email ?? '***' };
      }
      return { status: 'invalid_credentials' };
    }

    const passwordOk = await this.verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return { status: 'invalid_credentials' };
    }

    const appUser = this.toAppUser(user);
    this.writeWebSession(appUser);
    return { status: 'success', user: appUser };
  }

  async setupProtectedPassword(email: string, newPassword: string): Promise<AuthPasswordActionResult> {
    if (this.useIpcAuth) {
    return this.ipc.authSetupProtectedPassword(email, newPassword, { userAgent: this.userAgent });
    }

    const normalizedEmail = this.normalizeEmail(email);
    const isProtectedEmail = WEB_PROTECTED_ACCOUNTS.some((a) => a.email === normalizedEmail);
    if (!normalizedEmail || !isProtectedEmail) {
      return { ok: false, status: 'forbidden', message: 'Email non autorise.' };
    }

    if (!this.passwordPolicyOk(newPassword)) {
      return {
        ok: false,
        status: 'weak_password',
        message: 'Mot de passe invalide: minimum 10 caracteres avec 1 majuscule, 1 minuscule, 1 chiffre et 1 caractere special.'
      };
    }

    const users = this.readWebUsers();
    const index = users.findIndex((u) => u.emailNormalized === normalizedEmail && u.isProtectedAccount);
    if (index === -1) {
      return { ok: false, status: 'invalid_credentials', message: 'Compte protege introuvable.' };
    }

    const target = users[index];
    if (!target.mustSetupPassword && target.passwordHash) {
      return { ok: false, status: 'already_configured', message: 'Ce compte a deja ete initialise.' };
    }

    users[index] = {
      ...target,
      mustSetupPassword: false,
      passwordHash: await this.hashPassword(newPassword)
    };
    this.writeWebUsers(users);
    return { ok: true, status: 'completed' };
  }

  async logout(): Promise<boolean> {
    if (!this.useIpcAuth) {
      this.writeWebSession(null);
      return true;
    }
    return this.ipc.authLogout();
  }

  async getCurrentUser(): Promise<AppUser | null> {
    if (!this.useIpcAuth) {
      return this.readWebSession();
    }
    return this.ipc.authGetCurrentUser();
  }

  async hasPermission(permission: keyof PermissionSet): Promise<boolean> {
    if (!this.useIpcAuth) {
      const user = this.readWebSession();
      if (!user || !user.isActive) return false;
      if (user.role === 'admin' || user.role === 'developer' || user.role === 'owner') return true;
      return !!user.permissions?.[permission];
    }
    return this.ipc.authHasPermission(permission);
  }

  async resetPassword(employeeId: string, newPassword: string): Promise<boolean> {
    if (!this.useIpcAuth) {
      if (!this.passwordPolicyOk(newPassword)) return false;
      const session = this.readWebSession();
      if (!session || !['admin', 'developer', 'owner'].includes(session.role)) return false;

      const users = this.readWebUsers();
      const index = users.findIndex((u) => u.id === employeeId);
      if (index === -1 || users[index].isProtectedAccount) return false;
      users[index] = {
        ...users[index],
        passwordHash: await this.hashPassword(newPassword),
        mustSetupPassword: false
      };
      this.writeWebUsers(users);
      return true;
    }
    return this.ipc.authResetPassword(employeeId, newPassword);
  }
}
