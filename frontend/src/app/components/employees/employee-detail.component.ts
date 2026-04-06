import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Employee, SalaryAdvance, SalaryBonus, SalaryOvertime, SalarySummary } from '../../models/employee.models';
import { EmployeesRepository } from '../../repositories/employees.repository';
import { SalaryAdvancesRepository } from '../../repositories/salary-advances.repository';
import { SalaryBonusesRepository } from '../../repositories/salary-bonuses.repository';
import { SalaryOvertimesRepository } from '../../repositories/salary-overtimes.repository';
import { AuthService } from '../../services/auth.service';
import { SalarySummaryService } from '../../services/salary-summary.service';
import { getEmployeeAccountPasswordError } from '../../utils/employee-password-policy';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.css']
})
export class EmployeeDetailComponent implements OnInit {
  readonly monthOptions = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Fevrier' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Aout' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Decembre' }
  ];
  readonly yearOptions = this.buildYearOptions();

  employeeId = '';
  employee: Employee | null = null;
  summary: SalarySummary | null = null;
  advances: SalaryAdvance[] = [];
  bonuses: SalaryBonus[] = [];
  overtimes: SalaryOvertime[] = [];

  loading = false;
  error = '';
  salaryActionError = '';
  salaryActionSuccess = '';
  resetPasswordError = '';
  resetPasswordSuccess = '';
  addingAdvance = false;
  addingBonus = false;
  addingOvertime = false;
  resettingPassword = false;

  periodForm = this.fb.group({
    month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]]
  });

  advanceForm = this.fb.group({
    montant: [0, [Validators.required, Validators.min(0.01)]],
    note: [''],
    dateAvance: [new Date().toISOString().slice(0, 10), Validators.required]
  });

  bonusForm = this.fb.group({
    montant: [0, [Validators.required, Validators.min(0.01)]],
    motif: [''],
    datePrime: [new Date().toISOString().slice(0, 10), Validators.required]
  });

  overtimeForm = this.fb.group({
    heuresSupplementaires: [0, [Validators.required, Validators.min(0.01)]],
    dateHeuresSup: [new Date().toISOString().slice(0, 10), Validators.required],
    motif: ['']
  });

  resetPasswordForm = this.fb.group({
    newPassword: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeesRepository: EmployeesRepository,
    private salaryAdvancesRepository: SalaryAdvancesRepository,
    private salaryBonusesRepository: SalaryBonusesRepository,
    private salaryOvertimesRepository: SalaryOvertimesRepository,
    private salarySummaryService: SalarySummaryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  get canManageEmployees(): boolean {
    return this.authService.hasPermission('manageEmployees');
  }

  get month(): number {
    return Number(this.periodForm.controls.month.value ?? new Date().getMonth() + 1);
  }

  get year(): number {
    return Number(this.periodForm.controls.year.value ?? new Date().getFullYear());
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Identifiant salarie manquant.';
      return;
    }

    this.employeeId = id;
    console.log('[salary-period] selector initialized', { month: this.month, year: this.year });
    console.log('[ui-action] handler entered', { action: 'salary:page-init' });
    await this.loadAll();
    this.triggerUiRender('salary:page-init');
  }

  onPeriodSelectionChanged(): void {
    console.log('[salary-period] month/year changed', { month: this.month, year: this.year });
  }

  async reloadPeriod(): Promise<void> {
    console.log('[salary-period] reload requested', { month: this.month, year: this.year });
    await this.loadFinanceData();
  }

  async openEdit(): Promise<void> {
    console.log('[salary-edit] click received', { employeeId: this.employee?.id ?? null });
    console.log('[salary-edit] handler entered');
    if (!this.employee || !this.canManageEmployees) {
      return;
    }

    const targetRoute = ['/employees', this.employee.id, 'edit'];
    console.log('[salary-edit] navigation start', { targetRoute });
    const navigated = await this.router.navigate(targetRoute);
    console.log('[salary-edit] navigation end', { success: navigated, targetRoute });
  }

  async addAdvance(): Promise<void> {
    console.log('[ui-action] click received', { action: 'salary:add-advance' });
    console.log('[salary:add-advance] first click received', { employeeId: this.employeeId || null });
    if (this.addingAdvance) return;
    this.addingAdvance = true;
    this.clearSalaryActionMessages();
    this.triggerUiRender('salary:add-advance:pending');
    console.log('[salary:add-advance] handler entered');
    if (!this.employeeId || this.advanceForm.invalid) {
      this.advanceForm.markAllAsTouched();
      this.salaryActionError = 'Formulaire avance invalide.';
      console.log('[salary:add-advance] ui updated', { success: false, reason: 'invalid-form' });
      this.addingAdvance = false;
      this.triggerUiRender('salary:add-advance:invalid');
      return;
    }

    const raw = this.advanceForm.getRawValue();
    try {
      console.log('[salary:add-advance] request sent', { employeeId: this.employeeId });
      const created = await this.salaryAdvancesRepository.create({
        employeeId: this.employeeId,
        montant: Number(raw.montant ?? 0),
        note: raw.note ?? '',
        dateAvance: raw.dateAvance ?? undefined,
        moisReference: this.month,
        anneeReference: this.year
      });
      console.log('[salary:add-advance] response received', { ok: !!created });
      if (!created) {
        this.salaryActionError = 'Ajout avance impossible.';
        console.log('[salary:add-advance] ui updated', { success: false });
        this.triggerUiRender('salary:add-advance:failed');
        return;
      }

      this.advanceForm.patchValue({ montant: 0, note: '' });
      await this.loadFinanceData();
      this.salaryActionSuccess = 'Avance ajoutee.';
      console.log('[salary:add-advance] ui updated', { success: true });
      this.triggerUiRender('salary:add-advance:success');
    } catch (error) {
      this.salaryActionError = error instanceof Error ? error.message : 'Ajout avance impossible.';
      console.log('[salary:add-advance] ui updated', { success: false, error: this.salaryActionError });
      this.triggerUiRender('salary:add-advance:error');
    } finally {
      this.addingAdvance = false;
      this.triggerUiRender('salary:add-advance:finally');
    }
  }

  async deleteAdvance(advance: SalaryAdvance): Promise<void> {
    await this.salaryAdvancesRepository.delete(advance.id);
    await this.loadFinanceData();
  }

  async addBonus(): Promise<void> {
    console.log('[ui-action] click received', { action: 'salary:add-prime' });
    console.log('[salary:add-prime] first click received', { employeeId: this.employeeId || null });
    if (this.addingBonus) return;
    this.addingBonus = true;
    this.clearSalaryActionMessages();
    this.triggerUiRender('salary:add-prime:pending');
    console.log('[salary:add-prime] handler entered');
    if (!this.employeeId || this.bonusForm.invalid) {
      this.bonusForm.markAllAsTouched();
      this.salaryActionError = 'Formulaire prime invalide.';
      console.log('[salary:add-prime] ui updated', { success: false, reason: 'invalid-form' });
      this.addingBonus = false;
      this.triggerUiRender('salary:add-prime:invalid');
      return;
    }

    const raw = this.bonusForm.getRawValue();
    try {
      console.log('[salary:add-prime] request sent', { employeeId: this.employeeId });
      const created = await this.salaryBonusesRepository.create({
        employeeId: this.employeeId,
        montant: Number(raw.montant ?? 0),
        motif: raw.motif ?? '',
        datePrime: raw.datePrime ?? undefined,
        moisReference: this.month,
        anneeReference: this.year
      });
      console.log('[salary:add-prime] response received', { ok: !!created });
      if (!created) {
        this.salaryActionError = 'Ajout prime impossible.';
        console.log('[salary:add-prime] ui updated', { success: false });
        this.triggerUiRender('salary:add-prime:failed');
        return;
      }

      this.bonusForm.patchValue({ montant: 0, motif: '' });
      await this.loadFinanceData();
      this.salaryActionSuccess = 'Prime ajoutee.';
      console.log('[salary:add-prime] ui updated', { success: true });
      this.triggerUiRender('salary:add-prime:success');
    } catch (error) {
      this.salaryActionError = error instanceof Error ? error.message : 'Ajout prime impossible.';
      console.log('[salary:add-prime] ui updated', { success: false, error: this.salaryActionError });
      this.triggerUiRender('salary:add-prime:error');
    } finally {
      this.addingBonus = false;
      this.triggerUiRender('salary:add-prime:finally');
    }
  }

  async deleteBonus(bonus: SalaryBonus): Promise<void> {
    await this.salaryBonusesRepository.delete(bonus.id);
    await this.loadFinanceData();
  }

  async addOvertime(): Promise<void> {
    console.log('[ui-action] click received', { action: 'salary:add-overtime' });
    console.log('[salary:add-overtime] first click received', { employeeId: this.employeeId || null });
    if (this.addingOvertime) return;
    this.addingOvertime = true;
    this.clearSalaryActionMessages();
    this.triggerUiRender('salary:add-overtime:pending');
    console.log('[salary:add-overtime] handler entered');
    if (!this.employeeId || this.overtimeForm.invalid) {
      this.overtimeForm.markAllAsTouched();
      this.salaryActionError = 'Formulaire heures supplementaires invalide.';
      console.log('[salary:add-overtime] ui updated', { success: false, reason: 'invalid-form' });
      this.addingOvertime = false;
      this.triggerUiRender('salary:add-overtime:invalid');
      return;
    }

    const raw = this.overtimeForm.getRawValue();
    try {
      console.log('[salary:add-overtime] request sent', { employeeId: this.employeeId });
      const created = await this.salaryOvertimesRepository.create({
        employeeId: this.employeeId,
        heuresSupplementaires: Number(raw.heuresSupplementaires ?? 0),
        motif: raw.motif ?? '',
        dateHeuresSup: raw.dateHeuresSup ?? undefined,
        moisReference: this.month,
        anneeReference: this.year
      });
      console.log('[salary:add-overtime] response received', { ok: !!created });
      if (!created) {
        this.salaryActionError = 'Ajout heures supplementaires impossible.';
        console.log('[salary:add-overtime] ui updated', { success: false });
        this.triggerUiRender('salary:add-overtime:failed');
        return;
      }

      this.overtimeForm.patchValue({ heuresSupplementaires: 0, motif: '' });
      await this.loadFinanceData();
      this.salaryActionSuccess = 'Heures supplementaires ajoutees.';
      console.log('[salary:add-overtime] ui updated', { success: true });
      this.triggerUiRender('salary:add-overtime:success');
    } catch (error) {
      this.salaryActionError = error instanceof Error ? error.message : 'Ajout heures supplementaires impossible.';
      console.log('[salary:add-overtime] ui updated', { success: false, error: this.salaryActionError });
      this.triggerUiRender('salary:add-overtime:error');
    } finally {
      this.addingOvertime = false;
      this.triggerUiRender('salary:add-overtime:finally');
    }
  }

  async deleteOvertime(overtime: SalaryOvertime): Promise<void> {
    await this.salaryOvertimesRepository.delete(overtime.id);
    await this.loadFinanceData();
  }

  async resetPassword(): Promise<void> {
    console.log('[ui-action] click received', { action: 'salary:reset-password' });
    console.log('[salary:reset-password] first click received', { employeeId: this.employeeId || null });
    if (this.resettingPassword) return;
    this.resettingPassword = true;
    console.log('[salary:reset-password] handler entered');
    this.triggerUiRender('salary:reset-password:pending');
    this.resetPasswordError = '';
    this.resetPasswordSuccess = '';
    if (!this.employeeId || this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      this.resetPasswordError = 'Formulaire mot de passe invalide.';
      console.log('[salary:reset-password] ui updated', { success: false, reason: 'invalid-form' });
      this.resettingPassword = false;
      this.triggerUiRender('salary:reset-password:invalid');
      return;
    }

    const raw = this.resetPasswordForm.getRawValue();
    const passwordError = getEmployeeAccountPasswordError(raw.newPassword, this.employee?.role, { optional: false });
    if (passwordError) {
      this.resetPasswordError = passwordError;
      console.log('[salary:reset-password] ui updated', { success: false, reason: 'password-policy' });
      this.resettingPassword = false;
      this.triggerUiRender('salary:reset-password:policy-error');
      return;
    }

    try {
      console.log('[salary:reset-password] request sent', { employeeId: this.employeeId });
      const ok = await this.authService.resetPassword(this.employeeId, raw.newPassword ?? '');
      console.log('[salary:reset-password] response received', { ok });
      if (!ok) {
        this.resetPasswordError = 'Reinitialisation impossible.';
        console.log('[salary:reset-password] ui updated', { success: false });
        this.triggerUiRender('salary:reset-password:failed');
        return;
      }

      this.resetPasswordForm.reset({ newPassword: '' });
      this.resetPasswordSuccess = 'Mot de passe reinitialise.';
      console.log('[salary:reset-password] ui updated', { success: true });
      this.triggerUiRender('salary:reset-password:success');
    } catch (error) {
      this.resetPasswordError = error instanceof Error ? error.message : 'Reinitialisation impossible.';
      console.log('[salary:reset-password] ui updated', { success: false, error: this.resetPasswordError });
      this.triggerUiRender('salary:reset-password:error');
    } finally {
      this.resettingPassword = false;
      this.triggerUiRender('salary:reset-password:finally');
    }
  }

  private async loadAll(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.triggerUiRender('salary:load-all:start');
    try {
      this.employee = await this.employeesRepository.getById(this.employeeId);
      if (!this.employee) {
        this.error = 'Salarie introuvable.';
        this.triggerUiRender('salary:load-all:not-found');
        return;
      }
      await this.loadFinanceData();
    } catch {
      this.error = 'Chargement impossible.';
      this.triggerUiRender('salary:load-all:error');
    } finally {
      this.loading = false;
      this.triggerUiRender('salary:load-all:finally');
    }
  }

  private async loadFinanceData(): Promise<void> {
    console.log('[ui-action] request sent', { action: 'salary:load-finance-data', employeeId: this.employeeId, month: this.month, year: this.year });
    this.advances = await this.salaryAdvancesRepository.listByEmployee(this.employeeId, this.month, this.year);
    this.bonuses = await this.salaryBonusesRepository.listByEmployee(this.employeeId, this.month, this.year);
    this.overtimes = await this.salaryOvertimesRepository.listByEmployee(this.employeeId, this.month, this.year);
    this.summary = await this.salarySummaryService.getEmployeeSalarySummary(this.employeeId, this.month, this.year);
    console.log('[ui-action] response received', {
      action: 'salary:load-finance-data',
      advances: this.advances.length,
      bonuses: this.bonuses.length,
      overtimes: this.overtimes.length,
      hasSummary: !!this.summary
    });
    this.triggerUiRender('salary:load-finance-data:done');
  }

  private clearSalaryActionMessages(): void {
    this.salaryActionError = '';
    this.salaryActionSuccess = '';
  }

  private triggerUiRender(action: string): void {
    this.ngZone.run(() => {
      console.log('[ui-action] state updated', { action });
      this.cdr.detectChanges();
      console.log('[ui-action] change detection triggered', { action });
    });
    console.log('[ui-action] render ready', { action });
  }

  private buildYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const minYear = 2020;
    const maxYear = currentYear + 2;
    const years: number[] = [];
    for (let year = maxYear; year >= minYear; year -= 1) {
      years.push(year);
    }
    return years;
  }
}
