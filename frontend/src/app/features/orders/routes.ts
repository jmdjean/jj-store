import { Routes } from '@angular/router';
import { MyOrdersPageComponent } from './pages/my-orders-page.component';
import { OrderDetailPageComponent } from './pages/order-detail-page.component';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    component: MyOrdersPageComponent,
  },
  {
    path: ':orderId',
    component: OrderDetailPageComponent,
  },
];
