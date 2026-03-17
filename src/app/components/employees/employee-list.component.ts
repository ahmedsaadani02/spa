import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs';
import { Employee } from '../../models/employee.models';
import { EmployeesRepository } from '../../repositories/employees.repository';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private firstNavigationLogged = false;

  readonly searchControl = new FormControl('', { nonNullable: true });

  employees: Employee[] = [];
  loading = false;
  error = '';
  navigatingEmployeeId: string | null = null;
  navigatingAction: 'view' | 'edit' | null = null;

  constructor(
    private employeesRepository: EmployeesRepository,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get canManageEmployees(): boolean {
    return this.auth.hasPermission('manageEmployees');
  }

  ngOnInit(): void {
    console.log('[employees-page] init');
    this.logRouteEntry(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.logRouteEntry(event.urlAfterRedirects);
      });

    void this.initializePage();
  }

  private async initializePage(): Promise<void> {
    await this.auth.ensureInitialized();
    const currentUserReady = !!this.auth.currentUser();
    const permissionsReady = this.auth.hasPermission('manageEmployees') || this.auth.hasPermission('manageSalary');
    console.log(`[employees-page] current user ready: ${currentUserReady ? 'yes' : 'no'}`);
    console.log(`[employees-page] permissions ready: ${permissionsReady ? 'yes' : 'no'}`);

    this.searchControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        void this.search(query, false);
      });

    void this.search(this.searchControl.getRawValue(), true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByEmployee = (_index: number, employee: Employee): string => employee.id;

  async toggleActive(employee: Employee): Promise<void> {
    if (!this.canManageEmployees) return;
    this.error = '';
    const ok = await this.employeesRepository.setActive(employee.id, !employee.actif);
    if (!ok) {
      this.error = "Impossible de modifier le statut du salarie.";
      return;
    }
    await this.search(this.searchControl.getRawValue(), false);
  }

  async deleteEmployee(employee: Employee): Promise<void> {
    console.log('[ui-action] click received', { action: 'archives:delete', employeeId: employee?.id ?? null });
    console.log('[archives:delete] first click received', { employeeId: employee?.id ?? null });
    if (!this.canManageEmployees) return;
    this.error = '';
    console.log('[ui-action] handler entered', { action: 'archives:delete' });
    console.log('[archives:delete] handler entered');
    const confirmed = window.confirm(`Supprimer le salarie ${employee.nom} ?`);
    if (!confirmed) return;

    console.log('[ui-action] request sent', { action: 'archives:delete', employeeId: employee.id });
    console.log('[archives:delete] request sent', { employeeId: employee.id });
    const ok = await this.employeesRepository.delete(employee.id);
    console.log('[ui-action] response received', { action: 'archives:delete', ok });
    console.log('[archives:delete] response received', { ok });
    if (!ok) {
      this.error = 'Suppression impossible.';
      console.log('[archives:delete] ui updated', { success: false, error: this.error });
      console.log('[ui-action] state updated', { action: 'archives:delete', success: false });
      this.cdr.detectChanges();
      console.log('[ui-action] change detection triggered', { action: 'archives:delete' });
      console.log('[ui-action] render ready', { action: 'archives:delete' });
      return;
    }

    await this.search(this.searchControl.getRawValue(), false);
    console.log('[archives:delete] ui updated', { success: true });
    console.log('[ui-action] state updated', { action: 'archives:delete', success: true });
    this.cdr.detectChanges();
    console.log('[ui-action] change detection triggered', { action: 'archives:delete' });
    console.log('[ui-action] render ready', { action: 'archives:delete' });
  }

  openEmployee(employee: Employee): void {
    console.log('[ui-action] click received', { action: 'archives:view', employeeId: employee?.id ?? null });
    console.log('[archives:view] first click received', { employeeId: employee?.id ?? null });
    if (!employee?.id) return;
    this.navigatingEmployeeId = employee.id;
    this.navigatingAction = 'view';
    this.cdr.detectChanges();
    console.log('[archives:view] handler entered');
    console.log('[ui-action] handler entered', { action: 'archives:view' });
    console.log('[ui-action] navigation start', { action: 'archives:view', route: `/employees/${employee.id}` });
    console.log('[archives:view] request sent', { route: `/employees/${employee.id}` });
    void this.router.navigate(['/employees', employee.id])
      .then((ok) => {
        console.log('[archives:view] response received', { ok });
        console.log('[ui-action] navigation end', { action: 'archives:view', ok });
        console.log('[ui-action] response received', { action: 'archives:view', ok });
        if (ok) {
          console.log('[archives:view] ui updated');
          console.log('[ui-action] state updated', { action: 'archives:view', success: true });
        }
      })
      .finally(() => {
        this.navigatingEmployeeId = null;
        this.navigatingAction = null;
        this.cdr.detectChanges();
        console.log('[ui-action] change detection triggered', { action: 'archives:view' });
        console.log('[ui-action] render ready', { action: 'archives:view' });
      });
  }

  openEditEmployee(employee: Employee): void {
    console.log('[ui-action] click received', { action: 'archives:edit', employeeId: employee?.id ?? null });
    console.log('[archives:edit] first click received', { employeeId: employee?.id ?? null });
    if (!employee?.id || !this.canManageEmployees) return;
    this.navigatingEmployeeId = employee.id;
    this.navigatingAction = 'edit';
    this.cdr.detectChanges();
    console.log('[archives:edit] handler entered');
    console.log('[ui-action] handler entered', { action: 'archives:edit' });
    console.log('[ui-action] navigation start', { action: 'archives:edit', route: `/employees/${employee.id}/edit` });
    console.log('[archives:edit] request sent', { route: `/employees/${employee.id}/edit` });
    void this.router.navigate(['/employees', employee.id, 'edit'])
      .then((ok) => {
        console.log('[archives:edit] response received', { ok });
        console.log('[ui-action] navigation end', { action: 'archives:edit', ok });
        console.log('[ui-action] response received', { action: 'archives:edit', ok });
        if (ok) {
          console.log('[archives:edit] ui updated');
          console.log('[ui-action] state updated', { action: 'archives:edit', success: true });
        }
      })
      .finally(() => {
        this.navigatingEmployeeId = null;
        this.navigatingAction = null;
        this.cdr.detectChanges();
        console.log('[ui-action] change detection triggered', { action: 'archives:edit' });
        console.log('[ui-action] render ready', { action: 'archives:edit' });
      });
  }

  isNavigating(employee: Employee, action: 'view' | 'edit'): boolean {
    return this.navigatingEmployeeId === employee.id && this.navigatingAction === action;
  }

  private async search(query: string, isInitialLoad: boolean): Promise<void> {
    console.log('[employees-page] load requested', { query, isInitialLoad });
    this.loading = true;
    this.error = '';
    try {
      const text = query.trim();
      let rows = text
        ? await this.employeesRepository.search(text)
        : await this.employeesRepository.list();
      console.log('[employees-page] api response received');
      console.log(`[employees-page] employees count: ${rows.length}`);

      if (isInitialLoad && !text && rows.length === 0 && this.auth.isLoggedIn()) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        rows = await this.employeesRepository.list();
        console.log('[employees-page] api response received');
        console.log(`[employees-page] employees count: ${rows.length}`);
      }

      this.employees = rows;
      this.cdr.detectChanges();
      this.logRenderState();
    } catch {
      this.error = 'Chargement impossible.';
      console.log('[employees-page] displayed error', this.error);
      this.employees = [];
      this.cdr.detectChanges();
      this.logRenderState();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      this.logRenderState();
    }
  }

  private logRouteEntry(url: string): void {
    if (!url.startsWith('/employees')) {
      return;
    }
    console.log('[employees-page] route entered');
    if (!this.firstNavigationLogged) {
      this.firstNavigationLogged = true;
      console.log('[employees-page] first navigation detected');
    }
  }

  private logRenderState(): void {
    console.log(`[employees-page] rendered employees count: ${this.employees.length}`);
    console.log('[employees-page] empty state condition value', !this.loading && this.employees.length === 0);
  }
}
