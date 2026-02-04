import { Routes } from '@angular/router';
import { CustomerProfilePageComponent } from './pages/customer-profile-page.component';
import { CustomerRegisterPageComponent } from './pages/customer-register-page.component';

export const CUSTOMER_SIGNUP_ROUTES: Routes = [
  {
    path: '',
    component: CustomerRegisterPageComponent,
  },
];

export const CUSTOMER_ACCOUNT_ROUTES: Routes = [
  {
    path: 'perfil',
    component: CustomerProfilePageComponent,
  },
];
