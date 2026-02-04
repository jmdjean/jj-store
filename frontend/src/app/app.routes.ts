import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'MANAGER'],
    },
    loadChildren: () => import('./features/admin/routes').then((module) => module.ADMIN_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/home/routes').then((module) => module.HOME_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
