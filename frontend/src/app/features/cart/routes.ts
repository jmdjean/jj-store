import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { CartPageComponent } from './pages/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout-page.component';

export const CART_ROUTES: Routes = [
  {
    path: 'carrinho',
    component: CartPageComponent,
  },
  {
    path: 'checkout',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CUSTOMER'],
    },
    component: CheckoutPageComponent,
  },
];
