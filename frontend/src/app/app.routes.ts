import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/routes').then((module) => module.AUTH_ROUTES),
  },
  {
    path: 'cadastro',
    loadChildren: () =>
      import('./features/customer/routes').then((module) => module.CUSTOMER_SIGNUP_ROUTES),
  },
  {
    path: 'minha-conta',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CUSTOMER'],
    },
    loadChildren: () =>
      import('./features/customer/routes').then((module) => module.CUSTOMER_ACCOUNT_ROUTES),
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
    path: 'carrinho',
    loadChildren: () => import('./features/cart/routes').then((module) => module.CART_ROUTES),
  },
  {
    path: 'checkout',
    loadChildren: () => import('./features/cart/routes').then((module) => module.CHECKOUT_ROUTES),
  },
  {
    path: 'minhas-compras',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CUSTOMER'],
    },
    loadChildren: () => import('./features/orders/routes').then((module) => module.ORDERS_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/catalog/routes').then((module) => module.CATALOG_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
