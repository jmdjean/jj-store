import { Routes } from '@angular/router';
import { AdminPageComponent } from './pages/admin-page.component';
import { AdminProductsPageComponent } from './pages/admin-products-page.component';
import { AdminProductFormPageComponent } from './pages/admin-product-form-page.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminPageComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'produtos',
      },
      {
        path: 'produtos',
        component: AdminProductsPageComponent,
      },
      {
        path: 'produtos/novo',
        component: AdminProductFormPageComponent,
      },
      {
        path: 'produtos/:id/editar',
        component: AdminProductFormPageComponent,
      },
    ],
  },
];
