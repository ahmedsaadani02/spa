import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Employee, EmployeeUpsertInput } from '../../models/employee.models';
import { EmployeesRepository } from '../../repositories/employees.repository';
import { AuthService } from '../../services/auth.service';

type PermissionControlKey =
  | 'canViewStock'
  | 'canAddStock'
  | 'canRemoveStock'
  | 'canAdjustStock'
  | 'canManageStock'
  | 'canManageInvoices'
  | 'canManageQuotes'
  | 'canManageClients'
  | 'canManageEstimations'
  | 'canManageArchives'
  | 'canManageInventory'
  | 'canViewHistory'
  | 'canManageSalary'
  | 'canManageEmployees'
  | 'canManageAll';

type PermissionBlock = {
  title: string;
  items: Array<{
    key: PermissionControlKey;
    label: string;
  }>;
};

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {
  employeeId: string | null = null;
  loading = false;
  saving = false;
  error = '';
  private syncingPermissions = false;

  readonly permissionBlocks: PermissionBlock[] = [
    {
      title: 'Stock',
      items: [
        { key: 'canViewStock' as PermissionControlKey, label: 'Voir stock' },
        { key: 'canAddStock' as PermissionControlKey, label: 'Ajouter stock' },
        { key: 'canRemoveStock' as PermissionControlKey, label: 'Retirer stock' },
        { key: 'canAdjustStock' as PermissionControlKey, label: 'Ajuster stock' },
        { key: 'canManageStock' as PermissionControlKey, label: 'G\u00e9rer stock' }
      ]
    },
    {
      title: 'Commercial',
      items: [
        { key: 'canManageQuotes' as PermissionControlKey, label: 'G\u00e9rer devis' },
        { key: 'canManageInvoices' as PermissionControlKey, label: 'G\u00e9rer factures' },
        { key: 'canManageClients' as PermissionControlKey, label: 'G\u00e9rer clients' },
        { key: 'canManageEstimations' as PermissionControlKey, label: 'G\u00e9rer estimation' }
      ]
    },
    {
      title: 'Suivi / Contr\u00f4le',
      items: [
        { key: 'canManageArchives' as PermissionControlKey, label: 'G\u00e9rer archives' },
        { key: 'canManageInventory' as PermissionControlKey, label: 'G\u00e9rer inventaire' },
        { key: 'canViewHistory' as PermissionControlKey, label: 'Voir historique' }
      ]
    },
    {
      title: 'RH',
      items: [
        { key: 'canManageSalary' as PermissionControlKey, label: 'G\u00e9rer salaires' }
      ]
    },
    {
      title: 'Global',
      items: [
        { key: 'canManageAll' as PermissionControlKey, label: 'G\u00e9rer tout' }
      ]
    }
  ];

  private readonly permissionControlKeys: PermissionControlKey[] = [
    'canViewStock',
    'canAddStock',
    'canRemoveStock',
    'canAdjustStock',
    'canManageStock',
    'canManageInvoices',
    'canManageQuotes',
    'canManageClients',
    'canManageEstimations',
    'canManageArchives',
    'canManageInventory',
    'canViewHistory',
    'canManageSalary',
    'canManageEmployees',
    'canManageAll'
  ];

  form = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    telephone: [''],
    email: ['', [Validators.email]],
    adresse: [''],
    poste: [''],
    salaireBase: [0, [Validators.required, Validators.min(0)]],
    dateEmbauche: [''],
    actif: [true],
    isActive: [true],
    username: [''],
    initialPassword: [''],
    mustSetupPassword: [false],
    role: ['employee'],
    canViewStock: [false],
    canAddStock: [false],
    canRemoveStock: [false],
    canAdjustStock: [false],
    canManageStock: [false],
    canManageEmployees: [false],
    canManageInvoices: [false],
    canManageQuotes: [false],
    canManageClients: [false],
    canManageEstimations: [false],
    canManageArchives: [false],
    canManageInventory: [false],
    canViewHistory: [false],
    canManageSalary: [false],
    canManageAll: [false]
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeesRepository: EmployeesRepository,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  get isEditMode(): boolean {
    return !!this.employeeId;
  }

  get canAssignSensitiveRoles(): boolean {
    return this.auth.role() === 'developer';
  }

  get canManageProtectedFlags(): boolean {
    const role = this.auth.role();
    return role === 'developer' || role === 'owner';
  }

  get canUseGlobalManageAll(): boolean {
    const currentRole = this.auth.role();
    const role = this.form.controls.role.value;
    const currentIsHigh = currentRole === 'admin' || currentRole === 'developer' || currentRole === 'owner';
    const targetIsHigh = role === 'admin' || role === 'developer' || role === 'owner';
    return currentIsHigh && targetIsHigh;
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      console.log('[salary-edit] data load requested', { employeeId: this.employeeId });
      void this.loadEmployee(this.employeeId);
    }

    this.form.controls.role.valueChanges.subscribe((role) => {
      if (role === 'admin' || role === 'developer' || role === 'owner') {
        this.patchPermissionValues({
          canViewStock: true,
          canAddStock: true,
          canRemoveStock: true,
          canAdjustStock: true,
          canManageStock: true,
          canManageEmployees: true,
          canManageInvoices: true,
          canManageQuotes: true,
          canManageClients: true,
          canManageEstimations: true,
          canManageArchives: true,
          canManageInventory: true,
          canViewHistory: true,
          canManageSalary: true,
          canManageAll: true
        });
      } else {
        this.patchPermissionValues({ canManageAll: false });
      }
      this.syncPermissionDependencies();
    });
  }

  onPermissionToggle(control: PermissionControlKey): void {
    this.syncPermissionDependencies(control);
  }

  async submit(): Promise<void> {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.initialPassword && raw.initialPassword.length > 0 && raw.initialPassword.length < 10) {
      this.error = 'Le mot de passe doit contenir au moins 10 caracteres.';
      return;
    }

    const payload: EmployeeUpsertInput = {
      nom: raw.nom?.trim() ?? '',
      telephone: raw.telephone?.trim() ?? '',
      email: raw.email?.trim().toLowerCase() ?? '',
      adresse: raw.adresse?.trim() ?? '',
      poste: raw.poste?.trim() ?? '',
      salaireBase: Number(raw.salaireBase ?? 0),
      dateEmbauche: raw.dateEmbauche ? raw.dateEmbauche : null,
      actif: !!raw.actif,
      isActive: !!raw.isActive,
      username: raw.username?.trim().toLowerCase() ?? '',
      role: raw.role === 'developer'
        ? 'developer'
        : raw.role === 'owner'
          ? 'owner'
          : raw.role === 'admin'
            ? 'admin'
            : 'employee',
      mustSetupPassword: !!raw.mustSetupPassword,
      canViewStock: !!raw.canViewStock,
      canAddStock: !!raw.canAddStock,
      canRemoveStock: !!raw.canRemoveStock,
      canAdjustStock: !!raw.canAdjustStock,
      canManageStock: !!raw.canManageStock,
      canManageEmployees: !!raw.canManageEmployees,
      canManageInvoices: !!raw.canManageInvoices,
      canManageQuotes: !!raw.canManageQuotes,
      canManageClients: !!raw.canManageClients,
      canManageEstimations: !!raw.canManageEstimations,
      canManageArchives: !!raw.canManageArchives,
      canManageInventory: !!raw.canManageInventory,
      canViewHistory: !!raw.canViewHistory,
      canManageSalary: !!raw.canManageSalary,
      canManageAll: !!raw.canManageAll && this.canUseGlobalManageAll
    };

    if (raw.initialPassword?.trim()) {
      payload.initialPassword = raw.initialPassword.trim();
    }

    this.saving = true;
    try {
      const saved = this.employeeId
        ? await this.employeesRepository.update(this.employeeId, payload)
        : await this.employeesRepository.create(payload);

      if (!saved) {
        this.error = 'Enregistrement impossible.';
        return;
      }

      await this.router.navigate(['/employees']);
    } catch {
      this.error = 'Une erreur est survenue pendant lenregistrement.';
    } finally {
      this.saving = false;
    }
  }

  private async loadEmployee(id: string): Promise<void> {
    this.loading = true;
    this.error = '';
    this.triggerSalaryEditRender('load:start');
    try {
      const employee = await this.employeesRepository.getById(id);
      console.log('[salary-edit] data response received', { employeeId: id, found: !!employee });
      if (!employee) {
        this.error = 'Salarie introuvable.';
        this.triggerSalaryEditRender('load:not-found');
        return;
      }
      this.patchForm(employee);
      console.log('[salary-edit] state updated', { employeeId: id });
      this.triggerSalaryEditRender('load:patched');
    } catch {
      this.error = 'Chargement impossible.';
      this.triggerSalaryEditRender('load:error');
    } finally {
      this.loading = false;
      this.triggerSalaryEditRender('load:finally');
    }
  }

  private patchForm(employee: Employee): void {
    this.form.patchValue({
      nom: employee.nom,
      telephone: employee.telephone,
      email: employee.email,
      adresse: employee.adresse,
      poste: employee.poste,
      salaireBase: employee.salaireBase,
      dateEmbauche: employee.dateEmbauche ?? '',
      actif: employee.actif,
      isActive: employee.isActive,
      username: employee.username,
      initialPassword: '',
      mustSetupPassword: employee.mustSetupPassword,
      role: employee.role,
      canViewStock: employee.canViewStock,
      canAddStock: employee.canAddStock,
      canRemoveStock: employee.canRemoveStock,
      canAdjustStock: employee.canAdjustStock,
      canManageStock: employee.canManageStock,
      canManageEmployees: employee.canManageEmployees,
      canManageInvoices: employee.canManageInvoices,
      canManageQuotes: employee.canManageQuotes,
      canManageClients: employee.canManageClients,
      canManageEstimations: employee.canManageEstimations,
      canManageArchives: employee.canManageArchives,
      canManageInventory: employee.canManageInventory,
      canViewHistory: employee.canViewHistory,
      canManageSalary: employee.canManageSalary,
      canManageAll: employee.canManageAll
    });
    this.syncPermissionDependencies();
  }

  private patchPermissionValues(patch: Partial<Record<PermissionControlKey, boolean>>): void {
    this.syncingPermissions = true;
    this.form.patchValue(patch, { emitEvent: false });
    this.syncingPermissions = false;
  }

  private syncPermissionDependencies(changed?: PermissionControlKey): void {
    if (this.syncingPermissions) {
      return;
    }

    const values = this.form.getRawValue();
    const updates: Partial<Record<PermissionControlKey, boolean>> = {};

    const manageAllRequested = !!values.canManageAll && this.canUseGlobalManageAll;
    if (!!values.canManageAll !== manageAllRequested) {
      updates.canManageAll = manageAllRequested;
    }

    if (manageAllRequested) {
      this.permissionControlKeys.forEach((key) => {
        if (!values[key]) {
          updates[key] = true;
        }
      });
      updates.canManageAll = true;
    } else {
      const stockChildren = [values.canAddStock, values.canRemoveStock, values.canAdjustStock];
      const allStockChildren = stockChildren.every((flag) => !!flag);
      const hasAnyStockChild = stockChildren.some((flag) => !!flag);

      if (changed === 'canManageStock' && values.canManageStock) {
        updates.canAddStock = true;
        updates.canRemoveStock = true;
        updates.canAdjustStock = true;
      }

      if (changed === 'canAddStock' || changed === 'canRemoveStock' || changed === 'canAdjustStock') {
        updates.canManageStock = allStockChildren;
      } else if (values.canManageStock && !allStockChildren) {
        updates.canAddStock = true;
        updates.canRemoveStock = true;
        updates.canAdjustStock = true;
      }

      if (!hasAnyStockChild && values.canManageStock) {
        updates.canManageStock = false;
      }
    }

    if (!Object.keys(updates).length) {
      return;
    }
    this.patchPermissionValues(updates);
  }

  private triggerSalaryEditRender(action: string): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
      console.log('[salary-edit] change detection triggered', { action });
    });
    console.log('[salary-edit] render ready', { action });
  }
}
