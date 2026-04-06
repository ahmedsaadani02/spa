import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionSet } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

type GuardPermission = keyof PermissionSet;

const hasRequiredPermissions = (
  auth: AuthService,
  permissions: GuardPermission[],
  mode: 'all' | 'any'
): boolean => {
  if (!permissions.length) return true;
  if (mode === 'all') {
    return permissions.every((permission) => auth.hasPermission(permission));
  }
  return permissions.some((permission) => auth.hasPermission(permission));
};

export const permissionGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const permissions = (route.data?.['permissions'] as GuardPermission[] | undefined) ?? [];
  const mode = (route.data?.['permissionMode'] as 'all' | 'any' | undefined) ?? 'any';
  if (hasRequiredPermissions(auth, permissions, mode)) {
    return true;
  }

  return router.createUrlTree(['/access-denied']);
};

export const roleGuard = permissionGuard;

export const standardEmployeeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const isStandardEmployee = auth.role() === 'employee'
    && auth.hasPermission('receiveTasks')
    && !auth.hasPermission('manageTasks');

  if (isStandardEmployee) {
    return true;
  }

  return router.createUrlTree(['/access-denied']);
};

export const redirectGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureInitialized();

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  return router.createUrlTree([auth.getDefaultRoute()]);
};
