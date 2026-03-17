import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
export const authGuard = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.ensureInitialized();
    if (auth.isLoggedIn()) {
        return true;
    }
    return router.createUrlTree(['/login']);
};
