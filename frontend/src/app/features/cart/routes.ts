import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { CartPageComponent } from './pages/cart-page.component';
import { CheckoutPageComponent } from './pages/checkout-page.component';

/** Used under path: 'carrinho' so that /carrinho shows the cart page. */
export const CART_ROUTES: Routes = [
  {
    path: '',
    component: CartPageComponent,
  },
];

/** Used under path: 'checkout' so that /checkout shows the checkout page. */
export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    component: CheckoutPageComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CUSTOMER'],
    },
  },
];
