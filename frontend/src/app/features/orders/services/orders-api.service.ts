import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type {
  CancelMyOrderResponse,
  ListMyOrdersResponse,
  MyOrderDetail,
} from '../models/orders.models';

@Injectable({
  providedIn: 'root',
})
export class OrdersApiService {
  private readonly apiService = inject(ApiService);

  // Fetches authenticated customer orders with pagination.
  getOrders(page: number, pageSize: number) {
    return this.apiService.get<ListMyOrdersResponse>('/me/orders', {
      page,
      pageSize,
    });
  }

  // Fetches one authenticated customer order by identifier.
  getOrderById(orderId: string) {
    return this.apiService.get<MyOrderDetail>(`/me/orders/${orderId}`);
  }

  // Cancels one authenticated customer order by identifier.
  cancelOrder(orderId: string) {
    return this.apiService.post<CancelMyOrderResponse, Record<string, never>>(
      `/me/orders/${orderId}/cancel`,
      {},
    );
  }
}
