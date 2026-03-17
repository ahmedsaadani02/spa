import { Routes } from '@angular/router';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';
import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';
import { InvoicePreviewComponent } from './components/invoice-preview/invoice-preview.component';
import { authGuard } from './guards/auth.guard';
import { permissionGuard, redirectGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent) },
  { path: '', canActivate: [redirectGuard], loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent) },

  { path: 'access-denied', canActivate: [authGuard], loadComponent: () => import('./components/access-denied/access-denied.component').then((m) => m.AccessDeniedComponent) },

  { path: 'invoices', component: InvoiceListComponent, canActivate: [authGuard, permissionGuard], data: { permissions: ['manageInvoices'] } },
  { path: 'invoices/new', component: InvoiceFormComponent, canActivate: [authGuard, permissionGuard], data: { permissions: ['manageInvoices'] } },
  { path: 'invoices/:id/edit', component: InvoiceFormComponent, canActivate: [authGuard, permissionGuard], data: { permissions: ['manageInvoices'] } },
  { path: 'invoices/:id/preview', component: InvoicePreviewComponent, canActivate: [authGuard, permissionGuard], data: { permissions: ['manageInvoices'] } },
  { path: 'invoices/preview/:id', component: InvoicePreviewComponent, canActivate: [authGuard, permissionGuard], data: { permissions: ['manageInvoices'] } },

  { path: 'quotes', loadComponent: () => import('./components/quote-list/quote-list.component').then((m) => m.QuoteListComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageQuotes'] } },
  { path: 'quotes/new', loadComponent: () => import('./components/quote-form/quote-form.component').then((m) => m.QuoteFormComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageQuotes'] } },
  { path: 'quotes/:id/edit', loadComponent: () => import('./components/quote-form/quote-form.component').then((m) => m.QuoteFormComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageQuotes'] } },
  { path: 'quotes/:id/preview', loadComponent: () => import('./components/quote-preview/quote-preview.component').then((m) => m.QuotePreviewComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageQuotes'] } },

  { path: 'clients', loadComponent: () => import('./components/clients/clients.component').then((m) => m.ClientsComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageClients'] } },
  { path: 'estimation', loadComponent: () => import('./components/estimation/estimation.component').then((m) => m.EstimationComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageEstimations'] } },

  { path: 'stock', pathMatch: 'full', loadComponent: () => import('./components/stock/stock.component').then((m) => m.StockComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['viewStock'] } },
  { path: 'stock/archives', loadComponent: () => import('./components/stock-archives/stock-archives.component').then((m) => m.StockArchivesComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageArchives'] } },
  { path: 'stock/history', loadComponent: () => import('./components/stock-history/stock-history.component').then((m) => m.StockHistoryComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['viewHistory'] } },
  { path: 'inventaire', loadComponent: () => import('./components/inventaire/inventaire.component').then((m) => m.InventaireComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageInventory'] } },

  { path: 'employees', loadComponent: () => import('./components/employees/employee-list.component').then((m) => m.EmployeeListComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageEmployees', 'manageSalary'], permissionMode: 'any' } },
  { path: 'employees/new', loadComponent: () => import('./components/employees/employee-form.component').then((m) => m.EmployeeFormComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageEmployees'] } },
  { path: 'employees/:id/edit', loadComponent: () => import('./components/employees/employee-form.component').then((m) => m.EmployeeFormComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageEmployees'] } },
  { path: 'employees/:id', loadComponent: () => import('./components/employees/employee-detail.component').then((m) => m.EmployeeDetailComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageSalary'] } },

  { path: 'settings', loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent), canActivate: [authGuard, permissionGuard], data: { permissions: ['manageEmployees'] } },

  { path: '**', canActivate: [redirectGuard], loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent) }
];
