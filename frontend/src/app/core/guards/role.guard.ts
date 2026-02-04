import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { UserRole } from '../models/auth.models';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = (route.data?.['roles'] as UserRole[] | undefined) ?? [];
  const currentRole = authService.role();

  if (!currentRole) {
    return router.createUrlTree(['/login']);
  }

  if (expectedRoles.length === 0 || expectedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
