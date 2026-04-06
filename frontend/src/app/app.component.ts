import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
  RouterModule
} from '@angular/router';
import { EmployeesRepository } from './repositories/employees.repository';
import { TasksRepository } from './repositories/tasks.repository';
import { AuthService } from './services/auth.service';
import { ClientStoreService } from './services/client-store.service';
import { InvoiceStoreService } from './services/invoice-store.service';
import { QuoteStoreService } from './services/quote-store.service';
import { StockStoreService } from './services/stock-store.service';
import { Subject, takeUntil } from 'rxjs';
import { TaskNotificationRecord } from './models/task.models';
import { SHELL_I18N } from './i18n/ui-i18n';
import { LanguageService } from './services/language.service';
import { TaskNotificationsService, TaskToast } from './services/task-notifications.service';

interface NavItem {
  label: string;
  route: string;
  visible: boolean;
  exact?: boolean;
}

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
  private cdr = inject(ChangeDetectorRef);
  private stockStore = inject(StockStoreService);
  private tasksRepository = inject(TasksRepository);
  private employeesRepository = inject(EmployeesRepository);
  private invoiceStore = inject(InvoiceStoreService);
  private quoteStore = inject(QuoteStoreService);
  private clientStore = inject(ClientStoreService);
  private language = inject(LanguageService);
  private taskNotifications = inject(TaskNotificationsService);
  private readonly destroy$ = new Subject<void>();
  private readonly firstRouteSeen = new Set<string>();
  private readonly preloadedScreens = new Set<string>();
  private pendingNavigationSignals = 0;

  dropdownOpen = false;
  notificationsOpen = false;
  navigationLoading = false;
  liveNotifications: TaskNotificationRecord[] = [];
  liveNotificationToasts: TaskToast[] = [];
  liveUnreadNotificationsCount = 0;

  async ngOnInit(): Promise<void> {
    await this.auth.ensureInitialized();
    await this.taskNotifications.ensureStarted();
    this.logRouteEntry(this.router.url);
    this.preloadAuthorizedScreens();

    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (user) {
          this.preloadAuthorizedScreens();
        }
      });

    this.taskNotifications.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.liveNotifications = notifications;
        this.liveUnreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;
        this.cdr.detectChanges();
      });

    this.taskNotifications.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe((toasts) => {
        this.liveNotificationToasts = toasts;
        this.cdr.detectChanges();
      });

    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event instanceof NavigationStart || event instanceof RouteConfigLoadStart) {
          this.setNavigationLoading(true);
        }

        if (event instanceof NavigationEnd) {
          this.logRouteEntry(event.urlAfterRedirects);
          this.setNavigationLoading(false);
          return;
        }

        if (event instanceof NavigationCancel || event instanceof NavigationError || event instanceof RouteConfigLoadEnd) {
          this.setNavigationLoading(false);
        }
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

  get shellText() {
    return SHELL_I18N[this.language.currentLanguage];
  }

  get currentLanguage(): 'fr' | 'ar' {
    return this.language.currentLanguage;
  }

  get isRtl(): boolean {
    return this.language.isArabic;
  }

  get role(): 'developer' | 'owner' | 'admin' | 'employee' | null {
    return this.auth.role();
  }

  get isEmployee(): boolean {
    return this.role === 'employee';
  }

  get isBackOfficeProfile(): boolean {
    return this.role !== 'employee'
      || this.canManageTasksPermission
      || this.canManageInvoices
      || this.canManageQuotes
      || this.canManageClients
      || this.canManageEstimations
      || this.canManageEmployees
      || this.canManageSalary
      || this.canManageArchives;
  }

  get isStandardEmployeeNavigation(): boolean {
    return this.role === 'employee' && !this.isBackOfficeProfile;
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

  get canManageTasksPermission(): boolean {
    return this.auth.hasPermission('manageTasks');
  }

  get canReceiveTasksPermission(): boolean {
    return this.auth.hasPermission('receiveTasks');
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

  get canOpenTasks(): boolean {
    return this.canManageTasksPermission;
  }

  get canOpenMyTasks(): boolean {
    return this.canReceiveTasksPermission && !this.canManageTasksPermission;
  }

  get canOpenInventory(): boolean {
    return this.canManageInventory;
  }

  get canOpenHistory(): boolean {
    return this.canViewHistory;
  }

  get historyNavLabel(): string {
    return this.language.isArabic ? 'Ø§Ù„Ø³Ø¬Ù„' : 'Historique';
  }

  get canOpenStockArchives(): boolean {
    return this.canManageArchives;
  }

  get canOpenSettings(): boolean {
    return this.canManageEmployees && !this.isEmployee;
  }

  get navItems(): NavItem[] {
    const items = this.isStandardEmployeeNavigation ? this.employeeNavItems : this.adminNavItems;
    return items.filter((item) => item.visible);
  }

  get notifications(): TaskNotificationRecord[] {
    return this.liveNotifications;
  }

  get notificationToasts(): TaskToast[] {
    return this.liveNotificationToasts;
  }

  get unreadNotificationsCount(): number {
    return this.liveUnreadNotificationsCount;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.notificationsOpen = false;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.dropdownOpen = false;
    }
  }

  setLanguage(language: 'fr' | 'ar'): void {
    this.language.setLanguage(language);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.dropdownOpen = false;
    }
    if (!target.closest('.notifications-menu')) {
      this.notificationsOpen = false;
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

  openAccount(): void {
    this.dropdownOpen = false;
    void this.router.navigateByUrl('/account');
  }

  openHistory(): void {
    if (!this.canOpenHistory) {
      return;
    }
    this.dropdownOpen = false;
    void this.router.navigateByUrl('/movements');
  }

  async markNotificationRead(notification: TaskNotificationRecord): Promise<void> {
    await this.taskNotifications.markRead(notification.id);
  }

  dismissToast(id: string): void {
    this.taskNotifications.dismissToast(id);
  }

  notificationTitle(notification: TaskNotificationRecord): string {
    return this.taskNotifications.notificationTitle(notification);
  }

  notificationMessage(notification: TaskNotificationRecord): string {
    return this.taskNotifications.notificationMessage(notification);
  }

  notificationTaskLabel(notification: TaskNotificationRecord): string {
    return this.taskNotifications.taskLabel(notification);
  }

  trackByNavRoute = (_index: number, item: NavItem): string => item.route;

  private get adminNavItems(): NavItem[] {
    return [
      { label: this.shellText.nav.dashboard, route: '/dashboard', visible: this.isLoggedIn, exact: true },
      { label: this.shellText.nav.tasks, route: '/tasks', visible: this.canOpenTasks },
      { label: this.shellText.nav.invoices, route: '/invoices', visible: this.canManageInvoices },
      { label: this.shellText.nav.quotes, route: '/quotes', visible: this.canManageQuotes },
      { label: this.shellText.nav.clients, route: '/clients', visible: this.canManageClients },
      { label: this.shellText.nav.stock, route: '/stock', visible: this.canViewStock, exact: true },
      { label: this.shellText.nav.inventory, route: '/inventaire', visible: this.canOpenInventory },
      { label: this.shellText.nav.employees, route: '/employees', visible: this.canOpenEmployees },
      { label: this.shellText.nav.archives, route: '/archives', visible: this.canOpenStockArchives }
    ];
  }

  private get employeeNavItems(): NavItem[] {
    return [
      { label: this.shellText.nav.dashboard, route: '/dashboard', visible: this.isLoggedIn, exact: true },
      { label: this.shellText.nav.tasks, route: '/my-tasks', visible: this.canOpenMyTasks },
      { label: this.shellText.nav.stock, route: '/stock', visible: this.canViewStock, exact: true },
      { label: this.shellText.nav.inventory, route: '/inventaire', visible: this.canOpenInventory }
    ];
  }

  private setNavigationLoading(isStarting: boolean): void {
    if (isStarting) {
      this.pendingNavigationSignals += 1;
    } else {
      this.pendingNavigationSignals = Math.max(0, this.pendingNavigationSignals - 1);
    }
    this.navigationLoading = this.pendingNavigationSignals > 0;
  }

  private preloadAuthorizedScreens(): void {
    const preloaders: Record<string, () => Promise<unknown>> = {
      dashboard: () => import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      account: () => import('./components/account/account.component').then((m) => m.AccountComponent),
      tasks: () => import('./components/tasks/task-list.component').then((m) => m.TaskListComponent),
      taskForm: () => import('./components/tasks/task-form.component').then((m) => m.TaskFormComponent),
      myTasks: () => import('./components/tasks/my-tasks.component').then((m) => m.MyTasksComponent),
      quotes: () => import('./components/quote-list/quote-list.component').then((m) => m.QuoteListComponent),
      quoteForm: () => import('./components/quote-form/quote-form.component').then((m) => m.QuoteFormComponent),
      clients: () => import('./components/clients/clients.component').then((m) => m.ClientsComponent),
      stock: () => import('./components/stock/stock.component').then((m) => m.StockComponent),
      inventory: () => import('./components/inventaire/inventaire.component').then((m) => m.InventaireComponent),
      movements: () => import('./components/stock-history/stock-history.component').then((m) => m.StockHistoryComponent),
      employees: () => import('./components/employees/employee-list.component').then((m) => m.EmployeeListComponent),
      archives: () => import('./components/stock-archives/stock-archives.component').then((m) => m.StockArchivesComponent),
      settings: () => import('./settings/settings.component').then((m) => m.SettingsComponent)
    };

    const preloadKeys = new Set<string>(['dashboard', 'account']);

    for (const item of this.navItems) {
      switch (item.route) {
        case '/tasks':
          preloadKeys.add('tasks');
          preloadKeys.add('taskForm');
          break;
        case '/my-tasks':
          preloadKeys.add('myTasks');
          break;
        case '/quotes':
          preloadKeys.add('quotes');
          preloadKeys.add('quoteForm');
          break;
        case '/clients':
          preloadKeys.add('clients');
          break;
        case '/stock':
          preloadKeys.add('stock');
          break;
        case '/inventaire':
          preloadKeys.add('inventory');
          break;
        case '/movements':
          preloadKeys.add('movements');
          break;
        case '/employees':
          preloadKeys.add('employees');
          break;
        case '/archives':
          preloadKeys.add('archives');
          break;
        default:
          break;
      }
    }

    if (this.canOpenSettings) {
      preloadKeys.add('settings');
    }

    if (this.canOpenHistory) {
      preloadKeys.add('movements');
    }

    for (const key of preloadKeys) {
      if (this.preloadedScreens.has(key) || !preloaders[key]) {
        continue;
      }
      this.preloadedScreens.add(key);
      void preloaders[key]().catch(() => {
        this.preloadedScreens.delete(key);
      });
    }

    if (this.canOpenInventory) {
      void this.stockStore.warmInventory().catch(() => {});
    }

    if (this.canOpenInventory || this.canOpenHistory) {
      void this.stockStore.warmMovements().catch(() => {});
    }

    if (this.canViewStock) {
      void this.stockStore.warmStockCatalog().catch(() => {});
    }

    if (this.canOpenStockArchives) {
      void this.stockStore.warmArchives().catch(() => {});
    }

    if (this.canManageTasksPermission) {
      void this.tasksRepository.warmDefaultList().catch(() => {});
      void this.employeesRepository.warmList().catch(() => {});
    }

    if (this.canReceiveTasksPermission && !this.canManageTasksPermission) {
      void this.tasksRepository.warmMineDefaultList().catch(() => {});
    }

    if (this.canManageInvoices) {
      void this.invoiceStore.warm().catch(() => {});
    }

    if (this.canManageQuotes) {
      void this.quoteStore.warm().catch(() => {});
      if (this.canManageInvoices) {
        void this.invoiceStore.warm().catch(() => {});
      }
    }

    if (this.canManageClients) {
      void this.clientStore.warm().catch(() => {});
    }

    if (this.canOpenEmployees) {
      void this.employeesRepository.warmList().catch(() => {});
    }
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
    if (url.startsWith('/dashboard')) return 'dashboard-page';
    if (url.startsWith('/account')) return 'account-page';
    if (url.startsWith('/invoices')) return 'invoices-page';
    if (url.startsWith('/quotes')) return 'quotes-page';
    if (url.startsWith('/clients')) return 'clients-page';
    if (url.startsWith('/products')) return 'products-page';
    if (url.startsWith('/archives')) return 'archives-page';
    if (url.startsWith('/movements')) return 'movements-page';
    if (url.startsWith('/salary')) return 'salary-page';
    if (url.startsWith('/stock/archives')) return 'stock-archives-page';
    if (url.startsWith('/stock/history') || url.startsWith('/stock-history')) return 'stock-history-page';
    if (url.startsWith('/stock')) return 'stock-page';
    if (url.startsWith('/inventaire')) return 'inventaire-page';
    if (url.startsWith('/estimation')) return 'estimation-page';
    if (url.startsWith('/employees')) return 'employees-page';
    if (url.startsWith('/tasks')) return 'tasks-page';
    if (url.startsWith('/my-tasks')) return 'my-tasks-page';
    return null;
  }
}
