import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
const hasRequiredPermissions = (auth, permissions, mode) => {
    if (!permissions.length)
        return true;
    if (mode === 'all') {
        return permissions.every((permission) => auth.hasPermission(permission));
    }
    return permissions.some((permission) => auth.hasPermission(permission));
};
const isEmployeeAllowedRoute = (routePath) => routePath === 'stock';
export const permissionGuard = async (route) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ensureInitialized();
    if (!auth.isLoggedIn()) {
        return router.createUrlTree(['/login']);
    }
    const routePath = String(route.routeConfig?.path ?? '').toLowerCase();
    if (auth.role() === 'employee' && !isEmployeeAllowedRoute(routePath)) {
        return router.createUrlTree(['/stock']);
    }
    const permissions = route.data?.['permissions'] ?? [];
    const mode = route.data?.['permissionMode'] ?? 'any';
    if (hasRequiredPermissions(auth, permissions, mode)) {
        return true;
    }
    return router.createUrlTree(['/access-denied']);
};
export const roleGuard = permissionGuard;
export const redirectGuard = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ensureInitialized();
    if (!auth.isLoggedIn()) {
        return router.createUrlTree(['/login']);
    }
    return router.createUrlTree([auth.getDefaultRoute()]);
};
