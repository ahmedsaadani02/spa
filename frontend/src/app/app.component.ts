import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();
  private readonly firstRouteSeen = new Set<string>();

  dropdownOpen = false;

  async ngOnInit(): Promise<void> {
    await this.auth.ensureInitialized();
    this.logRouteEntry(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.logRouteEntry(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isLoginRoute(): boolean {
    return this.router.url.startsWith('/login');
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get role(): 'developer' | 'owner' | 'admin' | 'employee' | null {
    return this.auth.role();
  }

  get isEmployee(): boolean {
    return this.role === 'employee';
  }

  get username(): string | null {
    return this.auth.username();
  }

  get displayName(): string | null {
    return this.auth.displayName();
  }

  get canViewStock(): boolean {
    return this.auth.hasPermission('viewStock');
  }

  get canManageStock(): boolean {
    return this.auth.hasPermission('manageStock');
  }

  get canAddStock(): boolean {
    return this.auth.hasPermission('addStock');
  }

  get canRemoveStock(): boolean {
    return this.auth.hasPermission('removeStock');
  }

  get canAdjustStock(): boolean {
    return this.auth.hasPermission('adjustStock');
  }

  get canManageInvoices(): boolean {
    return this.auth.hasPermission('manageInvoices');
  }

  get canManageQuotes(): boolean {
    return this.auth.hasPermission('manageQuotes');
  }

  get canManageClients(): boolean {
    return this.auth.hasPermission('manageClients');
  }

  get canManageEstimations(): boolean {
    return this.auth.hasPermission('manageEstimations');
  }

  get canManageEmployees(): boolean {
    return this.auth.hasPermission('manageEmployees');
  }

  get canManageSalary(): boolean {
    return this.auth.hasPermission('manageSalary');
  }

  get canManageArchives(): boolean {
    return this.auth.hasPermission('manageArchives');
  }

  get canManageInventory(): boolean {
    return this.auth.hasPermission('manageInventory');
  }

  get canViewHistory(): boolean {
    return this.auth.hasPermission('viewHistory');
  }

  get canOpenEmployees(): boolean {
    return !this.isEmployee && (this.canManageEmployees || this.canManageSalary);
  }

  get canOpenInventoryModules(): boolean {
    return this.canManageInventory || this.canViewHistory;
  }

  get canOpenStockArchives(): boolean {
    return this.canManageArchives;
  }

  get canOpenSettings(): boolean {
    return this.canManageEmployees && !this.isEmployee;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.dropdownOpen = false;
    }
  }

  async logout(): Promise<void> {
    this.dropdownOpen = false;
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  openSettings(): void {
    if (!this.canOpenSettings) {
      return;
    }
    this.dropdownOpen = false;
    void this.router.navigateByUrl('/settings');
  }

  private logRouteEntry(url: string): void {
    const pageName = this.resolvePageName(url);
    if (!pageName) return;
    console.log(`[${pageName}] route entered`);
    if (!this.firstRouteSeen.has(pageName)) {
      this.firstRouteSeen.add(pageName);
      console.log(`[${pageName}] first navigation detected`);
    }
  }

  private resolvePageName(url: string): string | null {
    if (url.startsWith('/invoices')) return 'invoices-page';
    if (url.startsWith('/quotes')) return 'quotes-page';
    if (url.startsWith('/clients')) return 'clients-page';
    if (url.startsWith('/stock/archives')) return 'stock-archives-page';
    if (url.startsWith('/stock/history') || url.startsWith('/stock-history')) return 'stock-history-page';
    if (url.startsWith('/stock')) return 'stock-page';
    if (url.startsWith('/inventaire')) return 'inventaire-page';
    if (url.startsWith('/estimation')) return 'estimation-page';
    if (url.startsWith('/employees')) return 'employees-page';
    return null;
  }
}
