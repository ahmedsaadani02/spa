import { Routes } from '@angular/router';
import { InvoiceListComponent } from './components/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './components/invoice-form/invoice-form.component';
import { InvoicePreviewComponent } from './components/invoice-preview/invoice-preview.component';
import { authGuard } from './guards/auth.guard';
import { redirectGuard, roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: '', canActivate: [redirectGuard], loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },

  { path: 'invoices', component: InvoiceListComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'invoices/new', component: InvoiceFormComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },

  // Variantes (au cas ou)
  { path: 'invoices/:id/edit', component: InvoiceFormComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'invoices/:id/preview', component: InvoicePreviewComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },

  // Fallback si ton projet utilise l'autre format
  { path: 'invoices/preview/:id', component: InvoicePreviewComponent, canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },

  { path: 'quotes', loadComponent: () => import('./components/quote-list/quote-list.component').then(m => m.QuoteListComponent), canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'quotes/new', loadComponent: () => import('./components/quote-form/quote-form.component').then(m => m.QuoteFormComponent), canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'quotes/:id/edit', loadComponent: () => import('./components/quote-form/quote-form.component').then(m => m.QuoteFormComponent), canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'quotes/:id/preview', loadComponent: () => import('./components/quote-preview/quote-preview.component').then(m => m.QuotePreviewComponent), canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },

  { path: 'estimation', loadComponent: () => import('./components/estimation/estimation.component').then(m => m.EstimationComponent), canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'stock/history', loadComponent: () => import('./components/stock-history/stock-history.component').then(m => m.StockHistoryComponent), canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'stock', pathMatch: 'full', loadComponent: () => import('./components/stock/stock.component').then(m => m.StockComponent), canActivate: [authGuard] },

  { path: '**', canActivate: [redirectGuard], loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) }
];
