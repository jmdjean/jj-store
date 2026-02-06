import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type {
  AdminOrderStatusMutationResponse,
  AdminOrdersFilters,
  AdminOrdersListResponse,
  UpdateAdminOrderStatusPayload,
} from '../models/admin-orders.models';

@Injectable({
  providedIn: 'root',
})
export class AdminOrdersApiService {
  private readonly apiService = inject(ApiService);

  // Retrieves admin orders applying optional filters.
  getOrders(filters: AdminOrdersFilters) {
    return this.apiService.get<AdminOrdersListResponse>('/admin/orders', filters);
  }

  // Updates one order status by identifier.
  updateOrderStatus(orderId: string, payload: UpdateAdminOrderStatusPayload) {
    return this.apiService.put<AdminOrderStatusMutationResponse, UpdateAdminOrderStatusPayload>(
      `/admin/orders/${orderId}/status`,
      payload,
    );
  }
}
