import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

type UserRole = 'admin' | 'employee';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.role();
  const allowed = (route.data?.['roles'] as UserRole[] | undefined) ?? [];

  if (!role || (allowed.length > 0 && !allowed.includes(role))) {
    return router.createUrlTree([role === 'employee' ? '/stock' : '/invoices']);
  }

  return true;
};

export const redirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.role();
  if (!role) {
    return router.createUrlTree(['/login']);
  }

  return router.createUrlTree([role === 'employee' ? '/stock' : '/invoices']);
};
