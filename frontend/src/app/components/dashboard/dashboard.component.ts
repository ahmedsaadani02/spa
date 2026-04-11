import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DASHBOARD_I18N } from '../../i18n/ui-i18n';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

interface DashboardLink {
  label: string;
  route: string;
  description: string;
  visible: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);

  get ui() {
    return DASHBOARD_I18N[this.language.currentLanguage];
  }

  get displayName(): string {
    return this.auth.displayName() ?? this.auth.username() ?? (this.language.isArabic ? 'الفريق' : 'Equipe');
  }

  get roleLabel(): string {
    const role = this.auth.role();
    if (role === 'owner') return this.ui.roleOwner;
    if (role === 'admin') return this.ui.roleAdmin;
    if (role === 'developer') return this.ui.roleDeveloper;
    return this.ui.roleEmployee;
  }

  get historyLabel(): string {
    return this.language.isArabic ? 'Ø§Ù„Ø³Ø¬Ù„' : 'Historique';
  }

  get historyDescription(): string {
    return this.language.isArabic
      ? 'Ø§Ù„Ø§Ø·Ù„Ø§Ø¹ Ø¹Ù„Ù‰ Ø³Ø¬Ù„ Ø­Ø±ÙƒØ§Øª Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ§Øª.'
      : 'Consulter l historique des mouvements et operations de stock.';
  }

  get availableLinks(): DashboardLink[] {
    return [
      {
        label: this.ui.links.tasks,
        route: this.auth.hasPermission('manageTasks') ? '/tasks' : '/my-tasks',
        description: this.auth.hasPermission('receiveTasks') && !this.auth.hasPermission('manageTasks')
          ? this.ui.links.tasksMine
          : this.ui.links.tasksAdmin,
        visible: this.auth.hasPermission('manageTasks') || this.auth.hasPermission('receiveTasks')
      },
      {
        label: this.ui.links.invoices,
        route: '/invoices',
        description: this.ui.links.invoicesDesc,
        visible: this.auth.hasPermission('manageInvoices')
      },
      {
        label: this.ui.links.quotes,
        route: '/quotes',
        description: this.ui.links.quotesDesc,
        visible: this.auth.hasPermission('manageQuotes')
      },
      {
        label: this.ui.links.clients,
        route: '/clients',
        description: this.ui.links.clientsDesc,
        visible: this.auth.hasPermission('manageClients')
      },
      {
        label: this.ui.links.estimation,
        route: '/estimation',
        description: this.ui.links.estimationDesc,
        visible: this.auth.hasPermission('manageEstimations')
      },
      {
        label: this.ui.links.stock,
        route: '/stock',
        description: this.ui.links.stockDesc,
        visible: this.auth.hasPermission('viewStock')
      },
      {
        label: this.ui.links.inventory,
        route: '/inventaire',
        description: this.ui.links.inventoryDesc,
        visible: this.auth.hasPermission('manageInventory')
      },
      {
        label: this.historyLabel,
        route: '/movements',
        description: this.historyDescription,
        visible: this.auth.hasPermission('viewHistory')
      },
      {
        label: this.ui.links.employees,
        route: '/employees',
        description: this.ui.links.employeesDesc,
        visible: this.auth.hasPermission('manageEmployees') || this.auth.hasPermission('manageSalary')
      },
      {
        label: this.ui.links.archives,
        route: '/archives',
        description: this.ui.links.archivesDesc,
        visible: this.auth.hasPermission('manageArchives')
      }
    ].filter((item) => item.visible);
  }
}
