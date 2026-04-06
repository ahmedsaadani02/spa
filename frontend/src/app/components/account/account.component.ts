import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PermissionSet } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';

interface AccountCapability {
  label: string;
  active: boolean;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent {
  private readonly auth = inject(AuthService);

  get user() {
    return this.auth.currentUser();
  }

  get roleLabel(): string {
    const role = this.auth.role();
    if (role === 'developer') return 'Developpeur';
    if (role === 'owner') return 'Owner';
    if (role === 'admin') return 'Administrateur';
    return 'Employe';
  }

  get capabilitySummary(): AccountCapability[] {
    const permissions = this.auth.permissions();
    return [
      { label: 'Taches', active: permissions.manageTasks || permissions.receiveTasks },
      { label: 'Factures', active: permissions.manageInvoices },
      { label: 'Devis', active: permissions.manageQuotes },
      { label: 'Clients', active: permissions.manageClients },
      { label: 'Stock', active: permissions.viewStock },
      { label: 'Inventaire', active: permissions.manageInventory },
      { label: 'Mouvements', active: permissions.viewHistory },
      { label: 'Employes', active: permissions.manageEmployees },
      { label: 'Salaires', active: permissions.manageSalary }
    ].filter((capability) => capability.active);
  }

  get canOpenSettings(): boolean {
    return this.auth.hasPermission('manageEmployees');
  }

  hasPermission(permission: keyof PermissionSet): boolean {
    return this.auth.hasPermission(permission);
  }
}
