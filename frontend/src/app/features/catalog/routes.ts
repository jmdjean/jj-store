import { Routes } from '@angular/router';
import { CatalogPageComponent } from './pages/catalog-page.component';
import { ProductDetailPageComponent } from './pages/product-detail-page.component';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    component: CatalogPageComponent,
  },
  {
    path: 'produtos/:id',
    component: ProductDetailPageComponent,
  },
];
