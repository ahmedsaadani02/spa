import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DASHBOARD_I18N } from '../../i18n/ui-i18n';
import { CaMensuelEntry, DashboardKpis } from '../../types/electron';
import { AuthService } from '../../services/auth.service';
import { IpcService } from '../../services/ipc.service';
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
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly ipc = inject(IpcService);
  private readonly language = inject(LanguageService);

  kpis: DashboardKpis | null = null;
  caMensuel: CaMensuelEntry[] = [];
  kpisLoading = true;
  kpisError = false;

  get ui() {
    return DASHBOARD_I18N[this.language.currentLanguage];
  }

  get viewKpis(): boolean {
    return this.auth.hasPermission('viewKpis');
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
    return this.language.isArabic ? 'السجل' : 'Historique';
  }

  get historyDescription(): string {
    return this.language.isArabic
      ? 'الاطلاع على سجل حركات المخزون والعمليات.'
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

  // ─── KPI display helpers ────────────────────────────────────────────────────

  get caMonthDisplay(): string {
    const v = this.kpis?.finance?.caMonthTtc;
    if (v == null) return '—';
    return this.formatCurrency(v);
  }

  get unpaidAmountDisplay(): string {
    const v = this.kpis?.finance?.invoicesUnpaidAmount;
    if (v == null) return '—';
    return this.formatCurrency(v);
  }

  get unpaidCountDisplay(): string {
    const v = this.kpis?.finance?.invoicesUnpaidCount;
    if (v == null) return '—';
    return String(v);
  }

  get quotesCountDisplay(): string {
    const v = this.kpis?.finance?.quotesThisMonth;
    if (v == null) return '—';
    return String(v);
  }

  get totalProductsDisplay(): string {
    const v = this.kpis?.stock?.totalProducts;
    if (v == null) return '—';
    return String(v);
  }

  get lowStockDisplay(): string {
    const v = this.kpis?.stock?.lowStockCount;
    if (v == null) return '—';
    return String(v);
  }

  get ruptureDisplay(): string {
    const v = this.kpis?.stock?.ruptureCount;
    if (v == null) return '—';
    return String(v);
  }

  get tasksTotalDisplay(): string {
    const v = this.kpis?.tasks?.totalTasks;
    if (v == null) return '—';
    return String(v);
  }

  get tasksInProgressDisplay(): string {
    const v = this.kpis?.tasks?.myTasksInProgress;
    if (v == null) return '—';
    return String(v);
  }

  get tasksLateDisplay(): string {
    const v = this.kpis?.tasks?.myTasksLate;
    if (v == null) return '—';
    return String(v);
  }

  get employeesActiveDisplay(): string {
    const v = this.kpis?.employees?.totalActive;
    if (v == null) return '—';
    return String(v);
  }

  // ─── CA chart helpers ────────────────────────────────────────────────────────

  get chartMax(): number {
    if (!this.caMensuel.length) return 1;
    return Math.max(...this.caMensuel.map((e) => e.ca), 1);
  }

  barHeightPct(ca: number): number {
    return Math.round((ca / this.chartMax) * 100);
  }

  formatMonthLabel(mois: string): string {
    // mois is "YYYY-MM"
    const [year, month] = mois.split('-');
    const monthNames: Record<string, string> = {
      '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
      '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc'
    };
    return `${monthNames[month] ?? month} ${year?.slice(2)}`;
  }

  formatCaTooltip(ca: number): string {
    return this.formatCurrency(ca);
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    await this.auth.ensureInitialized();
    await this.loadKpis();
  }

  private async loadKpis(): Promise<void> {
    this.kpisLoading = true;
    this.kpisError = false;

    try {
      const results = await Promise.allSettled([
        this.ipc.getDashboardKpis(),
        this.ipc.getCaMensuel()
      ]);

      const [kpisResult, caResult] = results;

      if (kpisResult.status === 'fulfilled') {
        this.kpis = kpisResult.value;
      } else {
        this.kpisError = true;
      }

      if (caResult.status === 'fulfilled') {
        this.caMensuel = caResult.value;
      }
    } catch {
      this.kpisError = true;
    } finally {
      this.kpisLoading = false;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' DA';
  }
}
